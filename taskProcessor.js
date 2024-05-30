require('dotenv').config();
const executeCommand = require('./executeCommand');
const fs = require('fs');
const path = require('path');
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
        const assetsDir = path.join(projectDir, dynamicName, 'src', 'assets');

        if (!fs.existsSync(assetsDir)) {
            throw new Error('Assets directory does not exist.');
        }

        return fs.readdirSync(assetsDir);
    }

    async executionManager(userId, task) {
        const { taskType, ...taskDetails } = task;

        switch (taskType) {
            case 'Modify':
                await this.handleModify(userId, taskDetails,task);
                break;
            case 'Install':
                await this.handleInstall(taskDetails,task);
                break;
            case 'Generate':
                await this.handleDownload(taskDetails,task);
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
                'React app started successfully.'
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
            const prompt = `You are an Ai agent part of a node js autonomous system that creates beautiful and elegant React web applications. Your task involves leveraging 'Task' details to directly generate images or media that are crucial for the project using DALL-E.

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
      
         Please return a well-structured JSON array of objects that contains the generated images.\n\nExample response format:\n[
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
      
      This method ensures your system dynamically generates specific image or media prompts for DALL-E, based on the unique requirements highlighted by the 'Task' details. Return in json fomart
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
            const projectDir = path.join(workspaceDir, projectId);

            const createDirectory = (dynamicName) => {
                const dirPath = path.join(
                    projectDir,
                    dynamicName,
                    'src',
                    'assets'
                );
                return dirPath;
            };

            const directory = createDirectory(dynamicName);

            if (getImageResponse && getImageResponse.length > 0) {
                await generateAndDownloadImages(getImageResponse, directory);
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
            const srcDir = path.join(this.appPath, 'src');
            const file = `${fileName.replace(/\.[^.]*/, '')}.${extensionType}`;
            const filePath = path.join(srcDir, file);
            const fileContent = await fsPromises.readFile(filePath, 'utf8');
            const moreContext = `Given the existing file content and the modification instruction, please generate the complete and updated code for the file content. Start by reviewing the current content of the file as follows:

            Existing File Content:  ${JSON.stringify(fileContent, null, 2)}

            Modification Task Details : ${JSON.stringify(taskDetails, null, 2)}
            
            Now, carefully consider the modification instruction: ${promptToCodeWriterAi}
            
            Take your time to integrate this modification instruction with the existing code. Ensure that the final output is a fully functional and complete version of the file, reflecting the requested changes without any placeholders or omissions. The result should be ready-to-use code that directly implements the required modifications in a coherent and efficient manner.
            
            Return the full, complete, and updated code for the file content.
            `;
            

            const modifiedFileContent =
                await this.projectCoordinator.codeWriter(
                    moreContext,
                    this.taskList,
                    this.projectOverView,
                    this.appName,
                    userId
                );
            if (
                modifiedFileContent &&
                typeof modifiedFileContent === 'string'
            ) {
                fs.writeFileSync(filePath, modifiedFileContent, 'utf8');
                await this.projectCoordinator.logStep(
                    `File ${fileName}.js modified successfully.`
                );
                const updatedTaskDetails = {
                    ...taskDetails,
                    taskName: 'Modify',
                };
                await this.projectCoordinator.storeTasks(
                    userId,
                    updatedTaskDetails
                );
     
           
            } else {
                await this.projectCoordinator.logStep(
                    `Failed to modify file ${fileName}.js due to invalid content.`
                );
            }
        } catch (error) {
            console.error(`Error in modifying file ${fileName}.js:`, error);
        }

        try {
            await this.projectCoordinator.logStep(
                'React app started successfully.'
            );
        } catch (error) {
            await this.projectCoordinator.logStep('Issues resolved');
        }
    }
}

module.exports = { TaskProcessor };
