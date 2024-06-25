require('dotenv').config();
const aIChatCompletion = require("../ai_provider");
const ExecutionManager = require("./executionManager");
const { createPrompt, createMoreContext } = require("../utilities/promptUtils");
const { extractJsonArray } = require("../utilities/functions");
const ProjectCoordinator = require("./projectCoordinator");
const s3FileManager = require('../s3FileManager');
const { promisify } = require('util');
const Queue = require('better-queue');

class TaskProcessor {
  constructor(appName, projectOverView, projectId, taskList, selectedProject, userId) {
    this.selectedProject = selectedProject;
    this.projectId = projectId;
    this.projectCoordinator = new ProjectCoordinator(userId, projectId);
    this.appName = appName;
    this.projectOverView = projectOverView;
    this.taskList = taskList;
    this.userId = userId;
    this.fileLocks = new Map();
    this.taskQueue = new Queue(this.processQueuedTask.bind(this), { concurrent: 1 });
  }

  async processQueuedTask(queuedItem, cb) {
    try {
      await this.processTasks([queuedItem.task], queuedItem.url);
      cb(null, `Task processed successfully: ${queuedItem.task.name}`);
    } catch (error) {
      console.error('Error in processQueuedTask:', error);
      cb(error);
    }
  }

  async processTasks(tasks, url) {
    const taskArray = Array.isArray(tasks) ? tasks : [tasks];
    
    const creationTasks = taskArray.filter(task => task.taskType === 'Create');
    const modificationTasks = taskArray.filter(task => task.taskType === 'Modify');
  
    // Process creation tasks first
    for (const task of creationTasks) {
      await this.executionManager(task, url);
    }
  
    // Then process modification tasks
    for (const task of modificationTasks) {
      await this.executionManager(task, url);
    }

    console.log("All tasks processed sequentially.");
  
  // Verify index.html content
  const indexContent = await s3FileManager.readFile(this.projectId, 'index.html');
  console.log("Final index.html content:", indexContent);
  }

  queueTask(tasks, url) {
    const taskArray = Array.isArray(tasks) ? tasks : [tasks];
    taskArray.forEach(task => {
      this.taskQueue.push({ task, url });
    });
  }

  waitForQueueCompletion() {
    return new Promise((resolve) => {
      this.taskQueue.on('drain', resolve);
    });
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
      throw error;
    }
  }

  async handleCreate(taskDetails, url) {
    const { promptToCodeWriterAi } = taskDetails;
    console.log(`Creating file: ${taskDetails.name}.${taskDetails.extension}`);
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

  async acquireLock(fileName) {
    while (this.fileLocks.has(fileName)) {
      await new Promise(resolve => setTimeout(resolve, 100)); // Wait for 100ms before trying again
    }
    this.fileLocks.set(fileName, true);
  }

  releaseLock(fileName) {
    this.fileLocks.delete(fileName);
  }

  async handleModify(taskDetails) {
    const { name, promptToCodeWriterAi, extension } = taskDetails;
    const file = `${name.replace(/\.[^.]*/, "")}.${extension}`;

    await this.acquireLock(file);

    try {
      const fileContent = await s3FileManager.readFile(this.projectId, file);
      
      if (!fileContent) {
        console.log(`File ${name} does not exist or is not readable.`);
        return;
      }

      const moreContext = createMoreContext(taskDetails, fileContent, promptToCodeWriterAi);
      const modifiedFileContent = await this.projectCoordinator.codeWriter(moreContext);

      if (modifiedFileContent && typeof modifiedFileContent === "string") {
        await this.atomicWrite(file, modifiedFileContent);

        const details = await this.projectCoordinator.codeAnalyzer(modifiedFileContent);
        const updatedTask = { name, extension, content: details };
        await this.projectCoordinator.storeTasks(this.userId, [updatedTask]);
      } else {
        console.log(`Failed to modify file ${name} due to invalid content.`);
      }
    } catch (error) {
      console.error(`Error in modifying file ${name}:`, error);
    } finally {
      this.releaseLock(file);
    }

    console.log("HTML/Tailwind modification completed successfully.");
  }

  async atomicWrite(file, content) {
    console.log(`Attempting to write to file: ${file}`);
    const tempFile = `${file}.temp`;
    try {
      await s3FileManager.writeFile(this.projectId, tempFile, content);
      console.log(`Temp file written: ${tempFile}`);
      await s3FileManager.renameFile(this.projectId, tempFile, file);
      console.log(`File renamed from ${tempFile} to ${file}`);
    } catch (error) {
      console.error(`Error in atomic write for file ${file}:`, error);
      await s3FileManager.deleteFile(this.projectId, tempFile);
      throw error;
    }
  }
}

module.exports = { TaskProcessor };