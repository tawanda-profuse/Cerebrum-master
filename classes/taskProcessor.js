require('dotenv').config();
const aIChatCompletion = require("../ai_provider");
const ExecutionManager = require("./executionManager");
const { createPrompt, createMoreContext } = require("../utilities/promptUtils");
const { extractJsonArray } = require("../utilities/functions");
const ProjectCoordinator = require("./projectCoordinator");
const s3FileManager = require('../s3FileManager');

class TaskProcessor {
  constructor(appName, projectOverView, projectId, taskList, selectedProject, userId) {
    this.selectedProject = selectedProject;
    this.projectId = projectId;
    this.projectCoordinator = new ProjectCoordinator(userId, projectId);
    this.appName = appName;
    this.projectOverView = projectOverView;
    this.taskList = taskList;
    this.userId = userId;
  }

  async processTasks(task, url) {
    if (["Modify", "Create"].includes(task.taskType)) {
      try {
        await this.executionManager(task, url);
      } catch (error) {
        console.error("Error processing tasks:", error);
      }
    }
  }

  async executionManager(task, url) {
    const { taskType, ...taskDetails } = task;

    try {
      switch (taskType) {
        case "Modify":
          await this.handleModify(taskDetails);
          break;
        case "Create":
          await this.handleCreate(taskDetails, url);
          break;
        default:
          console.error("Unknown task type:", taskType);
          break;
      }
    } catch (error) {
      console.error("Error in execution manager:", error);
    }
  }

  async handleCreate(taskDetails, url) {
    const { promptToCodeWriterAi } = taskDetails;
    const prompt = createPrompt(taskDetails, promptToCodeWriterAi);   
      const rawArray = await aIChatCompletion({
        userId: this.userId,
        systemPrompt: prompt,
        url: url,
      });
      const jsonArrayString = await extractJsonArray(rawArray);
      try {
      const taskList = JSON.parse(jsonArrayString);
      const newArray = this.findFirstArray(taskList);
      const developerAssistant = new ExecutionManager(newArray, this.projectId, this.userId);
      await developerAssistant.executeTasks();
    } catch (error) {
      await this.handleError(error, jsonArrayString, taskDetails);
    }
  }

  async storeUpdatedTasks(taskDetails) {
    const updatedTaskDetails = { ...taskDetails };
    await this.projectCoordinator.storeTasks(this.userId, updatedTaskDetails);
  }

  findFirstArray(data) {
    if (Array.isArray(data)) return data;
    if (typeof data === "object" && data !== null) {
      const firstArray = Object.values(data).find(Array.isArray);
      if (firstArray) return firstArray;
    }
    return [data];
  }

  async handleError(error, jsonArrayString, taskDetails) {
    const formattedJson = await this.projectCoordinator.JSONFormatter(jsonArrayString, `Error parsing JSON: ${error}`);
    const cleanedArray = this.findFirstArray(formattedJson);
    const developerAssistant = new ExecutionManager(cleanedArray, this.projectId, this.userId);
    await developerAssistant.executeTasks();
    await this.storeUpdatedTasks(taskDetails);
  }

  async handleModify(taskDetails) {
    const { name, promptToCodeWriterAi, extension } = taskDetails;
    try {
      const file = `${name.replace(/\.[^.]*/, "")}.${extension}`;
      const fileContent = await s3FileManager.readFile(this.projectId, file);
      
      if (!fileContent) {
        console.log(`File ${name} does not exist or is not readable.`);
        return;
      }

      const moreContext = createMoreContext(taskDetails, fileContent, promptToCodeWriterAi);
      const modifiedFileContent = await this.projectCoordinator.codeWriter(moreContext);

      if (modifiedFileContent && typeof modifiedFileContent === "string") {
        await s3FileManager.writeFile(this.projectId, file, modifiedFileContent);

        const details = await this.projectCoordinator.codeAnalyzer(modifiedFileContent);
        const updatedTask = { name, extension, content: details };
        await this.projectCoordinator.storeTasks(this.userId, [updatedTask]);
      } else {
        console.log(`Failed to modify file ${name} due to invalid content.`);
      }
    } catch (error) {
      console.error(`Error in modifying file ${name}:`, error);
    }

    try {
      console.log("HTML/Tailwind modification completed successfully.");
    } catch (error) {
      console.log("Issues resolved");
    }
  }
}

module.exports = { TaskProcessor };