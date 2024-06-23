require("dotenv").config();
const path = require("path");
const fs = require("fs");
const fsPromises = fs.promises;
const OpenAI = require("openai");
const ProjectCoordinator = require("./classes/projectCoordinator");
const UserModel = require("./models/User.schema");
const { TaskProcessor } = require("./classes/taskProcessor");
const { extractJsonArray } = require("./utilities/functions");
const aIChatCompletion = require("./ai_provider");
const {
  generateSentimentAnalysisPrompt,
  generateConversationPrompt,
  generateModificationPrompt,
  generateTaskGenerationPrompt,
  generateRequirementsPrompt,
} = require("./utilities/promptUtils");
const { monitorBrowserConsoleErrors } = require("./ErrorHandler/scrapper");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Centralized error handling
async function handleError(error, context, userId, projectId) {
  await UserModel.addSystemLogToProject(
    userId,
    projectId,
    `Error in ${context}:`,
    error,
  );
  console.log(`Error in ${context}:`, error);
  return "error";
}

async function handleActions(userMessage, userId, projectId) {
  try {
    const conversations = await UserModel.getUserMessages(userId, projectId);
    const selectedProject = await UserModel.getUserProject(userId, projectId);
    const conversationHistory = conversations.map(({ role, content }) => ({
      role,
      content,
    }));
    const { projectOverView, sketches, taskList } = selectedProject;
    if (sketches && sketches.length > 0) {
      return "handleImages";
    } else {
      const systemPrompt = generateSentimentAnalysisPrompt(
        conversationHistory,
        projectOverView,
        taskList,
      );
      const totalMsg = `System Prompt:${systemPrompt}\nUser Message:${userMessage}`;
      return await aIChatCompletion({
        userId: userId,
        systemPrompt: totalMsg,
      });
    }
  } catch (error) {
    return handleError(error, "handleActions", userId, projectId);
  }
}

async function handleUserReply(userMessage, userId, projectId) {
  try {
    const conversations = await UserModel.getUserMessages(userId, projectId);
    const conversationHistory = conversations.map(({ role, content }) => ({
      role,
      content,
    }));
    const systemPrompt = generateConversationPrompt(
      conversationHistory,
      userMessage,
    );
    return await aIChatCompletion({
      userId: userId,
      systemPrompt: systemPrompt,
    });
  } catch (error) {
    return handleError(error, "handleUserReply", projectId);
  }
}

async function handleGetRequirements(userMessage, userId, projectId) {
  try {
    const conversations = await UserModel.getUserMessages(userId, projectId);
    const conversationHistory = conversations.map(({ role, content }) => ({
      role,
      content,
    }));
    const systemPrompt = generateRequirementsPrompt(
      conversationHistory,
      userMessage,
    );
    return await aIChatCompletion({
      userId: userId,
      systemPrompt: systemPrompt,
    });
  } catch (error) {
    return handleError(error, "handleGetReuirements", projectId);
  }
}

async function handleImageGetRequirements(userMessage, userId, projectId, url) {
  const conversations = await UserModel.getUserMessages(userId, projectId);
  const conversationHistory = conversations.map(({ role, content }) => ({
    role,
    content,
  }));
  const systemPrompt = generateRequirementsPrompt(
    conversationHistory,
    userMessage,
  );
  try {
    const rawResponse = await aIChatCompletion({
      userId: userId,
      systemPrompt: systemPrompt,
      url: url,
    });
    return rawResponse;
  } catch (error) {
    return handleError(error, "handleImageGetRequirements", projectId);
  }
}

