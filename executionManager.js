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

// Class to manage the execution of tasks
class ExecutionManager {
    constructor(taskList, projectId) {
        this.projectCoordinator = new ProjectCoordinator(openai, projectId);
        this.taskList = taskList;
        this.projectId = projectId;
    }

    // Method to execute a list of tasks for a given project
    async executeTasks(appName, userId) {
        let count = 0;
        // Setting up the path for the application
        const workspaceDir = path.join(__dirname, 'workspace');
        const projectDir = path.join(workspaceDir, this.projectId);
        const views = path.join(projectDir, 'views');
        const appPath = path.join(views, appName);
        // Create the directory if it doesn't exist
        if (!fs.existsSync(appPath)) {
            fs.mkdirSync(appPath, { recursive: true });
        }

        // Filter out non-createHTML tasks and ensure extensionType is not empty
        const otherTasks = this.taskList.filter(
            (task) =>
                task.taskName !== 'createHTML' &&
                task.extensionType &&
                task.extensionType.trim() !== ''
        );

        // Execute other types of tasks
        for (const task of otherTasks) {
            // Check for duplicate tasks and skip them if found
            const isDuplicate = otherTasks.some(
                (otherTask) =>
                    otherTask !== task &&
                    otherTask.taskName === task.taskName &&
                    otherTask.fileName === task.fileName &&
                    otherTask.extensionType === task.extensionType
            );

            if (!isDuplicate) {
                await this.processTask(task, appName, appPath, userId);
                count++;
            } else {
                await this.projectCoordinator.logStep(
                    `Skipped processing duplicate task: ${task.fileName}.${task.extensionType}`
                );
            }
        }
    }

    // Process each task based on its type
    async processTask(task, appName, appPath, userId) {
        if (
            task.taskName === 'Create' ||
            task.taskName === 'Modify'
        ) {
            switch (task.taskName) {
                // Handle file creation tasks
                case 'Create':
                    await this.Create(task, appPath, appName, userId);
                    break;
                default:
                    await this.projectCoordinator.logStep(
                        `Unknown task type: ${task.taskName}`
                    );
            }
        } else {
            await this.projectCoordinator.logStep(
                `Skipping task due to missing required fields or type mismatch: ${task.fileName}`
            );
        }
    }

  
    // Handle the creation of files
    async Create(task, appPath, appName, userId) {
        // Skip if the task is already done
        if (task.status === 'done') {
            await this.logTaskDone();
            return;
        }

        // Ensure the 'src' directory exists
        const srcDir = this.ensureSrcDirectory(appPath);
        await this.projectCoordinator.logStep(
            `I am now creating a HTML file named ${task.fileName}...`
        );

        // Get the file path and prepare the file content
        const componentFilePath = this.getFilePath(srcDir, task);
        const fileContent = await this.prepareFileContent(
            task,
            appName,
            userId
        );

        // Write the file and handle its review
        await this.writeFile(componentFilePath, fileContent);
    }

    // Log a message when a task is already done or doesn't meet criteria
    async logTaskDone() {
        await this.projectCoordinator.logStep(
            `Task does not meet the criteria or is already done.`
        );
    }

    // Ensure the 'src' directory exists in the app path
    ensureSrcDirectory(appPath) {
        const srcDir = appPath;
        if (!fs.existsSync(srcDir)) {
            fs.mkdirSync(srcDir, { recursive: true });
        }
        return srcDir;
    }

    // Generate the file path for a task
    getFilePath(srcDir, task) {
        const fileName = `${task.fileName.replace(/\.[^.]*/, '')}.${
            task.extensionType
        }`;
        return path.join(srcDir, fileName);
    }

    // Prepare the content for a file based on the task description
    async prepareFileContent(task, appName, userId) {
        const projectOverView = globalState.getProjectOverView(userId);

        let taskDescription;

        taskDescription = `Please meticulously write and return the complete production ready code for the following HTML file task: ${JSON.stringify(
            task,
            null,
            2
        )}. Take ample time to ensure that every line of code is accurate, efficient, and aligns with best practices for production readiness. Pay special attention to the intricacies of 'linkedComponents' and 'toDo' elements, as they are crucial for your context and integration of the component. Your goal is to craft code that is not only executable but also optimally structured for maintainability and scalability. Remember, this code is vital for the project's success and you are the last line of defense in ensuring its quality and reliability. Let's ensure it meets the highest standards of a professional, production-grade application`;

        await this.projectCoordinator.logStep(
            `I am now writing the code for ${task.fileName}`
        );

        // Get the file content for the task
        const taskFileContent = await this.projectCoordinator.codeWriter(
            taskDescription,
            projectOverView,
            appName,
            userId
        );

        await this.projectCoordinator.logStep(
            `The code has been written for the HTML file ${task.fileName} in the project ${appName}`
        );

        const assets = this.projectCoordinator.listAssets(userId);
        const systemMessage = `You are an AI agent part of a node js autonomous system that creates HTML/Tailwind web pages from user prompts. Based on your understanding of the conversation history and the user's requirements.

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

        const assetsCheckPrompt = `You are an AI agent part of a node js autonomous system that creates HTML/Tailwind web pages from user prompts. Your role is to analyze and compare the things in the assets folder and analyze the import statements within the HTML code snippet.

     Assets Folder array: ${JSON.stringify(assets, null, 2)}

     The array contains a list of strings which are the names of image resources meant to be used within the whole HTML project including the following HTML code snippet.

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
            const secondAIResponse =
                await this.projectCoordinator.findFirstArray(arr);

            await this.projectCoordinator.addImagesToFolder(
                secondAIResponse,
                projectOverView,
                this.projectId,
                appName
            ); // calling image generation AI
        }

        // Process the file content for regular tasks or tasks that need rework
        const details =
            await this.projectCoordinator.codeAnalyzer(taskFileContent);
        task.componentCodeAnalysis = details;
        await this.projectCoordinator.storeTasks(userId, this.taskList);

        return taskFileContent;
    }

    // Write the file content and handle its review
    async writeFile(filePath, fileContent) {
        await fsPromises.writeFile(filePath, fileContent);

        // Check if the file exists after writing
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
