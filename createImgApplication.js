require('dotenv').config();
const OpenAI = require('openai');
const ProjectCoordinator = require('./projectCoordinator');
const UserModel = require('./User.schema');
const { TaskProcessor } = require('./taskProcessor');
const { extractJsonArray } = require('./utilities/functions');
const {
    generateModificationPrompt,
    generateTaskGenerationPrompt,
    replyUserWithImage,
    generateWebAppPrompt,
} = require('./promptUtils');
const ExecutionManager = require('./executionManager');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Utility function for OpenAI API calls
async function openAiChatCompletion(userId, systemPrompt, url) {
    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                {
                    role: 'user',
                    content: [
                        { type: 'text', text: systemPrompt },
                        {
                            type: 'image_url',
                            image_url: {
                                url: url,
                            },
                        },
                    ],
                },
            ],
        });
        console.log('checking');
        const rawResponse = response.choices[0].message.content.trim();
        await UserModel.addTokenCountToUserSubscription(userId, rawResponse);
        return rawResponse;
    } catch (error) {
        console.error('OpenAI API Error:', error);
        return undefined; // Return undefined in case of error
    }
}

// Function to handle image-related tasks
async function handleImages(userMessage, userId, projectId, url) {
    try {
        const selectedProject = await UserModel.getUserProject(
            userId,
            projectId
        );
        const { taskList, projectOverView } = selectedProject;
        const conversations = await UserModel.getUserMessages(
            userId,
            projectId
        );
        const conversationHistory = conversations.map(({ role, content }) => ({
            role,
            content,
        }));

        const systemPrompt = replyUserWithImage(
            conversationHistory,
            projectOverView,
            userMessage,
            taskList
        );
        await UserModel.addTokenCountToUserSubscription(userId, systemPrompt);

        const response = await openAiChatCompletion(userId, systemPrompt, url);
        return await analyzeResponse(
            response,
            userId,
            projectId,
            url,
            userMessage
        );
    } catch (error) {
        console.error('Error in handleImages:', error);
        return undefined; // Return undefined in case of error
    }
}

// Function to pick tasks based on a message
async function tasksPicker(
    message,
    projectId,
    conversationContext,
    taskList,
    userId,
    url
) {
    try {
        const projectCoordinator = new ProjectCoordinator(userId, projectId);
        const logs = await UserModel.getProjectLogs(userId, projectId);
        const prompt = generateModificationPrompt(
            message,
            conversationContext,
            taskList,
            logs
        );

        await UserModel.addTokenCountToUserSubscription(userId, prompt);
        const rawArray = await openAiChatCompletion(userId, prompt, url);
        return await parseAndFetchTaskContents(rawArray, projectId);
    } catch (error) {
        console.error('Error in tasksPicker:', error);
        await handleTasksPickerError(error, rawArray, userId, projectId);
        return [];
    }
}

// Function to parse and fetch task contents
async function parseAndFetchTaskContents(rawArray, projectId) {
    try {
        const jsonArrayString = extractJsonArray(rawArray);
        const parsedArray = JSON.parse(jsonArrayString);
        return await fetchTaskContents(parsedArray, projectId);
    } catch (error) {
        console.error('Error parsing and fetching task contents:', error);
        throw error;
    }
}

// Function to fetch task contents
async function fetchTaskContents(parsedArray, projectId) {
    const results = [];
    for (const task of parsedArray) {
        try {
            const content = await getTaskContent(task, projectId);
            results.push({ ...task, content });
        } catch (error) {
            console.error('Error fetching content for task:', error);
        }
    }
    return results;
}

// Function to get task content from the file system
async function getTaskContent(taskDetails, projectId) {
    const { name, extension } = taskDetails;
    const workspaceDir = path.join(__dirname, 'workspace', projectId);
    const filePath = path.join(
        workspaceDir,
        `${name.replace(/\.[^.]*/, '')}.${extension}`
    );
    return await fsPromises.readFile(filePath, 'utf8');
}

// Function to find the first array in the given data
async function findFirstArray(data) {
    if (Array.isArray(data)) return data;
    if (typeof data === 'object' && data !== null) {
        return Object.values(data).find(Array.isArray) || [data];
    }
    return [data];
}

// Function to handle tasks picker error
async function handleTasksPickerError(error, rawArray, userId, projectId) {
    try {
        const jsonArrayString = extractJsonArray(rawArray);
        const projectCoordinator = new ProjectCoordinator(userId, projectId);
        const formattedJson = await projectCoordinator.JSONFormatter(
            jsonArrayString,
            `Error parsing JSON: ${error}`
        );
        const parsedArray = await findFirstArray(formattedJson);
        return await fetchTaskContents(parsedArray, projectId);
    } catch (formattingError) {
        console.error('Error handling tasks picker error:', formattingError);
    }
}

// Function to analyze the response from OpenAI
async function analyzeResponse(response, userId, projectId, url, userMessage) {
    const selectedProject = await UserModel.getUserProject(userId, projectId);
    const { taskList, projectOverView, appName } = selectedProject;
    const projectCoordinator = new ProjectCoordinator(userId, projectId);
    const conversations = await UserModel.getUserMessages(userId, projectId);
    const conversationHistory = conversations.map(({ role, content }) => ({
        role,
        content,
    }));
    const taskProcessor = new TaskProcessor(
        appName,
        projectOverView,
        projectId,
        taskList,
        userId
    );

    if (response === 'getRequirements') {
        return 'getRequirements';
    } else if (response === 'createApplication') {
        return await handleCreateApplication(
            conversationHistory,
            userId,
            projectId,
            url,
            projectCoordinator
        );
    } else if (response === 'modifyApplication') {
        return await handleModifyApplication(
            userMessage,
            projectId,
            conversationHistory,
            taskList,
            userId,
            url,
            taskProcessor
        );
    }
}

