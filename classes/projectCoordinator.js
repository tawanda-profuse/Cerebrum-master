require('dotenv').config();
const UserModel = require('../models/User.schema');
const aIChatCompletion = require('../ai_provider');
const { extractJsonArray } = require('../utilities/functions');
const {
    generateJsonFormatterPrompt,
} = require('../utilities/promptUtils');

class ProjectCoordinator {
    constructor(userId, projectId) {
        this.projectId = projectId;
        this.userId = userId;
    }

    async logStep(message) {
        await UserModel.addSystemLogToProject(
            this.userId,
            this.projectId,
            message
        );
    }

    async findFirstArray(data) {
        if (Array.isArray(data)) {
            return data;
        }

        if (typeof data === 'object' && data !== null) {
            const firstArray = Object.values(data).find((value) =>
                Array.isArray(value)
            );
            if (firstArray) {
                return firstArray;
            }
        }

        return [data];
    }

    async JSONFormatter(rawJsonString, error) {
        const aiProvider = process.env.AI_PROVIDER;
        const prompt = generateJsonFormatterPrompt(rawJsonString, error);

        let res;
        if (aiProvider === 'openai') {
            res = await aIChatCompletion({
                userId: this.userId,
                systemPrompt: prompt,
                response_format: { type: 'json_object' },
            });
        } else {
            res = await aIChatCompletion({
                userId: this.userId,
                systemPrompt: prompt,
            });
        }
        try {
            let formattedJson = JSON.parse(res);
            return formattedJson;
        } catch (error) {
            console.error('Error parsing JSON Again:', error);
        }
    }

    async extractAndParseJson(rawJsonString) {
        try {
            const jsonArrayString = await extractJsonArray(rawJsonString);
            const parsedArray = JSON.parse(jsonArrayString);
            return parsedArray;
        } catch (error) {
            console.error('Error parsing JSON:', error.message);
            return null;
        }
    }

    async storeTasks(userId, tasks) {
        if (!Array.isArray(tasks)) {
            tasks = [tasks];
        }
        for (const task of tasks) {
            try {
                await UserModel.addTaskToProject(userId, this.projectId, task);
            } catch (error) {
                console.error('Error adding or updating task:', error);
            }
        }
    }

    async getConversationHistory(userId, projectId) {
        const conversations = await UserModel.getUserMessages(
            userId,
            projectId
        );
        return conversations.map(({ role, content }) => ({ role, content }));
    }

    async codeReviewer(userId, taskList) {
        const conversations = await User.getUserMessages(
            userId,
            this.projectId
        );
        const conversationHistory = conversations.map(({ role, content }) => ({
            role,
            content,
        }));
        const conversationContext = conversationHistory
            .map(({ role, content }) => `${role}: ${content}`)
            .join('\n');

        const assets = this.listAssets();
        let context = {
            taskList,
            assets,
            conversationContext,
            modifications: [],
        };

        for (const task of taskList) {
            const componentFileName = `${task.name}.${task.extension}`;

            let componentCodeAnalysis;
            try {
                componentCodeAnalysis = task.content;
            } catch (readError) {
                console.error(
                    `Error reading the component file ${componentFileName}:`,
                    readError
                );
                componentCodeAnalysis = `Error reading component file ${componentFileName}`;
            }

            context.currentComponent = {
                name: componentFileName,
                code: componentCodeAnalysis,
            };
            const logs = User.getProjectLogs(this.userId, this.projectId);
            const prompt = generateComponentReviewPrompt(context, logs);
            const res = await this.openaiApiCall(prompt, {
                type: 'json_object',
            });

            let arr;
            let aiResponses;
            try {
                arr = JSON.parse(res);
                aiResponses = await this.findFirstArray(arr);
            } catch (parseError) {
                console.error('Error parsing the AI response:', parseError);
                continue;
            }
            for (const aiResponse of aiResponses) {
                if (aiResponse.newCode === null) {
                    context.modifications.push({
                        component: aiResponse.component,
                        newCode: null,
                    });
                    return null;
                }

                const newCode = aiResponse.newCode;

                // Save the updated task content using storeTasks method
                const updatedTask = { ...task, content: newCode };

                try {
                    await this.storeTasks(userId, [updatedTask]);
                    User.addSystemLogToProject(
                        this.userId,
                        this.projectId,
                        `Updated ${componentFileName} successfully.`
                    );
                    context.modifications.push({
                        component: aiResponse.component,
                        newCode,
                    });
                    return newCode;
                } catch (writeError) {
                    console.error(
                        `Error writing the updated code to ${componentFileName}:`,
                        writeError
                    );
                }
            }
        }
    }
}

module.exports = ProjectCoordinator;
