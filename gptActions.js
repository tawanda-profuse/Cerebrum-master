require('dotenv').config();
const path = require('path');
const fs = require('fs');
const fsPromises = fs.promises;
const OpenAI = require('openai');
const ProjectCoordinator = require('./projectCoordinator');
const UserModel = require('./User.schema');
const { TaskProcessor } = require('./taskProcessor');
const { extractJsonArray } = require('./utilities/functions');
const {
    generateSentimentAnalysisPrompt,
    generateConversationPrompt,
    generateModificationPrompt,
    generateTaskGenerationPrompt,
    generateRequirementsPrompt,
} = require('./promptUtils');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Utility function for OpenAI API calls
async function openAiChatCompletion(userId, systemPrompt, userMessage = '') {
    try {
        const messages = [{ role: 'system', content: systemPrompt }];
        if (userMessage) {
            messages.push({ role: 'user', content: userMessage });
        }

        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages,
        });
        const rawResponse = response.choices[0].message.content.trim();
        await UserModel.addTokenCountToUserSubscription(userId, rawResponse);
        return rawResponse;
    } catch (error) {
        console.error('OpenAI API Error:', error);
        return 'error';
    }
}

// Centralized error handling
async function handleError(error, context, userId, projectId) {
    await UserModel.addSystemLogToProject(
        userId,
        projectId,
        `Error in ${context}:`,
        error
    );
    console.log(`Error in ${context}:`, error);
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
        const { projectOverView, sketches, taskList } = selectedProject;
        if (sketches && sketches.length > 0) {
            return 'handleImages';
        } else {
            const logs = await UserModel.getProjectLogs(userId, projectId);
            const systemPrompt = generateSentimentAnalysisPrompt(
                conversationHistory,
                projectOverView,
                logs,
                taskList
            );
            await UserModel.addTokenCountToUserSubscription(
                userId,
                systemPrompt
            );
            return await openAiChatCompletion(
                userId,
                systemPrompt,
                userMessage
            );
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
        const logs = await UserModel.getProjectLogs(userId, projectId);
        const systemPrompt = generateConversationPrompt(
            conversationHistory,
            userMessage,
            logs
        );
        await UserModel.addTokenCountToUserSubscription(userId, systemPrompt);
        return await openAiChatCompletion(userId, systemPrompt);
    } catch (error) {
        return handleError(error, 'handleUserReply', projectId);
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
        const logs = await UserModel.getProjectLogs(userId, projectId);
        const systemPrompt = generateRequirementsPrompt(
            conversationHistory,
            userMessage,
            logs
        );
        await UserModel.addTokenCountToUserSubscription(userId, systemPrompt);
        return await openAiChatCompletion(userId, systemPrompt);
    } catch (error) {
        return handleError(error, 'handleGetReuirements', projectId);
    }
}

async function handleImageGetRequirements(userMessage, userId, projectId, url) {
    const conversations = await UserModel.getUserMessages(userId, projectId);
    const conversationHistory = conversations.map(({ role, content }) => ({
        role,
        content,
    }));
    const logs = await UserModel.getProjectLogs(userId, projectId);
    const systemPrompt = generateRequirementsPrompt(
        conversationHistory,
        userMessage,
        logs
    );
    await UserModel.addTokenCountToUserSubscription(userId, systemPrompt);
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
        const rawResponse = response.choices[0].message.content.trim();
        return rawResponse;
    } catch (error) {
        return handleError(error, 'handleImageGetRequirements', projectId);
    }
}

async function findFirstArray(data) {
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
                return handleError(error, 'exponentialBackoff', projectId);
            }
        }
    }
    console.error('Max retries reached');
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
    const logs = await UserModel.getProjectLogs(userId, projectId);
    const prompt = generateModificationPrompt(
        message,
        conversationContext,
        taskList,
        logs
    );
    await UserModel.addTokenCountToUserSubscription(userId, prompt);

    const rawArray = await openAiChatCompletion(userId, prompt);
    const jsonArrayString = extractJsonArray(rawArray);
    try {
        const parsedArray = JSON.parse(jsonArrayString);

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
    } catch (error) {
        await UserModel.addSystemLogToProject(
            userId,
            projectId,
            'Error in tasks picker:',
            error
        );
        const jsonArrayString = extractJsonArray(rawArray);
        const formattedJson = await projectCoordinator.JSONFormatter(
            jsonArrayString,
            `Error parsing JSON:${error}`
        );
        const parsedArray = await findFirstArray(formattedJson);

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
}

async function getTaskContent(taskDetails, projectId) {
    const { name, extension } = taskDetails;
    const workspaceDir = path.join(__dirname, 'workspace', projectId);
    const filePath = path.join(
        workspaceDir,
        `${name.replace(/\.[^.]*/, '')}.${extension}`
    );

    return await fsPromises.readFile(filePath, 'utf8');
}

async function handleIssues(message, projectId, userId) {
    const selectedProject = await UserModel.getUserProject(userId, projectId);
    const { taskList, projectOverView, appName } = selectedProject;
    const taskProcessor = new TaskProcessor(
        appName,
        projectOverView,
        projectId,
        taskList,
        selectedProject,
        userId
    );

    const conversationHistory = await getConversationHistory(userId, projectId);
    const conversationContext = conversationHistory
        .map(({ role, content }) => `${role}: ${content}`)
        .join('\n');

    const assets = listAssets(projectId);
    const relevantTasks = await tasksPicker(
        message,
        projectId,
        conversationContext,
        taskList,
        userId
    );
    const prompt = generateTaskGenerationPrompt(
        projectOverView,
        conversationContext,
        taskList,
        assets,
        relevantTasks
    );
    await UserModel.addTokenCountToUserSubscription(userId, prompt);
    const rawArray = await exponentialBackoff(() =>
        openAiChatCompletion(userId, prompt, message)
    );

    const jsonArrayString = extractJsonArray(rawArray);
    try {
        const parsedArray = JSON.parse(jsonArrayString);

        for (const task of parsedArray) {
            try {
                await taskProcessor.processTasks(userId, task);
                console.log('Task processed successfully.');
            } catch (error) {
                console.error('Error processing task:', error);
            }
        }
    } catch (error) {
        const projectCoordinator = new ProjectCoordinator(userId, projectId);

        try {
            const formattedJson = await projectCoordinator.JSONFormatter(
                jsonArrayString,
                `Error parsing JSON:${error}`
            );
            const parsedArray = await findFirstArray(formattedJson);
            for (const task of parsedArray) {
                try {
                    await taskProcessor.processTasks(userId, task);
                    console.log('Task processed successfully.');
                } catch (error) {
                    console.error('Error processing task:', error);
                }
            }
        } catch (formattingError) {
            handleError(
                formattingError,
                'handleIssues JSON formatting',
                projectId
            );
        }
    }
}

function listAssets(projectId) {
    const assetsDir = path.join(__dirname, 'workspace', projectId, 'assets');
    return fs.existsSync(assetsDir) ? fs.readdirSync(assetsDir) : [];
}

module.exports = {
    handleActions,
    handleIssues,
    handleUserReply,
    handleGetRequirements,
    handleImageGetRequirements,
};
