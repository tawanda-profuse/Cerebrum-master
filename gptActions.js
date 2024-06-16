require('dotenv').config();
const path = require('path');
const fs = require('fs');
const fsPromises = fs.promises;
const OpenAI = require('openai');
const ProjectCoordinator = require('./projectCoordinator');
const User = require('./User.schema');
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
        User.addTokenCountToUserSubscription(userId, rawResponse);
        return rawResponse;
    } catch (error) {
        console.error('OpenAI API Error:', error);
        return 'error';
    }
}

// Centralized error handling
function handleError(error, context,userId) {
    User.addSystemLogToProject(userId, projectId, `Error in ${context}:`, error);
    return 'error';
}

async function handleActions(userMessage, userId, projectId) {
    try {
        const conversations = await User.getUserMessages(userId, projectId);
        const selectedProject = User.getUserProject(userId, projectId)[0];
        const conversationHistory = conversations.map(({ role, content }) => ({
            role,
            content,
        }));
        const { projectOverView } = selectedProject;
        const logs = User.getProjectLogs(userId, projectId);
        const systemPrompt = generateSentimentAnalysisPrompt(
            conversationHistory,
            projectOverView,
            logs
        );
        User.addTokenCountToUserSubscription(userId, systemPrompt);
        return await openAiChatCompletion(userId, systemPrompt, userMessage);
    } catch (error) {
        return handleError(error, 'handleActions',userId);
    }
}

async function handleUserReply(userMessage, userId, projectId) {
    try {
        const conversations = await User.getUserMessages(userId, projectId);
        const conversationHistory = conversations.map(({ role, content }) => ({
            role,
            content,
        }));
        const logs = User.getProjectLogs(userId, projectId);
        const systemPrompt = generateConversationPrompt(
            conversationHistory,
            userMessage,
            logs
        );
        User.addTokenCountToUserSubscription(userId, systemPrompt);
        return await openAiChatCompletion(userId, systemPrompt);
    } catch (error) {
        return handleError(error, 'handleUserReply');
    }
}

async function handleGetRequirements(userMessage, userId, projectId) {
    try {
        const conversations = await User.getUserMessages(userId, projectId);
        const conversationHistory = conversations.map(({ role, content }) => ({
            role,
            content,
        }));
        const logs = User.getProjectLogs(userId, projectId);
        const systemPrompt = generateRequirementsPrompt(
            conversationHistory,
            userMessage,
            logs
        );
        User.addTokenCountToUserSubscription(userId, systemPrompt);
        return await openAiChatCompletion(userId, systemPrompt);
    } catch (error) {
        return handleError(error, 'handleGetReuirements');
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
                return handleError(error, 'exponentialBackoff');
            }
        }
    }
    console.error('Max retries reached');
}

async function getConversationHistory(userId, projectId) {
    const conversations = await User.getUserMessages(userId, projectId);
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
    const logs = User.getProjectLogs(userId, projectId);
    const prompt = generateModificationPrompt(
        message,
        conversationContext,
        taskList,
        logs
    );
    User.addTokenCountToUserSubscription(userId, prompt);

    try {
        const rawArray = await openAiChatCompletion(userId, prompt);
        const jsonArrayString = extractJsonArray(rawArray);
        const parsedArray = JSON.parse(jsonArrayString);

        return await Promise.all(
            parsedArray.map(async (task) => {
                const content = await getTaskContent(task, projectId);
                return { ...task, content };
            })
        );
    } catch (error) {
        User.addSystemLogToProject(userId, projectId, 'Error in tasks picker:', error);
        const jsonArrayString = extractJsonArray(rawArray);
        const formattedJson = await projectCoordinator.JSONFormatter(
            jsonArrayString,
            `Error parsing JSON:${error}`
        );
        const parsedArray = await findFirstArray(formattedJson);

        return await Promise.all(
            parsedArray.map(async (task) => {
                const content = await getTaskContent(task, projectId);
                return { ...task, content };
            })
        );
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
    try {
        const selectedProject = User.getUserProject(userId, projectId)[0];
        const { taskList, projectOverView, appName } = selectedProject;
        const taskProcessor = new TaskProcessor(
            appName,
            projectOverView,
            projectId,
            taskList,
            userId
        );

        const conversationHistory = await getConversationHistory(
            userId,
            projectId
        );
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
        User.addTokenCountToUserSubscription(userId, prompt);
        const rawArray = await exponentialBackoff(() =>
            openAiChatCompletion(userId, prompt, message)
        );
        const jsonArrayString = extractJsonArray(rawArray);
        const parsedArray = JSON.parse(jsonArrayString);

        await Promise.all(
            parsedArray.map((task) => taskProcessor.processTasks(userId, task))
        );
    } catch (error) {
        handleError(error, 'handleIssues');
        const projectCoordinator = new ProjectCoordinator(userId, projectId);
        const rawArray = response.choices[0].message.content.trim();
        const jsonArrayString = extractJsonArray(rawArray);

        try {
            const formattedJson = await projectCoordinator.JSONFormatter(
                jsonArrayString,
                `Error parsing JSON:${error}`
            );
            const parsedArray = await findFirstArray(formattedJson);

            await Promise.all(
                parsedArray.map((task) =>
                    taskProcessor.processTasks(userId, task)
                )
            );
        } catch (formattingError) {
            handleError(formattingError, 'handleIssues JSON formatting');
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
};
