require('dotenv').config();
const ProjectCoordinator = require('./classes/projectCoordinator');
const ExecutionManager = require('./classes/executionManager');
const UserModel = require('./models/User.schema');
const { extractJsonArray } = require('./utilities/functions');
const aIChatCompletion = require('./ai_provider');
const {
    generateSentimentAnalysisPrompt,
    generateConversationPrompt,
    generateModificationPrompt,
    generateTaskGenerationPrompt,
    generateRequirementsPrompt
} = require('./utilities/promptUtils');
const { updateImageInDataJson } = require('./utilities/updateImageInDataJson');
const { monitorBrowserConsoleErrors } = require('./ErrorHandler/scrapper');
const s3FileManager = require('./s3FileManager');
const env = process.env.NODE_ENV || 'development';
const baseURL =
    env === 'production' ? process.env.PROD_URL : process.env.LOCAL_URL;

// Centralized error handling
async function handleError(error, context, userId, projectId) {
    console.error(`Error in ${context}:`, error);
    return 'error';
}

async function handleActions(userMessage, userId, projectId) {
    try {
        const conversations = await UserModel.getUserMessages(
            userId,
            projectId
        );
        const selectedProject = await UserModel.getUserProject(
            userId,
            projectId
        );
        const conversationHistory = conversations.map(({ role, content }) => ({
            role,
            content,
        }));
        const { sketches, taskList } = selectedProject;
        if (sketches && sketches.length > 0) {
            return 'handleImages';
        } else {
            const systemPrompt = generateSentimentAnalysisPrompt(
                conversationHistory,
                taskList
            );
            const totalMsg = `System Prompt:${systemPrompt}\nUser Message:${userMessage}`;
            return await aIChatCompletion({
                userId: userId,
                systemPrompt: totalMsg,
            });
        }
    } catch (error) {
        return handleError(error, 'handleActions', userId, projectId);
    }
}

async function handleUserReply(userMessage, userId, projectId) {
    try {
        const conversations = await UserModel.getUserMessages(
            userId,
            projectId
        );
        const conversationHistory = conversations.map(({ role, content }) => ({
            role,
            content,
        }));
        const systemPrompt = generateConversationPrompt(
            conversationHistory,
            userMessage
        );
        return await aIChatCompletion({
            userId: userId,
            systemPrompt: systemPrompt,
        });
    } catch (error) {
        return handleError(error, 'handleUserReply', userId, projectId);
    }
}

async function handleGetRequirements(userMessage, userId, projectId) {
    try {
        const conversations = await UserModel.getUserMessages(
            userId,
            projectId
        );
        const conversationHistory = conversations.map(({ role, content }) => ({
            role,
            content,
        }));
        const systemPrompt = generateRequirementsPrompt(
            conversationHistory,
            userMessage
        );
        return await aIChatCompletion({
            userId: userId,
            systemPrompt: systemPrompt,
        });
    } catch (error) {
        return handleError(error, 'handleGetRequirements', userId, projectId);
    }
}

async function handleImageGetRequirements(userMessage, userId, projectId, url) {
    try {
        const conversations = await UserModel.getUserMessages(
            userId,
            projectId
        );
        const conversationHistory = conversations.map(({ role, content }) => ({
            role,
            content,
        }));
        const systemPrompt = generateRequirementsPrompt(
            conversationHistory,
            userMessage
        );
        return await aIChatCompletion({
            userId: userId,
            systemPrompt: systemPrompt,
            url: url,
        });
    } catch (error) {
        return handleError(
            error,
            'handleImageGetRequirements',
            userId,
            projectId
        );
    }
}

function findFirstArray(data) {
    if (Array.isArray(data)) return data;
    if (typeof data === 'object' && data !== null) {
        return Object.values(data).find(Array.isArray) || [data];
    }
    return [data];
}

async function exponentialBackoff(fn, retries = 5, delay = 300) {
    for (let attempt = 0; attempt < retries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            if (error.status === 429 && attempt < retries - 1) {
                const retryAfter = error.headers['retry-after-ms'] || delay;
                console.log(
                    `Rate limit exceeded. Retrying in ${retryAfter}ms...`
                );
                await new Promise((resolve) => setTimeout(resolve, retryAfter));
                delay *= 2;
            } else {
                throw error;
            }
        }
    }
    throw new Error('Max retries reached');
}