async function findFirstArray(data) {
  if (Array.isArray(data)) return data;

  if (typeof data === "object" && data !== null) {
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
        const retryAfter = error.headers["retry-after-ms"] || delay;
        console.log(`Rate limit exceeded. Retrying in ${retryAfter}ms...`);
        await new Promise((resolve) => setTimeout(resolve, retryAfter));
        delay *= 2;
      } else {
        return handleError(error, "exponentialBackoff", projectId);
      }
    }
  }
  console.error("Max retries reached");
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
  userId,
  result,
) {
  const projectCoordinator = new ProjectCoordinator(userId, projectId);
  const url = result.screenshotUrl;
  const consoleMessages = result.consoleMessages;
  const prompt = generateModificationPrompt(
    message,
    conversationContext,
    taskList,
    consoleMessages,
  );
  const rawArray = await aIChatCompletion({
    userId: userId,
    systemPrompt: prompt,
    url: url,
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
        console.error("Error fetching content for task:", error);
      }
    }

    return results;
  } catch (error) {
    await UserModel.addSystemLogToProject(
      userId,
      projectId,
      "Error in tasks picker:",
      error,
    );
    const jsonArrayString = await extractJsonArray(rawArray);
    const formattedJson = await projectCoordinator.JSONFormatter(
      jsonArrayString,
      `Error parsing JSON:${error}`,
    );
    const parsedArray = await findFirstArray(formattedJson);

    const results = [];
    for (const task of parsedArray) {
      try {
        const content = await getTaskContent(task, projectId);
        results.push({ ...task, content });
      } catch (error) {
        console.error("Error fetching content for task:", error);
      }
    }

    return results;
  }
}

async function getTaskContent(taskDetails, projectId) {
  const { name, extension } = taskDetails;
  const workspaceDir = path.join(__dirname, "workspace", projectId);
  const filePath = path.join(
    workspaceDir,
    `${name.replace(/\.[^.]*/, "")}.${extension}`,
  );

  // Check if the file exists and is readable
  try {
    await fsPromises.access(filePath, fs.constants.R_OK);
  } catch (accessError) {
    console.log(`File ${name} does not exist or is not readable.`);
    return; // Skip processing if the file doesn't exist
  }

  try {
    const content = await fsPromises.readFile(filePath, "utf8");
    return content;
  } catch (error) {
    console.error("Error reading file:", error);
    throw error;
  }
}

async function handleIssues(message, projectId, userId) {
  const result = await monitorBrowserConsoleErrors(
    `http://localhost:5001/${projectId}`,
  );
  const selectedProject = await UserModel.getUserProject(userId, projectId);
  const { taskList, projectOverView, appName } = selectedProject;
  const taskProcessor = new TaskProcessor(
    appName,
    projectOverView,
    projectId,
    taskList,
    selectedProject,
    userId,
  );

  const conversationHistory = await getConversationHistory(userId, projectId);
  const conversationContext = conversationHistory
    .map(({ role, content }) => `${role}: ${content}`)
    .join("\n");

  const assets = listAssets(projectId);
  const relevantTasks = await tasksPicker(
    message,
    projectId,
    conversationContext,
    taskList,
    userId,
    result,
  );
  const url = result.screenshotUrl;
  const consoleMessages = result.consoleMessages;
  const prompt = generateTaskGenerationPrompt(
    projectOverView,
    conversationContext,
    taskList,
    assets,
    relevantTasks,
    false,
    consoleMessages,
  );
  const totalMsg = `System Prompt:${prompt}\nUser Message:${message}`;
  const rawArray = await exponentialBackoff(() =>
    aIChatCompletion({
      userId: userId,
      systemPrompt: totalMsg,
      url: url,
    }),
  );

  const jsonArrayString = await extractJsonArray(rawArray);
  console.log('tasks',jsonArrayString )
  try {
    const parsedArray = JSON.parse(jsonArrayString);

    for (const task of parsedArray) {
      try {
        await taskProcessor.processTasks(userId, task, url);
        console.log("Task processed successfully.");
      } catch (error) {
        console.error("Error processing task:", error);
      }
    }
  } catch (error) {
    const projectCoordinator = new ProjectCoordinator(userId, projectId);

    try {
      const formattedJson = await projectCoordinator.JSONFormatter(
        jsonArrayString,
        `Error parsing JSON:${error}`,
      );
      const parsedArray = await findFirstArray(formattedJson);
      for (const task of parsedArray) {
        try {
          await taskProcessor.processTasks(userId, task, url);
          console.log("Task processed successfully.");
        } catch (error) {
          console.error("Error processing task:", error);
        }
      }
    } catch (formattingError) {
      handleError(formattingError, "handleIssues JSON formatting", projectId);
    }
  }
}

function listAssets(projectId) {
  const assetsDir = path.join(__dirname, "workspace", projectId, "assets");
  return fs.existsSync(assetsDir) ? fs.readdirSync(assetsDir) : [];
}

module.exports = {
  handleActions,
  handleIssues,
  handleUserReply,
  handleGetRequirements,
  handleImageGetRequirements,
};
