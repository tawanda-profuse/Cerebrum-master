require('dotenv').config();
const mongoose = require('mongoose');
const Image = require('./models/Image.schema');
const path = require('path');
const fs = require('fs');
const { generateImageWithDallE, downloadImage } = require('./imageGeneration');
const User = require('./User.schema');
const OpenAI = require('openai');
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});
const { extractJsonArray } = require('./utilities/functions');
const {
    generateJsonFormatterPrompt,
    generateImagePrompt,
    generateImageSelectionPrompt,
    generateCodeGenerationPrompt,
    generateComponentReviewPrompt,
    generateCodeOverviewPrompt,
} = require('./promptUtils');

class ProjectCoordinator {
    constructor(userId,projectId) {
        this.projectId = projectId;
        this.userId = userId;

        if (this.projectId) {
            this.sessionDocsPath = path.join(__dirname, 'sessionDocs');
            this.documentationFileName = path.join(
                this.sessionDocsPath,
                `documentation_${this.projectId}.txt`
            );
        }
    }

    async fetchImages() {
        const uri = process.env.MONGO_URI;
        if (!uri) {
            console.error(
                'MONGO_URI is not defined in the environment variables'
            );
            process.exit(1);
        }

        try {
            await mongoose.connect(uri);

            const images = await Image.find().lean();
            return images.map((image) => ({
                ...image,
                _id: image._id.toString(),
            }));
        } catch (err) {
            console.error(
                'Failed to connect to MongoDB or retrieve images',
                err
            );
        }
    }

