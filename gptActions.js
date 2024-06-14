require('dotenv').config();
const path = require('path');
const fs = require('fs');
const fsPromises = fs.promises;
const OpenAI = require('openai');
const ProjectCoordinator = require('./projectCoordinator');
const User = require('./User.schema');
const { TaskProcessor } = require('./taskProcessor');
const { extractJsonArray } = require('./helper.utils');
const {
    generateSentimentAnalysisPrompt,
    generateConversationPrompt,
    generateModificationPrompt,
    generateTaskGenerationPrompt,
} = require('./promptUtils');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function handleActions(userMessage, userId, projectId) {
    try {
        const conversations = await User.getUserMessages(userId, projectId);
        const selectedProject = User.getUserProject(userId, projectId)[0];
        const conversationHistory = conversations.map(({ role, content }) => ({
            role,
            content,
        }));
        const { projectOverView } = selectedProject;

        const systemPrompt = generateSentimentAnalysisPrompt(
            conversationHistory,
            projectOverView
        );

        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            temperature: 0,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userMessage },
            ],
        });

        return response.choices[0].message.content.trim();
    } catch (error) {
        console.error('Error handling actions:', error);
        return 'error';
    }
}

async function handleUserReply(userMessage, userId, projectId) {
    try {
        const conversations = await User.getUserMessages(userId, projectId);
        const conversationHistory = conversations.map(({ role, content }) => ({
            role,
            content,
        }));

        const systemPrompt = generateConversationPrompt(
            conversationHistory,
            userMessage
        );

        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [{ role: 'system', content: systemPrompt }],
        });

        return response.choices[0].message.content.trim();
    } catch (error) {
        console.error('Error in code analysis:', error);
        return '';
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
                console.error('Error during exponential backoff:', error);
            }
        }
    }
    console.error('Max retries reached');
}

async function getConversationHistory(userId, projectId) {
    const conversations = await User.getUserMessages(userId, projectId);
    return conversations.map(({ role, content }) => ({ role, content }));
}

async function tasksPicker(message, projectId, conversationContext, taskList) {
    const projectCoordinator = new ProjectCoordinator(openai, projectId);
    const prompt = generateModificationPrompt(
        message,
        conversationContext,
        taskList
    );

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [{ role: 'system', content: prompt }],
        });

        const rawArray = response.choices[0].message.content.trim();
        const jsonArrayString = extractJsonArray(rawArray);
        const parsedArray = JSON.parse(jsonArrayString);

        return await Promise.all(
            parsedArray.map(async (task) => {
                const content = await getTaskContent(task, projectId);
                return { ...task, content };
            })
        );
    } catch (error) {
        console.error('Error in tasks picker:', error);
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
    const selectedProject = User.getUserProject(userId, projectId)[0];
    const { taskList, projectOverView, appName } = selectedProject;
    const taskProcessor = new TaskProcessor(
        appName,
        projectOverView,
        projectId,
        taskList
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
        taskList
    );
    const prompt = generateTaskGenerationPrompt(
        projectOverView,
        conversationContext,
        taskList,
        assets,
        relevantTasks
    );

    const response = await exponentialBackoff(() =>
        openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                { role: 'system', content: prompt },
                { role: 'user', content: message },
            ],
        })
    );

    const rawArray = response.choices[0].message.content.trim();
    try {
        const jsonArrayString = extractJsonArray(rawArray);
        const parsedArray = JSON.parse(jsonArrayString);

        await Promise.all(
            parsedArray.map((task) => taskProcessor.processTasks(userId, task))
        );
    } catch (error) {
        console.error('Error handling issues:', error);
        const projectCoordinator = new ProjectCoordinator(openai, projectId);
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
            console.error('Error formatting JSON:', formattingError);
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
};
