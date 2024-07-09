require('dotenv').config();
const ProjectCoordinator = require('./projectCoordinator');
const s3FileManager = require('../s3FileManager');
const logger = require('../logger');
const Redis = require("ioredis");
const Redlock = require("redlock");

class ExecutionManager {
    constructor(taskList, projectId, userId) {
        this.projectCoordinator = new ProjectCoordinator(userId, projectId);
        this.taskList = [...taskList];
        this.projectId = projectId;
        this.userId = userId;
        this.retryAttempts = 3;
        this.retryDelay = 1000; // 1 second

        // Redis configuration
        this.redisConfig = {
            host: process.env.REDIS_HOST || 'localhost',
            port: process.env.REDIS_PORT || 6379,
        };
        this.redisClient = new Redis(this.redisConfig);
        this.redlock = new Redlock(
            [this.redisClient],
            {
                driftFactor: 0.01,
                retryCount: 10,
                retryDelay: 200,
                retryJitter: 200,
                automaticExtensionThreshold: 500
            }
        );

        this.redisClient.on('error', (err) => logger.error('Redis Client Error', err));
        this.redisClient.on('connect', () => logger.info('Redis Client Connected'));
        this.redlock.on('clientError', (err) => logger.error('Redlock Client Error', err));
    }

    async executeTasks() {
        try {
            for (const task of this.taskList) {
                const taskKey = `executed_task:${this.projectId}:${task.name}`;
                const lock = await this.redlock.lock(`lock:${taskKey}`, 5000);

                try {
                    const isExecuted = await this.redisClient.get(taskKey);
                    if (isExecuted) {
                        logger.info(`Task ${task.name} already executed, skipping.`);
                        continue;
                    }

                    await this.processTask(task);
                    await this.redisClient.set(taskKey, 'true');
                    logger.info(`Successfully processed task ${task.name}`);
                } catch (error) {
                    logger.error(`Failed to process task ${task.name}:`, error);
                } finally {
                    await lock.unlock();
                }
            }

            await this.projectCoordinator.storeTasks(this.userId, this.taskList);
        } catch (error) {
            logger.error('Failed to execute tasks:', error);
        } finally {
            await this.cleanupProjectTasks();
        }
    }

    async processTask(task) {
        for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
            try {
                await this.validateAndExecuteTask(task);
                return;
            } catch (error) {
                if (attempt === this.retryAttempts) {
                    logger.error(`Failed to process task ${task.name} after ${this.retryAttempts} attempts:`, error);
                    throw error;
                }
                logger.warn(`Retrying task ${task.name}, attempt ${attempt + 1}`);
                await this.delay(this.retryDelay * attempt);
            }
        }
    }

    async validateAndExecuteTask(task) {
        if (!task.name || !task.extension) {
            throw new Error('Task name or extension is missing');
        }

        let content = task.content;

        if (task.extension === 'js') {
            content = this.processJavaScriptContent(content);
        }

        const fileName = `${task.name.replace(/\.[^.]*/, '')}.${task.extension}`;
        await s3FileManager.writeFile(this.projectId, fileName, content);
        logger.info(`Created file: ${fileName}`);
    }

    processJavaScriptContent(content) {
        // Replace placeholder URLs with an empty string, handling both template literals and regular strings
        return content.replace(/(`|'|")https:\/\/via\.placeholder\.com\/[^'"`\s]+\1/g, '""')
                      .replace(/`https:\/\/via\.placeholder\.com\/[^`]+`/g, '``');
    }

    async cleanupProjectTasks() {
        const projectTaskPattern = `executed_task:${this.projectId}:*`;
        const keys = await this.redisClient.keys(projectTaskPattern);
        
        if (keys.length > 0) {
            await this.redisClient.del(...keys);
            logger.info(`Cleaned up ${keys.length} task records for project ${this.projectId}`);
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async cleanup() {
        await this.cleanupProjectTasks();
        await this.redisClient.quit();
    }
}

module.exports = ExecutionManager;