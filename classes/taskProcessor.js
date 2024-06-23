const aIChatCompletion = require("../ai_provider");
const path = require("path");
const fs = require("fs");
const fsPromises = fs.promises;
const ExecutionManager = require("./executionManager");
const { createPrompt, createMoreContext } = require("../utilities/promptUtils");
const { extractJsonArray } = require("../utilities/functions");
const ProjectCoordinator = require("./projectCoordinator");
const UserModel = require("../models/User.schema");

class TaskProcessor {
  constructor(
    appName,
    projectOverView,
    projectId,
    taskList,
    selectedProject,
    userId,
  ) {
    this.selectedProject = selectedProject;
    this.projectId = projectId;
    this.projectCoordinator = new ProjectCoordinator(userId, projectId);
    this.appName = appName;
    this.projectOverView = projectOverView;
    this.taskList = taskList;
  }

  async processTasks(userId, task, url) {
    if (["Modify", "Create"].includes(task.taskType)) {
      try {
        await this.executionManager(userId, task, url);
      } catch (error) {
        console.error("Error processing tasks:", error);
      }
    }
  }

  async listAssets() {
    const assetsDir = path.join(
      __dirname,
      "workspace",
      this.projectId,
      "assets",
    );

    if (!fs.existsSync(assetsDir)) {
      return [];
    }

    return fs.readdirSync(assetsDir);
  }

  async executionManager(userId, task, url) {
    const { taskType, ...taskDetails } = task;

    try {
      switch (taskType) {
        case "Modify":
          await this.handleModify(userId, taskDetails);
          break;
        case "Create":
          await this.handleCreate(userId, taskDetails, url);
          break;
        default:
          console.error("Unknown task type:", taskType);
          break;
      }
    } catch (error) {
      console.error("Error in execution manager:", error);
    }
  }

  async handleCreate(userId, taskDetails, url) {
    const { promptToCodeWriterAi } = taskDetails;
    const prompt = createPrompt(taskDetails, promptToCodeWriterAi);

    const rawArray = await aIChatCompletion({
      userId: userId,
      systemPrompt: prompt,
      url: url,
    });
    const jsonArrayString = await extractJsonArray(rawArray);

    try {
      const taskList = JSON.parse(jsonArrayString);
      const newArray = await this.findFirstArray(taskList);
      const developerAssistant = new ExecutionManager(
        newArray,
        this.projectId,
        userId,
      );
      await developerAssistant.executeTasks(this.appName, userId);
    } catch (error) {
      await this.handleError(error, jsonArrayString, userId, taskDetails);
    }
  }

  async storeUpdatedTasks(userId, taskDetails) {
    await this.projectCoordinator.logStep(
      `File ${taskDetails.name} created successfully.`,
    );
    const updatedTaskDetails = { ...taskDetails };
    await this.projectCoordinator.storeTasks(userId, updatedTaskDetails);
  }

  async findFirstArray(data) {
    if (Array.isArray(data)) return data;

    if (typeof data === "object" && data !== null) {
      const firstArray = Object.values(data).find(Array.isArray);
      if (firstArray) return firstArray;
    }

    return [data];
  }

  async handleError(error, jsonArrayString, userId, taskDetails) {
    const formattedJson = await this.projectCoordinator.JSONFormatter(
      jsonArrayString,
      `Error parsing JSON: ${error}`,
    );
    const cleanedArray = await this.findFirstArray(formattedJson);
    const developerAssistant = new ExecutionManager(
      cleanedArray,
      this.projectId,
      userId,
    );
    await developerAssistant.executeTasks(this.appName, userId);
    await this.storeUpdatedTasks(userId, taskDetails);
  }

  async writeFile(filePath, fileContent) {
    await fsPromises.writeFile(filePath, fileContent);

    if (fs.existsSync(filePath)) {
      await this.projectCoordinator.logStep(
        `File created successfully at ${filePath}`,
      );
    } else {
      await this.projectCoordinator.logStep(
        `Failed to create the file at ${filePath}`,
      );
      await UserModel.addSystemLogToProject(
        userId,
        projectId,
        "File creation failed",
      );
    }
  }

  async handleModify(userId, taskDetails) {
    const { name, promptToCodeWriterAi, extension } = taskDetails;
    try {
      const workspaceDir = path.join(
        __dirname,
        "..",
        "workspace",
        this.projectId,
      );
      const file = `${name.replace(/\.[^.]*/, "")}.${extension}`;
      const filePath = path.join(workspaceDir, file);
      // Check if the file exists and is readable
      try {
        await fsPromises.access(filePath, fs.constants.R_OK);
      } catch (accessError) {
        console.log(`File ${name} does not exist or is not readable.`);
        return; // Skip processing if the file doesn't exist
      }
      const fileContent = await fsPromises.readFile(filePath, "utf8");
      const moreContext = createMoreContext(
        taskDetails,
        fileContent,
        promptToCodeWriterAi,
      );
      const modifiedFileContent = await this.projectCoordinator.codeWriter(moreContext);
      if (modifiedFileContent && typeof modifiedFileContent === "string") {
        fs.writeFileSync(filePath, modifiedFileContent, "utf8");

        // Analyze the updated content and store the task details
        const details =
          await this.projectCoordinator.codeAnalyzer(modifiedFileContent);
        const updatedTask = { name, extension, content: details };
        await this.projectCoordinator.storeTasks(userId, [updatedTask]);

        await this.projectCoordinator.logStep(
          `File ${name} modified and task list updated successfully.`,
        );
      } else {
        await this.projectCoordinator.logStep(
          `Failed to modify file ${name} due to invalid content.`,
        );
      }
    } catch (error) {
      console.error(`Error in modifying file ${name}:`, error);
    }

    try {
      await this.projectCoordinator.logStep(
        "HTML/Tailwind modification completed successfully.",
      );
    } catch (error) {
      await this.projectCoordinator.logStep("Issues resolved");
    }
  }
}

module.exports = { TaskProcessor };
