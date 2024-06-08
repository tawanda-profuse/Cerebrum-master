require('dotenv').config();
const puppeteer = require('puppeteer');
const { spawn } = require('child_process');
const OpenAI = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const Queue = require('bull');
const { handleIssues } = require('./gptActions');
const User = require('./User.schema');
const ProjectCoordinator = require('./projectCoordinator');
const http = require('http');
const Redis = require('ioredis');
const { runTests } = require('./runTests');

// Initialize Redis client
const redisClient = new Redis();

async function autonomousRun(projectId) {
    try {
        await runTests(projectId);
        console.log('Tests completed successfully');
    } catch (error) {
        console.error(`Failed to run tests: ${error.message}`);
    }
}

// Initialize the queue and connect to Redis
const errorQueue = new Queue('errorQueue', {
    redis: {
        host: '127.0.0.1', // Redis server host
        port: 6379, // Redis server port
    },
    defaultJobOptions: {
        attempts: 3, // Number of retry attempts
        backoff: {
            type: 'exponential', // Retry strategy
            delay: 5000, // Initial delay in ms
        },
    },
});

// Log any queue errors
errorQueue.on('error', (error) => {
    console.error('Queue error:', error);
});

// Log failed jobs
errorQueue.on('failed', (job, err) => {
    console.error(`Job failed with id ${job.id} and error ${err.message}`);
});

// In-memory cache to store recent errors per user
const recentErrors = {};
const errorExpiryTime = 60000; // 60 seconds

// Debounce time for job additions
const debounceTime = 1000;

async function isServerRunning(url) {
    return new Promise((resolve) => {
        http.get(url, (res) => {
            resolve(res.statusCode === 200);
        }).on('error', () => {
            resolve(false);
        });
    });
}

let browserInstance = null;
let browserPage = null;

async function incrementUnresolvedIssues(projectId) {
    const count = await redisClient.incr(`unresolvedIssues:${projectId}`);
    return count;
}

async function decrementUnresolvedIssues(projectId) {
    const count = await redisClient.decr(`unresolvedIssues:${projectId}`);
    return count;
}

async function resolveStartIssues(dataStr, projectId, userId) {
    if (!recentErrors[userId]) {
        recentErrors[userId] = new Set();
    }

    const normalizedDataStr = dataStr.trim().replace(/\r\n/g, '\n');

    if (recentErrors[userId].has(normalizedDataStr)) {
        return;
    }
    recentErrors[userId].add(normalizedDataStr);
    setTimeout(
        () => recentErrors[userId].delete(normalizedDataStr),
        errorExpiryTime
    );

    const selectedProject = User.getUserProject(userId, projectId)[0];

    if (!selectedProject) {
        console.error(
            'No project found for user:',
            userId,
            'and project:',
            projectId
        );
        return;
    }

    await incrementUnresolvedIssues(projectId);

    let { taskList, projectOverView } = selectedProject;
    const workspaceDir = path.join(__dirname, 'workspace');
    const appPath = path.join(workspaceDir, projectId);

    try {
        const resolutionSuggestion = await getResolutionSuggestion(
            normalizedDataStr,
            appPath,
            projectOverView,
            taskList
        );
        await handleIssues(resolutionSuggestion, projectId, userId);

        // Decrement unresolved issues count and check if all issues are resolved
        const remainingIssues = await decrementUnresolvedIssues(projectId);
        if (remainingIssues === 0 || remainingIssues === 1) {
            // Call this function wherever appropriate in your autonomous system
            await autonomousRun(projectId);
        }
    } catch (error) {
        console.error(`Error in resolving issue: ${error.message}`);
        await decrementUnresolvedIssues(projectId); // Ensure the count is decremented on failure
    }
}

async function getResolutionSuggestion(
    errorInfo,
    projectPath,
    projectOverview,
    taskList
) {
    const prompt = `
    You are an AI agent in a Node.js autonomous system that creates HTML  projects using Tailwind CSS. Your role is to concisely communicate issues or errors to an agent responsible for creating task objects to resolve them.

    Details:
    - Issue: ${errorInfo}
    - Project Overview: ${projectOverview}
    - Task List: ${JSON.stringify(taskList, null, 2)}

    Objectives:
    1. Thoroughly analyze the Task List, paying special attention to the componentCodeAnalysis property, which contains an analysis of all the code inside the project, as well as the toDo property.
    2. Review the Project Overview and project files for additional context.
    3. Interpret the issue in detail.
    4. Identify the specific file path requiring attention.
    5. Describe the issue clearly and concisely.
    6. Focus on files listed in the Task List, HTML, CSS, JS files, and Tailwind config file.
    7. Suggest alternative logic for imports not in the Task List.
    8. Do not suggest creating new components.
    9. Ensure concise issue descriptions.

    *TAKE YOUR TIME AND ALSO MENTALLY THINK THROUGH THIS STEP BY STEP TO PROVIDE THE MOST ACCURATE AND EFFECTIVE RESULT*
    `;

    const response = await openai.chat.completions.create({
        model: 'gpt-4',
        temperature: 0,
        messages: [
            {
                role: 'system',
                content: prompt,
            },
        ],
    });

    const aiResponse = response.choices[0].message.content.trim();
    return aiResponse;
}

