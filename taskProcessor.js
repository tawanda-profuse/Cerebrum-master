require('dotenv').config();
const executeCommand = require('./executeCommand');
const path = require('path');
const fs = require('fs');
const fsPromises = fs.promises;
const OpenAI = require('openai');
const { generateImageWithDallE, downloadImage } = require('./imageGeneration');
const ProjectCoordinator = require('./projectCoordinator');

class TaskProcessor {
    constructor(
        appPath,
        appName,
        projectOverView,
        projectId,
        taskList,
        selectedProject
    ) {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
        this.selectedProject = selectedProject;
        this.projectId = projectId;
        this.projectCoordinator = new ProjectCoordinator(
            this.openai,
            this.projectId
        );
        this.appPath = appPath;
        this.appName = appName;
        this.projectOverView = projectOverView;
        this.taskList = taskList;
    }

    async processTasks(userId, task) {
        try {
            if (
                task.taskType === 'Modify' ||
                task.taskType === 'Install' ||
                task.taskType === 'Generate'
            ) {
                await this.executionManager(userId, task);
            }
        } catch (error) {
            console.error('Error processing tasks:', error);
            // Handle or log the error appropriately
        }
    }

    async listAssets() {
        const dynamicName = this.appName;
        const workspaceDir = path.join(__dirname, 'workspace');
        const projectDir = path.join(workspaceDir, this.projectId);
        const views = path.join(projectDir, 'views');
        const assetsDir = path.join(views, dynamicName, 'assets');

        if (!fs.existsSync(assetsDir)) {
            throw new Error('Assets directory does not exist.');
        }

        return fs.readdirSync(assetsDir);
    }

    async executionManager(userId, task) {
        const { taskType, ...taskDetails } = task;

        switch (taskType) {
            case 'Modify':
                await this.handleModify(userId, taskDetails);
                break;
            case 'Install':
                await this.handleInstall(taskDetails);
                break;
            case 'Generate':
                await this.handleDownload(taskDetails);
            default:
                console.error('Unknown task type:', taskType);
                break;
        }
    }

    async handleInstall(taskDetails) {
        const { fileName } = taskDetails;

        try {
            await this.projectCoordinator.logStep(
                `I am installing library: ${fileName}`
            );
            await executeCommand(`npm install ${fileName}`, this.appPath);
            await this.projectCoordinator.logStep(
                `${fileName} library installed.`
            );
        } catch (error) {
            console.error(`Error installing library ${fileName}:`, error);
        }

        try {
            await this.projectCoordinator.logStep(
                'HTML started successfully.'
            );
        } catch (error) {
            await this.projectCoordinator.logStep('Issues resolved');
        }
    }

    async findFirstArray(data) {
        if (Array.isArray(data)) {
            return data;
        }

        // If data is an object, find the first array property
        if (typeof data === 'object' && data !== null) {
            const firstArray = Object.values(data).find((value) =>
                Array.isArray(value)
            );
            if (firstArray) {
                return firstArray;
            }
        }

        // If no array is found, return the data wrapped in an array
        return [data];
    }

