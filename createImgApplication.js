require('dotenv').config();
const ProjectCoordinator = require('./classes/projectCoordinator');
const UserModel = require('./models/User.schema');
const { extractJsonArray } = require('./utilities/functions');
const {
    generateModificationPrompt,
    generateTaskGenerationPrompt,
    replyUserWithImage,
    generateWebAppPrompt,
    improveUserPrompt,
    defaultResponse,
    makeDynamicData
} = require('./utilities/promptUtils');
const logger = require('./logger');
const { handleImageGetRequirements } = require('./gptActions');
const ExecutionManager = require('./classes/executionManager');
const { monitorBrowserConsoleErrors } = require('./ErrorHandler/scrapper');
const s3FileManager = require('./s3FileManager');
const aIChatCompletion = require('./ai_provider');
const env = process.env.NODE_ENV || 'development';
const baseURL =
    env === 'production' ? process.env.PROD_URL : process.env.LOCAL_URL;

async function handleImages(userMessage, userId, projectId, url, addMessage) {
    try {
        const selectedProject = await UserModel.getUserProject(
            userId,
            projectId
        );
        const { taskList } = selectedProject;
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
            userMessage,
            taskList
        );

        const response = await aIChatCompletion({ userId, systemPrompt, url });
        await analyzeResponse(
            response,
            userId,
            projectId,
            url,
            userMessage,
            addMessage
        );
    } catch (error) {
        return undefined;
    }
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
                logger.info(
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
                logger.info(
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
        return await s3FileManager.readFile(projectId, fileName);
    } catch (error) {
        throw error;
    }
}

function findFirstArray(data) {
    if (Array.isArray(data)) return data;
    if (typeof data === 'object' && data !== null) {
        return Object.values(data).find(Array.isArray) || [data];
    }
    return [data];
}

async function analyzeResponse(
    response,
    userId,
    projectId,
    url,
    userMessage,
    addMessage
) {
    const selectedProject = await UserModel.getUserProject(userId, projectId);
    const { taskList } = selectedProject;
    if (response === 'getRequirements') {
        const res = await handleImageGetRequirements(
            userMessage,
            userId,
            projectId,
            url
        );
        addMessage(res);
    } else if (response === 'createApplication') {
        await handleCreateApplicationFlow(userId, projectId, url, addMessage);
    } else if (response === 'modifyApplication') {
        await handleModifyApplicationFlow(
            userMessage,
            projectId,
            taskList,
            userId,
            url,
            addMessage
        );
    }
}

async function handleCreateApplicationFlow(userId, projectId, url, addMessage) {
    const initialResponse = await getDefaultResponse(
        `Got it! Thanks for your input. 👍I'm kicking off your project build now. This might take a few minutes, so feel free to grab a coffee. I'll let you know as soon as it's ready!`,
        userId,
        projectId
    );
    await UserModel.addisProcessing(userId, projectId,true);
    await addMessage(initialResponse);   
    await handleCreateApplication(userId, projectId, url);

    const completionResponse = await getDefaultResponse(
        `Great news! Your project has been built successfully. You can check it out at ${baseURL}/${projectId}. If you need any adjustments, just let me know and I'll take care of it for you.`,
        userId,
        projectId
    );
    await UserModel.addisProcessing(userId, projectId,false);
    await addMessage(completionResponse);
    
}

async function handleModifyApplicationFlow(
    userMessage,
    projectId,
    taskList,
    userId,
    url,
    addMessage
) {
    const initialResponse = await getDefaultResponse(
        `Understood! I'm starting to make those adjustments to your project now. 🔧.This process may take a few minutes. Feel free to take a short break – I'll notify you as soon as the changes are complete.`,
        userId,
        projectId
    );
    await UserModel.addisProcessing(userId, projectId,true);
    await addMessage(initialResponse);
    await handleModifyApplication(
        userMessage,
        projectId,
        taskList,
        userId,
        url
    );

    const completionResponse = await getDefaultResponse(
        'Your application has been successfully updated! 🎉.All the changes you requested are now in place. Feel free to take a look and let us know if you need anything else',
        userId,
        projectId
    );
    await UserModel.addisProcessing(userId, projectId,false);
    await addMessage(completionResponse);  
}