async function monitorHTMLServer(appPath, projectId, userId) {
    return new Promise((resolve, reject) => {
        const serverProcess = spawn('npx', ['live-server'], {
            cwd: appPath,
            shell: true,
        });

        let stdoutDebounce;
        let stderrDebounce;
        let issueDetected = false;

        serverProcess.stdout.on('data', (data) => {
            const dataStr = data.toString('utf8');
            clearTimeout(stdoutDebounce);
            stdoutDebounce = setTimeout(() => {
                errorQueue.add(
                    { data: dataStr, projectId, isError: false, userId },
                    { jobId: `${projectId}-${Date.now()}-stdout` }
                );
                issueDetected = true;
            }, debounceTime);
        });

        serverProcess.stderr.on('data', (data) => {
            const dataStr = data.toString('utf8');
            clearTimeout(stderrDebounce);
            stderrDebounce = setTimeout(() => {
                errorQueue.add(
                    { data: dataStr, projectId, isError: true, userId },
                    { jobId: `${projectId}-${Date.now()}-stderr` }
                );
                issueDetected = true;
            }, debounceTime);
        });

        serverProcess.on('close', (code) => {
            if (code !== 0) {
                reject(new Error(`live-server process exited with code ${code}`));
            } else {
                resolve();
            }
        });

        setTimeout(async () => {
            if (!issueDetected) {
                // No issues detected, proceed to run tests
                console.log('no issues detected');
                await autonomousRun(projectId);
                resolve();
            }
        }, 10000); // 10 seconds timeout to check for issues
    });
}

errorQueue.process(async (job, done) => {
    const { data, projectId, isError, userId } = job.data;
    try {
        await handleServerOutput(data, projectId, userId);
        done();
    } catch (error) {
        console.error(`Error processing job: ${error.message}`);
        done(error);
    }
});

async function handleServerOutput(data, projectId, userId) {
    let dataStr;
    if (Buffer.isBuffer(data)) {
        dataStr = data.toString('utf8');
    } else if (typeof data === 'object') {
        dataStr = JSON.stringify(data, null, 2);
    } else {
        dataStr = data.toString();
    }

    const projectCoordinator = new ProjectCoordinator(openai, projectId);
    const isErrorCritical = await projectCoordinator.isCriticalError(dataStr);

    if (isErrorCritical) {
        await resolveStartIssues(dataStr, projectId, userId);
    } else {
        const url = `http://localhost:8080`;
        const serverRunning = await isServerRunning(url);

        if (serverRunning) {
            await monitorBrowserConsoleErrors(url, projectId, userId);
        } else {
            console.error(`Server is not running at ${url}`);
        }
    }
}

async function monitorBrowserConsoleErrors(url, projectId, userId) {
    if (browserInstance) {
        return; // If a browser instance already exists, don't create a new one
    }

    browserInstance = await puppeteer.launch({ headless: true });
    browserPage = await browserInstance.newPage();

    // In-memory cache to store recent browser errors per user
    if (!recentErrors[userId]) {
        recentErrors[userId] = new Set();
    }
    let lastError = null;

    browserPage.on('pageerror', async (err) => {
        if (!err) return;
        const errMsg = err.toString();
        if (recentErrors[userId].has(errMsg)) {
            return;
        }
        setTimeout(() => recentErrors[userId].delete(errMsg), errorExpiryTime);

        // Check if the error is the same as the last processed error
        if (lastError === errMsg) {
            return;
        }

        lastError = errMsg;
        await resolveStartIssues(errMsg, projectId, userId);
    });

    await browserPage.goto(url);

    // Close browser after a period of inactivity
    setTimeout(() => {
        if (browserInstance) {
            browserInstance.close();
            browserInstance = null;
            browserPage = null;
        }
    }, errorExpiryTime);
}

module.exports = {
    monitorHTMLServer,
};