    async handleDownload(taskDetails) {
        const assets = await this.listAssets();
        try {
            const prompt = `You are an Ai agent part of a node js autonomous system that creates beautiful and elegant HTML web applications. Your task involves leveraging 'Task' details to directly generate images or media that are crucial for the project using DALL-E.

      Task: ${JSON.stringify(taskDetails, null, 2)},
      These are all the current images, icons, or static files in the project's assets folder for reference: ${JSON.stringify(
          assets,
          null,
          2
      )}
      Your responsibility is to analyze the 'Task' details thoroughly to pinpoint specific requirements for images or media that would elevate the application's UI/UX. Following this analysis, you will create an array of objects. Each object in this array will serve as a unique DALL-E prompt to generate a single, precise image or media piece tailored to the project's needs. The process should be as follows:
      
      1. Review the 'Task' details to identify the exact number and types of images or media required.
      2. For each image or media piece needed, create an object in the array that outlines:
         a. A detailed DALL-E prompt for generating a single item. This prompt must clearly define the type of image or media needed, its specific role within various UI components, the ideal dimensions for seamless integration into these components, and adaptability considerations for various screen sizes and device types.
         b. A recommended filename for the item, which should be short, meaningful, and adhere to standard naming conventions.
      
         The output should always be a JSON array of objects, even if only one image is needed. Each object in the array must contain:
          - A 'prompt' field with a non-empty string describing the image generation prompt.
          - An 'imageName' field with a non-empty string providing the suggested filename for the image.
          
          ALWAYS RETURN A JSON OBJECT WITH THOSE TWO PROPERTIES LIKE THE EXAMPLE BELOW:
          [
            {
              "imageName": "logo.png",
              "prompt":"A logo of the application, featuring a minimalistic design with a blue and white color scheme. Dimensions: 200x200 pixels."
            },
            {
              "imageName": "banner.png",
              "prompt": "A banner image for promotional sections, with a vibrant mix of colors and abstract shapes. Dimensions: 1200x300 pixels."
            }
          ]
          
          Important: 
          1. If there is a need for only one import image, return it as an object in an array. If there is a need for more than one import image, return the corresponding number of objects in the array.
          2. Use your understanding of the image relative to the project to suggest dimensions that will not cause misalignment within the application.
          Ensure that both 'prompt' and 'imageName' fields are always present and non-empty. This structured approach ensures that we can dynamically generate specific image prompts for DALL-E, tailored to the precise requirements of the project based on the 'Data' object or 'Conversation History'.
          
          NEVER return just an object like this => {
            prompt: "Generate a high-resolution image of a beautiful curly afro wig that gives a natural look. The wig should be displayed on a mannequin head with a neutral background. The image should be 800x800 pixels to fit perfectly within product catalog components and adaptable to different screen sizes and device types.",
            imageName: "curly_afro_wig.jpg"
          }. it should alsways be an array.
      
      This method ensures your system dynamically generates specific image or media prompts for DALL-E, based on the unique requirements highlighted by the 'Task' details. Return in json fomart

      *TAKE YOUR TIME AND ALSO MENTALLY THINK THROUGH THIS STEP BY STEP TO PROVIDE THE MOST ACCURATE AND EFFECTIVE RESULT*
      `;
            const response = await this.openai.chat.completions.create({
                model: 'gpt-4o',
                response_format: { type: 'json_object' },
                temperature: 0,
                messages: [
                    {
                        role: 'system',
                        content: prompt,
                    },
                ],
            });

            const res = response.choices[0].message.content;
            let arr = JSON.parse(res);
            const getImageResponse = await this.findFirstArray(arr);

            const dynamicName = this.appName;
            const workspaceDir = path.join(__dirname, 'workspace');
            const projectDir = path.join(workspaceDir, this.projectId);
            const views = path.join(projectDir, 'views');

            const createDirectory = (dynamicName) => {
                const dirPath = path.join(
                    views,
                    dynamicName,
                    'assets'
                );
                return dirPath;
            };

            const directory = createDirectory(dynamicName);

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
            throw error;
        }
    }

    async generateAndDownloadImages(extractedArray, directory) {
        for (const { prompt, imageName } of extractedArray) {
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

    async handleModify(userId, taskDetails) {
        const { fileName, promptToCodeWriterAi, extensionType } = taskDetails;
    
        try {
            const srcDir = path.join(this.appPath);
            const file = `${fileName.replace(/\.[^.]*/, '')}.${extensionType}`;
            console.log('file', file);
            const filePath = path.join(srcDir, file);
            const fileContent = await fsPromises.readFile(filePath, 'utf8');
            const moreContext = `
            Your task is to modify the given HTML file based on the provided modification instructions. Ensure the updated code is complete, functional, and ready to use.
    
            Focus Areas:
            - Project Overview
            - Task List
            - Assets folder contents
    
            Details:
            - Modification Task: ${JSON.stringify(taskDetails, null, 2)}
            - Existing File Content: ${JSON.stringify(fileContent, null, 2)}
            - Modification Instructions: ${promptToCodeWriterAi}
    
            Carefully integrate the instructions with the existing code. The final output should fully implement the requested changes without placeholders or omissions.
    
            Return the complete, updated code for the file.
    
            *TAKE YOUR TIME AND ALSO MENTALLY THINK THROUGH THIS STEP BY STEP TO PROVIDE THE MOST ACCURATE AND EFFECTIVE RESULT*
            `;
    
            const modifiedFileContent =
                await this.projectCoordinator.codeWriter(
                    moreContext,
                    this.projectOverView,
                    this.appName,
                    userId
                );
            if (modifiedFileContent && typeof modifiedFileContent === 'string') {
                console.log('modifying', filePath);
                fs.writeFileSync(filePath, modifiedFileContent, 'utf8');
                await this.projectCoordinator.logStep(
                    `File ${fileName} modified successfully.`
                );
                const updatedTaskDetails = {
                    ...taskDetails,
                    taskName: 'Modified File',
                };
                await this.projectCoordinator.storeTasks(
                    userId,
                    updatedTaskDetails
                );
            } else {
                await this.projectCoordinator.logStep(
                    `Failed to modify file ${fileName} due to invalid content.`
                );
            }
        } catch (error) {
            console.error(`Error in modifying file ${fileName}:`, error);
        }
    
        try {
            await this.projectCoordinator.logStep('HTML modification completed successfully.');
        } catch (error) {
            await this.projectCoordinator.logStep('Issues resolved');
        }
    }
    
}

module.exports = { TaskProcessor };