async function getConversationHistory(userId, projectId) {
    const conversations = await UserModel.getUserMessages(userId, projectId);
    return conversations.map(({ role, content }) => ({ role, content }));
}

async function tasksPicker(
    message,
    projectId,
    conversationContext,
    taskList,
    userId
) {
    const projectCoordinator = new ProjectCoordinator(userId, projectId);
    const prompt = generateModificationPrompt(
        message,
        conversationContext,
        taskList
    );
    const rawArray = await aIChatCompletion({
        userId: userId,
        systemPrompt: prompt,
    });
    const jsonArrayString = await extractJsonArray(rawArray);

    try {
        const parsedArray = JSON.parse(jsonArrayString);
        const results = [];

        for (const task of parsedArray) {
            try {
                const content = await getTaskContent(task, projectId);
                results.push({ ...task, content });
            } catch (error) {
                console.error(
                    `Error fetching content for task ${task.name}:`,
                    error
                );
                results.push(task);
            }
        }
        const errors = await monitorBrowserConsoleErrors(
            baseURL,
            projectId,
            results
        );
        return { results, errors };
    } catch (error) {
        const formattedJson = await projectCoordinator.JSONFormatter(
            jsonArrayString,
            `Error parsing JSON:${error}`
        );
        const parsedArray = findFirstArray(formattedJson);
        const results = [];

        for (const task of parsedArray) {
            try {
                const content = await getTaskContent(task, projectId);
                results.push({ ...task, content });
            } catch (error) {
                console.error(
                    `Error fetching content for task ${task.name}:`,
                    error
                );
                results.push(task);
            }
        }

        const errors = await monitorBrowserConsoleErrors(
            baseURL,
            projectId,
            results
        );
        return { results, errors };
    }
}

async function getTaskContent(taskDetails, projectId) {
    const { name, extension } = taskDetails;
    const fileName = `${name.replace(/\.[^.]*/, '')}.${extension}`;
    try {
        const content = await s3FileManager.readFile(projectId, fileName);
        return content;
    } catch (error) {
        console.error('Error reading file:', error);
        throw error;
    }
}

async function handleIssues(message, projectId, userId) {
    const selectedProject = await UserModel.getUserProject(userId, projectId);
    const { taskList } = selectedProject;

    const conversationHistory = await getConversationHistory(userId, projectId);
    const conversationContext = conversationHistory
        .map(({ role, content }) => `${role}: ${content}`)
        .join('\n');

    const { results, errors } = await tasksPicker(
        message,
        projectId,
        conversationContext,
        taskList,
        userId
    );

    const prompt = generateTaskGenerationPrompt(
        conversationContext,
        taskList,
        results,
        errors.consoleMessages,
        false
    );
    const totalMsg = `System Prompt:${prompt}\nUser Message:${message}`;
    const rawArray = await exponentialBackoff(() =>
        aIChatCompletion({
            userId: userId,
            systemPrompt: totalMsg,
        })
    );

    const jsonArrayString = await extractJsonArray(rawArray);
    try {
        const parsedArray = JSON.parse(jsonArrayString);

        const developerAssistant = new ExecutionManager(
            parsedArray,
            projectId,
            userId
        );
        await developerAssistant.executeTasks();
    } catch (error) {
        const projectCoordinator = new ProjectCoordinator(userId, projectId);
        const newJson = await projectCoordinator.JSONFormatter(
            jsonArrayString,
            `Error parsing JSON:${error}`
        );

        const cleanedArray = findFirstArray(newJson);
        const developerAssistant = new ExecutionManager(
            cleanedArray,
            projectId,
            userId
        );
        await developerAssistant.executeTasks();
    }
}


async function handleImageInsertion(userId, projectId, userMessage, imageUrl, imageId) {
    try {
        const result = await updateImageInDataJson(projectId, imageId, imageUrl);
        console.log(result);
    } catch (error) {
        console.error('Error:', error);
    }
}

module.exports = {
    handleActions,
    handleIssues,
    handleUserReply,
    handleGetRequirements,
    handleImageGetRequirements,
    handleImageInsertion
};
