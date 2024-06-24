require('dotenv').config();
const ProjectCoordinator = require("./classes/projectCoordinator");
const UserModel = require("./models/User.schema");
const { TaskProcessor } = require("./classes/taskProcessor");
const { extractJsonArray } = require("./utilities/functions");
const {
  generateModificationPrompt,
  generateTaskGenerationPrompt,
  replyUserWithImage,
  generateWebAppPrompt,
  defaultResponse,
} = require("./utilities/promptUtils");
const { handleImageGetRequirements } = require("./gptActions");
const ExecutionManager = require("./classes/executionManager");
const { monitorBrowserConsoleErrors } = require("./ErrorHandler/scrapper");
const s3FileManager = require('./s3FileManager');
const aIChatCompletion = require("./ai_provider");

async function handleImages(userMessage, userId, projectId, url, addMessage) {
  try {
    const selectedProject = await UserModel.getUserProject(userId, projectId);
    const { taskList, projectOverView } = selectedProject;
    const conversations = await UserModel.getUserMessages(userId, projectId);
    const conversationHistory = conversations.map(({ role, content }) => ({ role, content }));

    const systemPrompt = replyUserWithImage(conversationHistory, projectOverView, userMessage, taskList);

    const response = await aIChatCompletion({ userId, systemPrompt, url });
    await analyzeResponse(response, userId, projectId, url, userMessage, addMessage);
  } catch (error) {
    return undefined;
  }
}

async function tasksPicker(message, projectId, conversationContext, taskList, userId, url, consoleMessages) {
  try {
    const prompt = generateModificationPrompt(message, conversationContext, taskList, consoleMessages);
    const rawArray = await aIChatCompletion({ userId, systemPrompt: prompt, url });
    return await parseAndFetchTaskContents(rawArray, projectId);
  } catch (error) {
    await handleTasksPickerError(error, rawArray, userId, projectId);
    return [];
  }
}

async function parseAndFetchTaskContents(rawArray, projectId) {
  try {
    const jsonArrayString = await extractJsonArray(rawArray);
    const parsedArray = JSON.parse(jsonArrayString);
    return await fetchTaskContents(parsedArray, projectId);
  } catch (error) {
    throw error;
  }
}

async function fetchTaskContents(parsedArray, projectId) {
  const results = [];
  for (const task of parsedArray) {
    try {
      const content = await getTaskContent(task, projectId);
      results.push({ ...task, content });
    } catch (error) {
    }
  }
  return results;
}

async function getTaskContent(taskDetails, projectId) {
  const { name, extension } = taskDetails;
  const fileName = `${name.replace(/\.[^.]*/, "")}.${extension}`;
  try {
    return await s3FileManager.readFile(projectId, fileName);
  } catch (error) {
    throw error;
  }
}

function findFirstArray(data) {
  if (Array.isArray(data)) return data;
  if (typeof data === "object" && data !== null) {
    return Object.values(data).find(Array.isArray) || [data];
  }
  return [data];
}

async function handleTasksPickerError(error, rawArray, userId, projectId) {
  try {
    const jsonArrayString = await extractJsonArray(rawArray);
    const projectCoordinator = new ProjectCoordinator(userId, projectId);
    const formattedJson = await projectCoordinator.JSONFormatter(jsonArrayString, `Error parsing JSON: ${error}`);
    const parsedArray = findFirstArray(formattedJson);
    return await fetchTaskContents(parsedArray, projectId);
  } catch (formattingError) {
  }
}

async function analyzeResponse(response, userId, projectId, url, userMessage, addMessage) {
  const selectedProject = await UserModel.getUserProject(userId, projectId);
  const { taskList, projectOverView, appName } = selectedProject;
  const taskProcessor = new TaskProcessor(appName, projectOverView, projectId, taskList, userId);

  if (response === "getRequirements") {
    const res = await handleImageGetRequirements(userMessage, userId, projectId, url);
    addMessage(res);
  } else if (response === "createApplication") {
    await handleCreateApplicationFlow(userId, projectId, url, addMessage);
  } else if (response === "modifyApplication") {
    await handleModifyApplicationFlow(userMessage, projectId, taskList, userId, url, taskProcessor, addMessage);
  }
}

async function handleCreateApplicationFlow(userId, projectId, url, addMessage) {
  const initialResponse = await getDefaultResponse("Ok got it!, thank you please wait while i start building your project. This will take a while....", userId, projectId);
  await addMessage(initialResponse);
  
  await handleCreateApplication(userId, projectId, url);
  
  const completionResponse = await getDefaultResponse(`Great news! Your project has been built successfully. You can check it out at http://localhost:5001/${projectId}. If you need any adjustments, just let me know and I'll take care of it for you.`, userId, projectId);
  await addMessage(completionResponse);
}

