require('dotenv').config();
const ProjectCoordinator = require('./projectCoordinator');
const s3FileManager = require('../s3FileManager');

class ExecutionManager {
    constructor(taskList, projectId, userId) {
        this.projectCoordinator = new ProjectCoordinator(userId, projectId);
        this.taskList = [...taskList];
        this.projectId = projectId;
        this.userId = userId;
        this.executedTasks = new Set();
    }

    async executeTasks() {
        for (const task of this.taskList) {
            if (this.executedTasks.has(task.name)) {
                continue;
            }

            try {
                await this.processTask(task);
                this.executedTasks.add(task.name);
            } catch (error) {
                console.error(`Error processing task ${task.name}:`, error);
            }
        }
    }

    async processTask(task) {
        if (!task.name || !task.extension) {
            throw new Error('Task name or extension is missing');
        }

        const fileName = `${task.name.replace(/\.[^.]*/, '')}.${task.extension}`;
        await s3FileManager.writeFile(this.projectId, fileName, task.content);

        await this.projectCoordinator.storeTasks(this.userId, this.taskList);
    }
}

module.exports = ExecutionManager;
