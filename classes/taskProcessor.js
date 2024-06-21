require('dotenv').config();
const path = require('path');
const fs = require('fs');
const fsPromises = fs.promises;
const OpenAI = require('openai');
const ExecutionManager = require('./executionManager');
const { createPrompt, createMoreContext } = require('../utilities/promptUtils');
const { extractJsonArray } = require('../utilities/functions');
const ProjectCoordinator = require('./projectCoordinator');
const UserModel = require('../models/User.schema');

class TaskProcessor {
    constructor(
        appName,
        projectOverView,
        projectId,
        taskList,
        selectedProject,
        userId
    ) {
        this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        this.selectedProject = selectedProject;
        this.projectId = projectId;
        this.projectCoordinator = new ProjectCoordinator(userId, projectId);
        this.appName = appName;
        this.projectOverView = projectOverView;
        this.taskList = taskList;
    }

    async processTasks(userId, task) {
        if (['Modify', 'Create'].includes(task.taskType)) {
            try {
                await this.executionManager(userId, task);
            } catch (error) {
                console.error('Error processing tasks:', error);
            }
        }
    }

    async listAssets() {
        const assetsDir = path.join(
            __dirname,
            'workspace',
            this.projectId,
            'assets'
        );

        if (!fs.existsSync(assetsDir)) {
            return [];
        }

        return fs.readdirSync(assetsDir);
    }

    async executionManager(userId, task) {
        const { taskType, ...taskDetails } = task;

        try {
            switch (taskType) {
                case 'Modify':
                    await this.handleModify(userId, taskDetails);
                    break;
                case 'Create':
                    await this.handleCreate(userId, taskDetails);
                    break;
                default:
                    console.error('Unknown task type:', taskType);
                    break;
            }
        } catch (error) {
            console.error('Error in execution manager:', error);
        }
    }

    async handleCreate(userId, taskDetails) {
        const { promptToCodeWriterAi } = taskDetails;
        const logs = await UserModel.getProjectLogs(userId, this.projectId);
        const prompt = createPrompt(taskDetails, promptToCodeWriterAi, logs);
        await UserModel.addTokenCountToUserSubscription(userId, prompt);
        const rawArray = await this.generateTaskList(prompt, userId);
        const jsonArrayString = await extractJsonArray(rawArray);

        try {
            const taskList = JSON.parse(jsonArrayString);
            await this.executeTasks(taskList, userId);
        } catch (error) {
            console.error('Error handling create task:', error);
            await this.handleError(error, jsonArrayString, userId, taskDetails);
        }
    }

    async generateTaskList(prompt, userId) {
        const response = await this.openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [{ role: 'system', content: prompt }],
        });
        const rawResponse = response.choices[0].message.content.trim();
        await UserModel.addTokenCountToUserSubscription(userId, rawResponse);
        return rawResponse;
    }

    async executeTasks(taskList, userId) {
        await this.projectCoordinator.codeReviewer(
            this.projectOverView,
            userId,
            taskList
        );
        const updatedProjectAfterReview = await UserModel.getUserProject(
            userId,
            this.projectId
        );
        taskList = updatedProjectAfterReview.taskList;
        const developerAssistant = new ExecutionManager(
            taskList,
            this.projectId,
            userId
        );
        await developerAssistant.executeTasks(this.appName, userId);
    }

    async storeUpdatedTasks(userId, taskDetails) {
        await this.projectCoordinator.logStep(
            `File ${taskDetails.name} created successfully.`
        );
        const updatedTaskDetails = { ...taskDetails };
        await this.projectCoordinator.storeTasks(userId, updatedTaskDetails);
    }

    async handleError(error, jsonArrayString, userId, taskDetails) {
        console.error(`Error parsing JSON: ${error}`);
        const formattedJson = await this.projectCoordinator.JSONFormatter(
            jsonArrayString,
            `Error parsing JSON: ${error}`
        );
        await this.executeTasks(formattedJson, userId);
        await this.storeUpdatedTasks(userId, taskDetails);
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
                projectId,
                'File creation failed'
            );
        }
    }

    async handleModify(userId, taskDetails) {
        const { name, promptToCodeWriterAi, extension } = taskDetails;
        try {
            const workspaceDir = path.join(
                __dirname,
                '..',
                'workspace',
                this.projectId
            );
            const file = `${name.replace(/\.[^.]*/, '')}.${extension}`;
            const filePath = path.join(workspaceDir, file);
            const fileContent = await fsPromises.readFile(filePath, 'utf8');
            const moreContext = createMoreContext(
                taskDetails,
                fileContent,
                promptToCodeWriterAi
            );
            await UserModel.addTokenCountToUserSubscription(
                userId,
                moreContext
            );
            const modifiedFileContent =
                await this.projectCoordinator.codeWriter(moreContext, userId);
            if (
                modifiedFileContent &&
                typeof modifiedFileContent === 'string'
            ) {
                fs.writeFileSync(filePath, modifiedFileContent, 'utf8');

                // Analyze the updated content and store the task details
                const details =
                    await this.projectCoordinator.codeAnalyzer(
                        modifiedFileContent
                    );
                const updatedTask = { name, extension, content: details };
                await this.projectCoordinator.storeTasks(userId, [updatedTask]);

                await this.projectCoordinator.logStep(
                    `File ${name} modified and task list updated successfully.`
                );
            } else {
                await this.projectCoordinator.logStep(
                    `Failed to modify file ${name} due to invalid content.`
                );
            }
        } catch (error) {
            console.error(`Error in modifying file ${name}:`, error);
        }

        try {
            await this.projectCoordinator.logStep(
                'HTML/Tailwind modification completed successfully.'
            );
        } catch (error) {
            await this.projectCoordinator.logStep('Issues resolved');
        }
    }
}

module.exports = { TaskProcessor };
