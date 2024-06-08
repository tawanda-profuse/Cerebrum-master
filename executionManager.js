// Importing necessary modules and initializing OpenAI with the API key from .env file
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const OpenAI = require('openai');
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});
const globalState = require('./globalState');
const fsPromises = fs.promises;
const ProjectCoordinator = require('./projectCoordinator');

class ExecutionManager {
    constructor(taskList, projectId) {
        this.projectCoordinator = new ProjectCoordinator(openai, projectId);
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

        console.log(`Starting task execution for project: ${this.projectId}`);

        for (const task of this.taskList) {
            if (this.executedTasks.has(task.name)) {
                console.log(`Skipping already executed task: ${task.name}`);
                continue;
            }

            console.log(`Processing task: ${task.name}`);
            await this.processTask(task, appName, appPath, userId);
            this.executedTasks.add(task.name);
            console.log(`Finished processing task: ${task.name}`);
        }

        console.log(`Completed all tasks for project: ${this.projectId}`);
    }

    async processTask(task, appName, appPath, userId) {
        await this.Create(task, appPath, appName, userId);
    }

    async Create(task, appPath, appName, userId) {
        const srcDir = this.ensureSrcDirectory(appPath);
        await this.projectCoordinator.logStep(
            `I am now creating a HTML file named ${task.name}...`
        );

        const componentFilePath = this.getFilePath(srcDir, task);
        const fileContent = await this.prepareFileContent(task, appName, userId);

        await this.writeFile(componentFilePath, fileContent);
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

    async prepareFileContent(task, appName, userId) {
        const projectOverView = globalState.getProjectOverView(userId);
        let taskFileContent = task.content;

        await this.projectCoordinator.logStep(
            `The code has been written for the HTML file ${task.name} in the project ${appName}`
        );

        const assets = this.projectCoordinator.listAssets(userId);
        const systemMessage = `You are an AI agent part of a node js autonomous system that creates tailwind HTML  web pages  from user prompts. Based on your understanding of the conversation history and the user's requirements.

        Your role is to return a well-structured JSON array of objects that contains images which need to be generated
        
        Task: Generate the relevant images needed for the HTML project. These images should be based on the import statements in the code snippet below\n\n${taskFileContent}\n\nEncapsulate the content in a JSON object with appropriate fields.\n\nProject Overview: ${JSON.stringify(projectOverView)}\n\nPlease return a well-structured JSON array of objects that contains the generated images.\n\nExample response format:\n[
          {
            "image": "logo.png",
            "description":"A logo of the application, featuring a minimalistic design with a blue and white color scheme. Dimensions: 200x200 pixels."
          },
          {
            "image": "banner.png",
            "description": "A banner image for promotional sections, with a vibrant mix of colors and abstract shapes. Dimensions: 1200x300 pixels."
          }
        ]
        
        Important: 
        1. If there is a need for only one import image, return it as an object in an array. If there is a need for more than one import image, return the corresponding number of objects in the array.
        2. Use your understanding of the image relative to the project to suggest dimensions that will not cause misalignment within the application.

        *TAKE YOUR TIME AND ALSO MENTALLY THINK THROUGH THIS STEP BY STEP TO PROVIDE THE MOST ACCURATE AND EFFECTIVE RESULT*
        `;

        const assetsCheckPrompt = `You are an AI agent part of a node js autonomous system that creates tailwind HTML web pages from user prompts. Your role is to analyze and compare the things in the assets folder and analyze the import statements within the HTML code snippet.

     Assets Folder array: ${JSON.stringify(assets, null, 2)}

     The array contains a list of strings which are the names of image resources meant to be used within the whole HTML project including the following  code snippet.

     HTML code:${taskFileContent}

     Analyze the import statements within the HTML code. If there are any image imports not in the assets array, return a JSON object [{ "answer": true }]. If all the image imports are in the assets array, return a JSON object [{ "answer": false }].
     
     *TAKE YOUR TIME AND ALSO MENTALLY THINK THROUGH THIS STEP BY STEP TO PROVIDE THE MOST ACCURATE AND EFFECTIVE RESULT*
     `;

        const analyzeImportsResponse = await openai.chat.completions.create({
            model: 'gpt-4o',
            response_format: { type: 'json_object' },
            temperature: 0,
            messages: [
                {
                    role: 'system',
                    content: assetsCheckPrompt,
                },
            ],
        });

        const res = analyzeImportsResponse.choices[0].message.content.trim();
        let arr = JSON.parse(res);
        const jsonArray = await this.projectCoordinator.findFirstArray(arr);

        if (jsonArray[0].answer) {
            const messages = [{ role: 'system', content: systemMessage }];
            const aIResponseObject = await openai.chat.completions.create({
                model: 'gpt-4o',
                messages: messages,
                response_format: { type: 'json_object' },
                temperature: 0,
            });

            let arr = JSON.parse(aIResponseObject.choices[0].message.content);
            const secondAIResponse = await this.projectCoordinator.findFirstArray(arr);

            await this.projectCoordinator.addImagesToFolder(
                secondAIResponse,
                projectOverView,
                this.projectId,
                appName
            ); // calling image generation AI
        }

        // Process the file content for regular tasks or tasks that need rework
        const details = await this.projectCoordinator.codeAnalyzer(taskFileContent);
        task.content = details;
        await this.projectCoordinator.storeTasks(userId, this.taskList);

        return taskFileContent;
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
            throw new Error('File creation failed');
        }
    }
}

// Exporting the ExecutionManager class
module.exports = ExecutionManager;
