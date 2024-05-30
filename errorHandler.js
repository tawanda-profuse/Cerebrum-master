require('dotenv').config();
const puppeteer = require('puppeteer');
const { spawn } = require('child_process');
const OpenAI = require('openai');
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});
const { handleIssues } = require('./gptActions');
const ProjectCoordinator = require('./projectCoordinator');
const User = require('./User.schema');
const http = require('http');

async function isServerRunning(url) {
    return new Promise((resolve) => {
        http.get(url, (res) => {
            resolve(res.statusCode === 200);
        }).on('error', () => {
            resolve(false);
        });
    });
}


const maxRetries = 5;
const errorRetryCounts = new Map();

async function resolveStartIssues(dataStr, projectId, userId) {
    try {
        const retryCount = errorRetryCounts.get(dataStr) || 0;

        if (retryCount >= maxRetries) {
            console.error(`Max retries reached for error: ${dataStr}`);
            return;
        }

        const resolutionSuggestion = await getResolutionSuggestion(dataStr);
        await handleIssues(resolutionSuggestion, projectId, userId);
        errorRetryCounts.set(dataStr, retryCount + 1); // Increment retry count for this error
    } catch (error) {
        console.error(`Error in resolveStartIssues: ${error.message}`);
        // Handle errors appropriately
    }
}

async function getResolutionSuggestion(errorInfo) {
    const prompt = `You are an AI agent within a Node.js autonomous system, responsible for creating beautiful and elegant React web applications from user prompts. Your primary role is error handling. When you encounter an error, communicate this error to another agent specializing in creating task objects for resolving such issues. To do this effectively, interpret the error in detail, identify the specific file path that requires attention, and describe the issue clearly to the AI system.

        Error Message: ${errorInfo}
        `;

    const response = await openai.chat.completions.create({
        model: 'gpt-4o',
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

async function manageReactServer(appPath, projectId, userId) {
        return new Promise((resolve, reject) => {
            const serverProcess = spawn('npm', ['start'], {
                cwd: appPath,
                shell: true,
            });

            serverProcess.stdout.on('data', (data) => {
                handleServerOutput(data, projectId, false, userId).catch(
                    console.error
                );
            });

            serverProcess.stderr.on('data', (data) => {
                handleServerOutput(data, projectId, true, userId).catch(
                    console.error
                );
            });

            serverProcess.on('close', (code) => {
                if (code !== 0) {
                    reject(
                        new Error(`npm start process exited with code ${code}`)
                    );
                } else {
                    resolve();
                }
            });
        });
}

async function handleServerOutput(data, projectId, isError, userId) {
    const dataStr = data.toString();
    console[isError ? 'error' : 'log'](
        `Server ${isError ? 'Error' : 'Output'}: ${dataStr}`
    );

    const projectCoordinator = new ProjectCoordinator(openai, projectId);
    const isErrorCritical = await projectCoordinator.isCriticalError(dataStr);

    if (isErrorCritical) {
        const retryCount = errorRetryCounts.get(dataStr) || 0;

        if (retryCount >= maxRetries) {
            console.error(`Max retries reached for error: ${dataStr}`);
            return;
        }

        await resolveStartIssues(dataStr, projectId, userId);
        errorRetryCounts.set(dataStr, retryCount + 1); // Increment retry count for this error

        // Retry handling server output after resolving issues
        handleServerOutput(data, projectId, isError, userId).catch(console.error);
    } // else if (/\[eslint\]/.test(dataStr)) { await resolveStartIssues(dataStr, projectId, userId);} 
    else {
        const url = 'http://localhost:3000'; // Replace with the actual URL of your app
        const serverRunning = await isServerRunning(url);

        if (serverRunning) {
            await monitorBrowserConsoleErrors(url, projectId, userId);
        } else {
            console.error(`Server is not running at ${url}`);
        }
        
    }
}

async function monitorBrowserConsoleErrors(url, projectId, userId) {
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    const projectCoordinator = new ProjectCoordinator(openai, projectId);

    page.on('console', async (msg) => {
        const errorText = msg.text().trim();

        if (!errorText) {
            console.log('no broswer error')
            return;
        }

        console.log('errorText',errorText)

        const isErrorCritical = await projectCoordinator.isCriticalError(errorText);

        console.log('is the error critical',isErrorCritical )

        if (isErrorCritical) {
            console.log('found some broswer error')
            await resolveStartIssues(errorText, projectId, userId);
            console.log('resolved browser issue')
        }
    });

    await page.goto(url);
    
    // Add any additional page interactions or wait conditions here
    await new Promise(resolve => setTimeout(resolve, 60000)); // Wait for 60 seconds

    await browser.close();
}


async function runPlaywrightTests() {
    try {
        // Add your Playwright test running code here
    } catch (error) {
        console.error(`Error running Playwright tests: ${error.message}`);
        // Handle test execution errors if needed
    }
}

module.exports = {
    manageReactServer,
    resolveStartIssues,
};