async function handleModifyApplicationFlow(userMessage, projectId, taskList, userId, url, taskProcessor, addMessage) {
  const initialResponse = await getDefaultResponse("ok please wait while i start making adjustments to your project. This will take a while.... ", userId, projectId);
  await addMessage(initialResponse);
  
  await handleModifyApplication(userMessage, projectId, taskList, userId, url, taskProcessor);
  
  const completionResponse = await getDefaultResponse("I have finished modifying your application as requested.", userId, projectId);
  await addMessage(completionResponse);
}

async function getDefaultResponse(message, userId, projectId) {
  const defResponse = await defaultResponse(message, userId, projectId);
  return await aIChatCompletion({ userId, systemPrompt: defResponse });
}

async function handleCreateApplication(userId, projectId, url) {
  const conversations = await UserModel.getUserMessages(userId, projectId);
  const conversationHistory = conversations.map(({ role, content }) => ({ role, content }));
  const prompt = generateWebAppPrompt(conversationHistory, true);

  const rawArray = await aIChatCompletion({ userId, systemPrompt: prompt, url });
  const jsonArrayString = await extractJsonArray(rawArray);
  try {
    const parsedArray = JSON.parse(jsonArrayString);
    const refinedList = findFirstArray(parsedArray);
    await executeTasks(userId, projectId, refinedList);
  } catch (error) {
    return await handleCreateApplicationError(error, jsonArrayString, userId, projectId);
  }
}

async function handleCreateApplicationError(error, jsonArrayString, userId, projectId) {
  const projectCoordinator = new ProjectCoordinator(userId, projectId);
  try {
    const formattedJson = await projectCoordinator.JSONFormatter(jsonArrayString, `Error parsing JSON: ${error}`);
    const parsedArray = findFirstArray(formattedJson);
    const { appName } = await UserModel.getUserProject(userId, projectId);
    await executeTasks(userId, projectId, parsedArray);
    return `Great news! Your project has been built successfully. You can check it out at http://localhost:5001/${projectId}. If you need any adjustments, just let me know and I'll take care of it for you.`;
  } catch (formattingError) {
  }
}

async function executeTasks(userId, projectId, taskList) {
  const developerAssistant = new ExecutionManager(taskList, projectId, userId);
  await developerAssistant.executeTasks();

  const projectCoordinator = new ProjectCoordinator(userId, projectId);
  await projectCoordinator.logStep("All tasks have been executed.");
  await UserModel.clearSketchesFromProject(userId, projectId);
  await UserModel.addIsCompleted(userId, projectId);
}

async function handleModifyApplication(userMessage, projectId, taskList, userId, url, taskProcessor) {
  const conversations = await UserModel.getUserMessages(userId, projectId);
  const conversationHistory = conversations.map(({ role, content }) => ({ role, content }));
  const result = await monitorBrowserConsoleErrors(`http://localhost:5001/${projectId}`);
  const { consoleMessages } = result;
  
  const relevantTasks = await tasksPicker(userMessage, projectId, conversationHistory, taskList, userId, url, consoleMessages);
  const systemPrompt = generateTaskGenerationPrompt(projectOverView, conversationHistory, taskList, [], relevantTasks, true, consoleMessages);

  const msg = `The user's message ${userMessage}\n\n${systemPrompt}`;
  const rawArray = await exponentialBackoff(() => aIChatCompletion({ userId, systemPrompt: msg, url }));

  const jsonArrayString = await extractJsonArray(rawArray);
  try {
    const parsedArray = JSON.parse(jsonArrayString);
    for (const task of parsedArray) {
      await taskProcessor.processTasks(userId, task);
    }
  } catch (error) {
    return await handleModifyApplicationError(error, rawArray, taskProcessor, projectId);
  }
}

async function handleModifyApplicationError(error, rawArray, taskProcessor, projectId) {
  try {
    const jsonArrayString = await extractJsonArray(rawArray);
    const projectCoordinator = new ProjectCoordinator(userId, projectId);
    const formattedJson = await projectCoordinator.JSONFormatter(jsonArrayString, `Error parsing JSON: ${error}`);
    const parsedArray = findFirstArray(formattedJson);

    for (const task of parsedArray) {
      await taskProcessor.processTasks(userId, task);
    }

    return "I have finished modifying your application as requested.";
  } catch (formattingError) {
  }
}

module.exports = { handleImages };