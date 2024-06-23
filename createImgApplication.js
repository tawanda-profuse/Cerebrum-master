
const ProjectCoordinator = require('./classes/projectCoordinator');
const UserModel = require('./models/User.schema');
const { TaskProcessor } = require('./classes/taskProcessor');
const { extractJsonArray } = require('./utilities/functions');
const {
    generateModificationPrompt,
    generateTaskGenerationPrompt,
    replyUserWithImage,
    generateWebAppPrompt,
} = require('./utilities/promptUtils');
const {
    handleImageGetRequirements,
} = require('./gptActions');
const ExecutionManager = require('./classes/executionManager');
const { monitorBrowserConsoleErrors } = require('./ErrorHandler/scrapper');

const aIChatCompletion = require('./ai_provider');

// Function to handle image-related tasks
async function handleImages(userMessage, userId, projectId, url,addMessage) {
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
        
        const response = await aIChatCompletion({
            userId: userId,
            systemPrompt: systemPrompt,
            url: url,
        });
        await analyzeResponse(
            response,
            userId,
            projectId,
            url,
            userMessage,
            addMessage
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
    url,
    consoleMessages
) {
    try {
        const prompt = generateModificationPrompt(
            message,
            conversationContext,
            taskList,
            consoleMessages
        );
        
        const rawArray = await aIChatCompletion({
            userId: userId,
            systemPrompt: prompt,
            url: url,
        });
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
        const jsonArrayString = await extractJsonArray(rawArray);
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
        const jsonArrayString = await extractJsonArray(rawArray);
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
async function analyzeResponse(response, userId, projectId, url, userMessage,addMessage) {
    const selectedProject = await UserModel.getUserProject(userId, projectId);
    const { taskList, projectOverView, appName } = selectedProject;
    const taskProcessor = new TaskProcessor(
        appName,
        projectOverView,
        projectId,
        taskList,
        userId
    );
console.log('response',response)
    if (response === 'getRequirements') {
        const res =  await handleImageGetRequirements(
            userMessage,
            userId,
            projectId,
            url
        );
        addMessage(res)
    } else if (response === 'createApplication') {
        await addMessage('Ok got it!, thank you please wait while i start building your project. This will take a while....')
        await handleCreateApplication(
            userId,
            projectId,
            url
        );
        addMessage(`Great news! Your project has been built successfully. You can check it out at http://localhost:5001/${projectId}. If you need any adjustments, just let me know and I'll take care of it for you.`)
    } else if (response === 'modifyApplication') {
        await addMessage('ok please wait while i start making adjustments to your project. This will take a while.... ')
        await handleModifyApplication(
            userMessage,
            projectId,
            taskList,
            userId,
            url,
            taskProcessor
        );
       addMessage('I have finished modifying your application as requested.')
         
    }
}

// Function to handle creating an application
async function handleCreateApplication(
    userId,
    projectId,
    url
) {
    const conversations = await UserModel.getUserMessages(userId, projectId);
    const conversationHistory = conversations.map(({ role, content }) => ({
        role,
        content,
    }));
    const projectCoordinator = new ProjectCoordinator(userId, projectId);
    const prompt = generateWebAppPrompt(conversationHistory, true);

    const rawArray = await aIChatCompletion({
        userId: userId,
        systemPrompt: prompt,
        url: url,
    });
    const jsonArrayString = await extractJsonArray(rawArray);
    try {
        const parsedArray = JSON.parse(jsonArrayString);
        const refinedList = await findFirstArray(parsedArray);
        const selectedProject = await UserModel.getUserProject(
            userId,
            projectId
        );
        let { appName } = selectedProject;
        await executeTasks(
            appName,
            userId,
            projectId,
            refinedList
        );
    } catch (error) {
        return await handleCreateApplicationError(
            error,
            jsonArrayString,
            userId,
            projectId
        );
    }
}

// Function to handle create application error
async function handleCreateApplicationError(
    error,
    jsonArrayString,
    userId,
    projectId
) {
    const projectCoordinator = new ProjectCoordinator(userId, projectId);
    const formattedJson = await projectCoordinator.JSONFormatter(
        jsonArrayString,
        `Error parsing JSON: ${error}`
    );
    try {
        const parsedArray = await findFirstArray(formattedJson);
        const selectedProject = await UserModel.getUserProject(
            userId,
            projectId
        );
        let { appName } = selectedProject;
        await executeTasks(
            appName,
            userId,
            projectId,
            parsedArray
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
    taskList
) {

    const developerAssistant = new ExecutionManager(
        taskList,
        projectId,
        userId
    );
    await developerAssistant.executeTasks(appName, userId);

    const projectCoordinator = new ProjectCoordinator(userId, projectId);
    await projectCoordinator.logStep('All tasks have been executed.');
    await UserModel.clearSketchesFromProject(userId, projectId);
    await UserModel.addIsCompleted(userId,projectId)
}

// Function to handle modifying an application
async function handleModifyApplication(
    userMessage,
    projectId,
    taskList,
    userId,
    url,
    taskProcessor
) {
    const conversations = await UserModel.getUserMessages(userId, projectId);
    const conversationHistory = conversations.map(({ role, content }) => ({
        role,
        content,
    }));
    const result = await monitorBrowserConsoleErrors(`http://localhost:5001/${projectId}`);
    const consoleMessages = result.consoleMessages;
    const relevantTasks = await tasksPicker(
        userMessage,
        projectId,
        conversationHistory,
        taskList,
        userId,
        url,
        consoleMessages
    );
    const systemPrompt = generateTaskGenerationPrompt(
        projectOverView,
        conversationHistory,
        taskList,
        [],
        relevantTasks,
        true,
        consoleMessages
    );

    const msg = `The user's message ${userMessage}\n\n${systemPrompt}`;
    const rawArray = await exponentialBackoff(() =>
        aIChatCompletion({
            userId: userId,
            systemPrompt: msg,
            url: url,
        })
    );

    const jsonArrayString = await extractJsonArray(rawArray);
    try {
        const parsedArray = JSON.parse(jsonArrayString);

        for (const task of parsedArray) {
            try {
                await taskProcessor.processTasks(userId, task);
            } catch (error) {
                console.error('Error processing task:', error);
            }
        }

      
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
        const jsonArrayString = await extractJsonArray(rawArray);
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
