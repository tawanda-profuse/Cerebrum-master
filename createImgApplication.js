require("dotenv").config();
const OpenAI = require("openai");
const ProjectCoordinator = require("./projectCoordinator");
const User = require("./User.schema");
const { TaskProcessor } = require("./taskProcessor");
const { extractJsonArray } = require("./utilities/functions");
const {
    generateModificationPrompt,
    generateTaskGenerationPrompt,
    replyUserWithImage,
    generateWebAppPrompt
  } = require("./promptUtils");
const ExecutionManager = require("./executionManager");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function handleImages(userMessage, userId, projectId, url) {
  const selectedProject = User.getUserProject(userId, projectId)[0];
  const { taskList, projectOverView, appName } = selectedProject;
  const conversations = await User.getUserMessages(userId, projectId);
    const conversationHistory = conversations.map(({ role, content }) => ({
      role,
      content,
    }));
  const taskProcessor = new TaskProcessor(
    appName,
    projectOverView,
    projectId,
    taskList,
    userId,
  );

  

  try {
    const systemPrompt = replyUserWithImage(
      conversationHistory,
      projectOverView,
      userMessage,
      taskList,
    );
    User.addTokenCountToUserSubscription(userId, systemPrompt);
    const response = await openAiChatCompletion(userId, systemPrompt, url);
    const result = await analyzeResponse(
        response,
        userId,
        projectId,
        taskProcessor,
        url,
        userMessage
      );
    return result; // Return the result from analyzeResponse
  } catch (error) {
    return undefined; // Return undefined in case of error
  }
}

async function tasksPicker(
    message,
    projectId,
    conversationContext,
    taskList,
    userId,
    url
  ) {
    const projectCoordinator = new ProjectCoordinator(userId, projectId);
    const logs = User.getProjectLogs(userId, projectId);
    const prompt = generateModificationPrompt(
      message,
      conversationContext,
      taskList,
      logs,
    );
    User.addTokenCountToUserSubscription(userId, prompt);
  
    
      const rawArray = await openAiChatCompletion(userId, prompt,url);
      const jsonArrayString = extractJsonArray(rawArray);
      try {
      const parsedArray = JSON.parse(jsonArrayString);
      return await Promise.all(
        parsedArray.map(async (task) => {
          const content = await getTaskContent(task, projectId);
          return { ...task, content };
        }),
      );
    } catch (error) {
      User.addSystemLogToProject(
        userId,
        projectId,
        "Error in tasks picker:",
        error,
      );
      const jsonArrayString = extractJsonArray(rawArray);
      const formattedJson = await projectCoordinator.JSONFormatter(
        jsonArrayString,
        `Error parsing JSON:${error}`,
      );
      const parsedArray = await findFirstArray(formattedJson);
  
      return await Promise.all(
        parsedArray.map(async (task) => {
          const content = await getTaskContent(task, projectId);
          return { ...task, content };
        }),
      );
    }
  }

  async function getTaskContent(taskDetails, projectId) {
    const { name, extension } = taskDetails;
    const workspaceDir = path.join(__dirname, "workspace", projectId);
    const filePath = path.join(
      workspaceDir,
      `${name.replace(/\.[^.]*/, "")}.${extension}`,
    );
  
    return await fsPromises.readFile(filePath, "utf8");
  }

  async function findFirstArray(data) {
    if (Array.isArray(data)) return data;
  
    if (typeof data === "object" && data !== null) {
      return Object.values(data).find(Array.isArray) || [data];
    }
  
    return [data];
  }  



// Utility function for OpenAI API calls
async function openAiChatCompletion(userId, systemPrompt, url) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: systemPrompt },
            {
              type: "image_url",
              image_url: {
                url: url,
              },
            },
          ],
        },
      ],
    });
    const rawResponse = response.choices[0].message.content.trim();
    User.addTokenCountToUserSubscription(userId, rawResponse);
    return rawResponse;
  } catch (error) {
    console.error("OpenAI API Error:", error);
    return undefined; // Return undefined in case of error
  }
}

async function analyzeResponse(
  response,
  userId,
  projectId,
  taskProcessor,
  url,
  userMessage
) {
  const selectedProject = User.getUserProject(userId, projectId)[0];
  const { taskList, projectOverView, appName } = selectedProject;
  const projectCoordinator = new ProjectCoordinator(userId, projectId);
  const conversations = await User.getUserMessages(userId, projectId);
  const conversationHistory = conversations.map(({ role, content }) => ({
    role,
    content,
  }));
  if (response === "getRequirements") {
    return "getRequirements";
  } else if (response === "createApplication") {
    const prompt = generateWebAppPrompt(
      conversationHistory,
      true
    );
  
    User.addTokenCountToUserSubscription(userId, prompt);
  
    const rawArray = await openAiChatCompletion(userId, prompt, url);
    const jsonArrayString = extractJsonArray(rawArray);
  
    try {
      const parsedArray = JSON.parse(jsonArrayString);
      const refinedList = await findFirstArray(parsedArray)
      await projectCoordinator.generateTaskList(refinedList, userId);
      const developerAssistant = new ExecutionManager(taskList, projectId, userId);
      await developerAssistant.executeTasks(appName, userId);
      await projectCoordinator.logStep("All tasks have been executed.");
      selectedProject.sketches = [];
      User.addProject(userId, selectedProject);
      return `Great news! Your project has been built successfully. You can check it out at http://localhost:5001/${projectId}. If you need any adjustments, just let me know and I'll take care of it for you.`;
    } catch (error) {
      const newJson = await projectCoordinator.JSONFormatter(
        jsonArrayString,
        `Error parsing JSON:${error}`
      );
      const refinedList = await findFirstArray(newJson)
      await projectCoordinator.generateTaskList(refinedList, userId);
      const developerAssistant = new ExecutionManager(taskList, projectId, userId);
      await developerAssistant.executeTasks(appName, userId);
      await projectCoordinator.logStep("All tasks have been executed.");
      selectedProject.sketches = [];
      User.addProject(userId, selectedProject);
      return `Great news! Your project has been built successfully. You can check it out at http://localhost:5001/${projectId}. If you need any adjustments, just let me know and I'll take care of it for you.`;
    }
  } else if (response === "modifyApplication") {
    const relevantTasks = await tasksPicker(
        userMessage,
        projectId,
        conversationHistory ,
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
    User.addTokenCountToUserSubscription(userId, prompt2);
    const msg = `The user's message ${userMessage}\n\n${systemPrompt}`
    const rawArray2 = await exponentialBackoff(() =>
      openAiChatCompletion(userId, msg, url)
    );
  
    try {
      const jsonArrayString = extractJsonArray(rawArray2);
      const parsedArray = JSON.parse(jsonArrayString);
  
      await Promise.all(
        parsedArray.map((task) => taskProcessor.processTasks(userId, task))
      );
      return 'I have finished modifying your application as requested.';
    } catch (error) {
      handleError(error, "handleIssues", projectId);
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
          parsedArray.map((task) => taskProcessor.processTasks(userId, task))
        );
        return 'I have finished modifying your application as requested.';
      } catch (formattingError) {
        handleError(formattingError, "handleIssues JSON formatting", projectId);
      }
    }
  } 
  
}

module.exports = { handleImages };