async function getDefaultResponse(message, userId, projectId) {
    const defResponse = await defaultResponse(message, userId, projectId);
    return await aIChatCompletion({ userId, systemPrompt: defResponse });
}

async function handleCreateApplication(userId, projectId, url) {
    const conversations = await UserModel.getUserMessages(userId, projectId);
    const conversationHistory = conversations.map(({ role, content }) => ({
        role,
        content,
    }));
    const summury = improveUserPrompt(conversationHistory)
       const newUserMessage = await aIChatCompletion({
                userId: userId,
                systemPrompt: summury,
            });
    const selectedProject = await UserModel.getUserProject(userId, projectId);
    const { taskList } = selectedProject;
    const prompt = generateWebAppPrompt(conversationHistory,newUserMessage,taskList, true);

    const array = await aIChatCompletion({
        userId: userId,
        systemPrompt: prompt,
        url: url
    });

    const prompt2 = makeDynamicData(array,conversationHistory);

    const rawArray = await aIChatCompletion({
        userId: userId,
        systemPrompt: prompt2,
        url,url
    });
    const jsonArrayString = await extractJsonArray(rawArray);
    try {
        const parsedArray = JSON.parse(jsonArrayString);
        const refinedList = findFirstArray(parsedArray);
        await executeTasks(userId, projectId, refinedList);
    } catch (error) {
        return await handleCreateApplicationError(
            error,
            jsonArrayString,
            userId,
            projectId
        );
    }
}

async function handleCreateApplicationError(
    error,
    jsonArrayString,
    userId,
    projectId
) {
    const projectCoordinator = new ProjectCoordinator(userId, projectId);
    try {
        const formattedJson = await projectCoordinator.JSONFormatter(
            jsonArrayString,
            `Error parsing JSON: ${error}`
        );
        const parsedArray = findFirstArray(formattedJson);
        await executeTasks(userId, projectId, parsedArray);
        return `Great news! Your project has been built successfully. You can check it out at ${baseURL}/${projectId}. If you need any adjustments, just let me know and I'll take care of it for you.`;
    } catch (formattingError) {}
}

async function executeTasks(userId, projectId, taskList) {
    const developerAssistant = new ExecutionManager(
        taskList,
        projectId,
        userId
    );
    await developerAssistant.executeTasks();

    const projectCoordinator = new ProjectCoordinator(userId, projectId);
    await projectCoordinator.logStep('All tasks have been executed.');
    await UserModel.clearSketchesFromProject(userId, projectId);
    await UserModel.addIsCompleted(userId, projectId);
}

async function handleModifyApplication(
    userMessage,
    projectId,
    taskList,
    userId,
    url
) {
    const { results, errors } = await tasksPicker(
        message,
        projectId,
        conversationContext,
        taskList,
        userId
    );
    const systemPrompt = generateTaskGenerationPrompt(
        conversationContext,
        taskList,
        results,
        errors.consoleMessages,
        false
    );

    const msg = `The user's message ${userMessage}\n\n${systemPrompt}`;
    const rawArray = await exponentialBackoff(() =>
        aIChatCompletion({ userId, systemPrompt: msg, url })
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
        return await handleModifyApplicationError(
            error,
            rawArray,
            projectId,
            url
        );
    }
}

async function handleModifyApplicationError(error, rawArray, projectId, url) {
    try {
        const jsonArrayString = await extractJsonArray(rawArray);
        const projectCoordinator = new ProjectCoordinator(userId, projectId);
        const formattedJson = await projectCoordinator.JSONFormatter(
            jsonArrayString,
            `Error parsing JSON: ${error}`
        );
        const parsedArray = findFirstArray(formattedJson);
        const developerAssistant = new ExecutionManager(
            parsedArray,
            projectId,
            userId
        );
        await developerAssistant.executeTasks();
        return 'I have finished modifying your application as requested.';
    } catch (formattingError) {}
}

module.exports = { handleImages };