    async logStep(message) {
        const timestamp = new Date().toISOString();
        const logMessage = `Step [${timestamp}]: ${message}\n`;

        if (this.projectId) {
            if (!fs.existsSync(this.sessionDocsPath)) {
                fs.mkdirSync(this.sessionDocsPath);
            }
            fs.appendFileSync(this.documentationFileName, logMessage);
        } else {
            console.log(logMessage);
        }
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

    async generateTaskList(analysisArray, userId) {
        if (analysisArray !== null) {
            const generateRandomId = (length) => {
                let result = '';
                const characters =
                    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
                const charactersLength = characters.length;
                for (let i = 0; i < length; i++) {
                    result += characters.charAt(
                        Math.floor(Math.random() * charactersLength)
                    );
                }
                return result;
            };

            let taskList = [];

            analysisArray.forEach((analysis) => {
                taskList.push({
                    ...analysis,
                    id: generateRandomId(5),
                });
            });

            await this.storeTasks(userId, taskList);

            await this.logStep(
                'Tasks have been created and stored for the project.'
            );
        }
    }

    async openaiApiCall(prompt, responseFormat = null) {
        try {
            const requestPayload = {
                model: 'gpt-4o',
                messages: [{ role: 'system', content: prompt }],
            };

            if (responseFormat) {
                requestPayload.response_format = responseFormat;
            }

            const response =
                await openai.chat.completions.create(requestPayload);
            const rawResponse = response.choices[0].message.content.trim();
            User.addTokenCountToUserSubscription(this.userId, rawResponse);
            return rawResponse;
        } catch (error) {
            console.error('Error in OpenAI API call:', error);
            return null;
        }
    }

    async JSONFormatter(rawJsonString, error) {
        const prompt = generateJsonFormatterPrompt(rawJsonString, error);
        User.addTokenCountToUserSubscription(this.userId, systemPrompt);
        const res = await this.openaiApiCall(prompt, { type: 'json_object' });

        try {
            let formattedJson = JSON.parse(res);
            return formattedJson;
        } catch (error) {
            console.error('Error parsing JSON Again:', error);
        }
    }

    async extractAndParseJson(rawJsonString) {
        try {
            const jsonArrayString = extractJsonArray(rawJsonString);
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

        const taskPromises = tasks.map((task) => {
            return new Promise((resolve, reject) => {
                try {
                    User.addTaskToProject(userId, this.projectId, task);
                    resolve();
                } catch (error) {
                    reject(error);
                }
            });
        });

        await Promise.all(taskPromises);
        console.log('All tasks stored successfully.');
    }

    listAssets = (userId) => {
        const workspace = path.join(__dirname, 'workspace');
        const appPath = path.join(workspace, this.projectId);
        const assetsDir = path.join(appPath, 'assets');

        if (!fs.existsSync(assetsDir)) {
            return [];
        }

        return fs.readdirSync(assetsDir);
    };

    async addImagesToFolder(data, projectOverView, projectId, appName) {
        try {
            const prompt = generateImagePrompt(data, projectOverView);
            User.addTokenCountToUserSubscription(this.userId, prompt);
            const res = await this.openaiApiCall(prompt, {
                type: 'json_object',
            });
            let arr = JSON.parse(res);
            const getImageResponse = await this.findFirstArray(arr);

            const dynamicName = appName;
            const workspaceDir = path.join(__dirname, 'workspace');
            const views = path.join(workspaceDir, projectId);
            const directory = path.join(views, 'assets');

            if (getImageResponse && getImageResponse.length > 0) {
                await this.generateAndDownloadImages(
                    getImageResponse,
                    directory
                );
            } else {
                console.log('No search prompts extracted from the response.');
            }
        } catch (error) {
            console.error('Error in OpenAI API call:', error);
        }
    }

    async generateAndDownloadImages(dataResponse, directory) {
        for (const { prompt, imageName } of dataResponse) {
            try {
                const imageUrl = await generateImageWithDallE(prompt);

                if (imageUrl) {
                    await downloadImage(imageUrl, directory, imageName);
                } else {
                    console.log(`No image URL returned for prompt: ${prompt}`);
                }
            } catch (error) {
                console.error(`Error processing prompt "${prompt}":`, error);
            }
        }
    }

    async imagePicker(conversationHistory, userId) {
        const imageArray = await this.fetchImages();
        const selectedProject = User.getUserProject(userId, this.projectId)[0];
        try {
            const prompt = generateImageSelectionPrompt(
                conversationHistory,
                imageArray
            );
            User.addTokenCountToUserSubscription(this.userId, prompt);
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
            }
            selectedProject.imageId = aiResponses[0].id;
            User.addProject(userId, selectedProject);
        } catch (error) {
            await this.logStep('Error in image selection:', error);
        }
    }

    async codeWriter(message, projectOverView, appName, userId) {
        const selectedProject = User.getUserProject(userId, this.projectId)[0];
        const imageArray = await this.fetchImages();
        let { imageId, taskList } = selectedProject;
        const selectedImage = imageId
            ? imageArray.find((image) => image._id === imageId)
            : null;
        const assets = this.listAssets(userId);

        try {
            const prompt = generateCodeGenerationPrompt(
                projectOverView,
                taskList,
                assets
            );
            User.addTokenCountToUserSubscription(this.userId, prompt);
            const response = await this.openaiApiCall(
                `User's requirements: ${message}\n${prompt}`
            );

            const codeBlockRegex = /```(?:\w+\n)?([\s\S]*?)```/g;
            const matches = response.match(codeBlockRegex);

            if (matches && matches.length > 0) {
                let code = matches[0].replace(/```(?:\w+\n)?|```/g, '').trim();
                return code;
            } else {
                await this.logStep('No code block found in response.');
                return '';
            }
        } catch (error) {
            await this.logStep('Error in code generation:', error);
            return '';
        }
    }

    async codeReviewer(projectOverView, userId, taskList) {
        const workspace = path.join(__dirname, 'workspace');
        const appPath = path.join(workspace, this.projectId);
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
            projectOverView,
            taskList,
            assets,
            conversationContext,
            modifications: [],
        };

        for (const task of taskList) {
            const componentFileName = `${task.name}.${task.extension}`;
            const componentFilePath = path.join(appPath, componentFileName);

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

            const prompt = generateComponentReviewPrompt(context);
            User.addTokenCountToUserSubscription(this.userId, prompt);
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
                    console.log(`Updated ${componentFileName} successfully.`);
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

    async codeAnalyzer(codeToAnalyze) {
        try {
            const mainPrompt = generateCodeOverviewPrompt(codeToAnalyze);
            User.addTokenCountToUserSubscription(this.userId, mainPrompt);
            const prompt = `${mainPrompt} \n\nCode to analyze:\n${JSON.stringify(codeToAnalyze, null, 2)}`;
            const aiResponse = await this.openaiApiCall(prompt);

            return aiResponse;
        } catch (error) {
            await this.logStep('Error in code analysis:', error);
            return '';
        }
    }
}

module.exports = ProjectCoordinator;