// Function to handle creating an application
async function handleCreateApplication(
    conversationHistory,
    userId,
    projectId,
    url,
    projectCoordinator
) {
    const prompt = generateWebAppPrompt(conversationHistory, true);
    await UserModel.addTokenCountToUserSubscription(userId, prompt);

    const rawArray = await openAiChatCompletion(userId, prompt, url);
    const jsonArrayString = await extractJsonArray(rawArray);
    try {
        const parsedArray = JSON.parse(jsonArrayString);
        const refinedList = await findFirstArray(parsedArray);
        await projectCoordinator.generateTaskList(refinedList, userId);
        const selectedProject = await UserModel.getUserProject(
            userId,
            projectId
        );
        let { taskList, appName } = selectedProject;
        await executeTasks(
            appName,
            userId,
            projectId,
            taskList,
            selectedProject
        );
        return `Great news! Your project has been built successfully. You can check it out at http://localhost:5001/${projectId}. If you need any adjustments, just let me know and I'll take care of it for you.`;
    } catch (error) {
        return await handleCreateApplicationError(
            error,
            jsonArrayString,
            projectCoordinator,
            userId,
            projectId
        );
    }
}

// Function to handle create application error
async function handleCreateApplicationError(
    error,
    jsonArrayString,
    projectCoordinator,
    userId,
    projectId
) {
    const formattedJson = await projectCoordinator.JSONFormatter(
        jsonArrayString,
        `Error parsing JSON: ${error}`
    );
    try {
        const parsedArray = await findFirstArray(formattedJson);
        await projectCoordinator.generateTaskList(parsedArray, userId);
        const selectedProject = await UserModel.getUserProject(
            userId,
            projectId
        );
        let { taskList, appName } = selectedProject;
        await executeTasks(
            appName,
            userId,
            projectId,
            taskList,
            selectedProject
        );
        return `Great news! Your project has been built successfully. You can check it out at http://localhost:5001/${projectId}. If you need any adjustments, just let me know and I'll take care of it for you.`;
    } catch (formattingError) {
        console.error(
            'Error handling create application error:',
            formattingError
        );
    }
}

// Function to execute tasks
async function executeTasks(
    appName,
    userId,
    projectId,
    taskList,
    selectedProject
) {
    const updatedProjectAfterTasks = await UserModel.getUserProject(
        userId,
        projectId
    );
    taskList = updatedProjectAfterTasks.taskList;

    const developerAssistant = new ExecutionManager(
        taskList,
        projectId,
        userId
    );
    await developerAssistant.executeTasks(appName, userId);

    const projectCoordinator = new ProjectCoordinator(userId, projectId);
    await projectCoordinator.logStep('All tasks have been executed.');
    await UserModel.clearSketchesFromProject(userId, selectedProject.id);
}

// Function to handle modifying an application
async function handleModifyApplication(
    userMessage,
    projectId,
    conversationHistory,
    taskList,
    userId,
    url,
    taskProcessor
) {
    const relevantTasks = await tasksPicker(
        userMessage,
        projectId,
        conversationHistory,
        taskList,
        userId,
        url
    );
    const systemPrompt = generateTaskGenerationPrompt(
        projectOverView,
        conversationHistory,
        taskList,
        [],
        relevantTasks,
        true
    );

    await UserModel.addTokenCountToUserSubscription(userId, systemPrompt);
    const msg = `The user's message ${userMessage}\n\n${systemPrompt}`;
    const rawArray = await exponentialBackoff(() =>
        openAiChatCompletion(userId, msg, url)
    );

    const jsonArrayString = extractJsonArray(rawArray);
    try {
        const parsedArray = JSON.parse(jsonArrayString);

        for (const task of parsedArray) {
            try {
                await taskProcessor.processTasks(userId, task);
            } catch (error) {
                console.error('Error processing task:', error);
            }
        }

        return 'I have finished modifying your application as requested.';
    } catch (error) {
        return await handleModifyApplicationError(
            error,
            rawArray,
            taskProcessor,
            projectId
        );
    }
}

// Function to handle modify application error
async function handleModifyApplicationError(
    error,
    rawArray,
    taskProcessor,
    projectId
) {
    try {
        const jsonArrayString = extractJsonArray(rawArray);
        const projectCoordinator = new ProjectCoordinator(userId, projectId);
        const formattedJson = await projectCoordinator.JSONFormatter(
            jsonArrayString,
            `Error parsing JSON: ${error}`
        );
        const parsedArray = await findFirstArray(formattedJson);

        for (const task of parsedArray) {
            try {
                await taskProcessor.processTasks(userId, task);
            } catch (error) {
                console.error('Error processing task:', error);
            }
        }

        return 'I have finished modifying your application as requested.';
    } catch (formattingError) {
        console.error(
            'Error handling modify application error:',
            formattingError
        );
    }
}

module.exports = { handleImages };
