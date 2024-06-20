// Importing necessary modules and initializing OpenAI with the API key from .env file
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const UserModel = require('./User.schema');
const fsPromises = fs.promises;
const ProjectCoordinator = require('./projectCoordinator');

class ExecutionManager {
    constructor(taskList, projectId, userId) {
        this.projectCoordinator = new ProjectCoordinator(userId, projectId);
        this.taskList = [...taskList]; // Ensure we have a copy of the taskList
        this.projectId = projectId;
        this.executedTasks = new Set(); // Track executed tasks to avoid repetition
    }

    async executeTasks(appName, userId) {
        // Setting up the path for the application
        const workspaceDir = path.join(__dirname, 'workspace');
        const appPath = path.join(workspaceDir, this.projectId);
        // Create the directory if it doesn't exist
        if (!fs.existsSync(appPath)) {
            fs.mkdirSync(appPath, { recursive: true });
        }
        await UserModel.addSystemLogToProject(
            userId,
            this.projectId,
            `Starting task execution for project: ${this.projectId}`
        );

        for (const task of this.taskList) {
            if (this.executedTasks.has(task.name)) {
                await UserModel.addSystemLogToProject(
                    userId,
                    this.projectId,
                    `Skipping already executed task: ${task.name}`
                );
                continue;
            }

            await UserModel.addSystemLogToProject(
                userId,
                this.projectId,
                `Processing task: ${task.name}`
            );
            await this.processTask(task, appName, appPath, userId);
            this.executedTasks.add(task.name);
            await UserModel.addSystemLogToProject(
                userId,
                this.projectId,
                `Finished processing task: ${task.name}`
            );
        }
        await UserModel.addSystemLogToProject(
            userId,
            this.projectId,
            `Completed all tasks for project: ${this.projectId}`
        );
    }

    async processTask(task, appName, appPath, userId) {
        const srcDir = this.ensureSrcDirectory(appPath);
        await this.projectCoordinator.logStep(
            `We are now creating a HTML/Tailwind file named ${task.name}...`
        );

        const componentFilePath = this.getFilePath(srcDir, task);
        let taskFileContent = task.content;
        await this.writeFile(componentFilePath, taskFileContent);

        const details =
            await this.projectCoordinator.codeAnalyzer(taskFileContent);
        task.content = details;
        await this.projectCoordinator.storeTasks(userId, this.taskList);

        await this.projectCoordinator.logStep(
            `The code has been written for the HTML/Tailwind file ${task.name} in the project ${appName}`
        );
    }

    ensureSrcDirectory(appPath) {
        const srcDir = appPath;
        if (!fs.existsSync(srcDir)) {
            fs.mkdirSync(srcDir, { recursive: true });
        }
        return srcDir;
    }

    getFilePath(srcDir, task) {
        const fileName = `${task.name.replace(/\.[^.]*/, '')}.${task.extension}`;
        return path.join(srcDir, fileName);
    }

    async writeFile(filePath, fileContent) {
        await fsPromises.writeFile(filePath, fileContent);

        if (fs.existsSync(filePath)) {
            await this.projectCoordinator.logStep(
                `File created successfully at ${filePath}`
            );
        } else {
            await this.projectCoordinator.logStep(
                `Failed to create the file at ${filePath}`
            );
            await UserModel.addSystemLogToProject(
                userId,
                this.projectId,
                'File creation failed'
            );
        }
    }
}

// Exporting the ExecutionManager class
module.exports = ExecutionManager;
