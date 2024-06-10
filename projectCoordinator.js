require('dotenv').config();
const mongoose = require('mongoose');
const Image = require('./models/Image.schema');
const path = require('path');
const fs = require('fs');
const fsPromises = require('fs').promises;
const { generateImageWithDallE, downloadImage } = require('./imageGeneration');
const User = require('./User.schema');

class ProjectCoordinator {
    constructor(openaiInstance, projectId = null) {
        this.openai = openaiInstance;
        this.projectId = projectId;

        if (this.projectId) {
            this.sessionDocsPath = path.join(__dirname, 'sessionDocs');
            this.documentationFileName = path.join(
                this.sessionDocsPath,
                `documentation_${this.projectId}.txt`
            );
        }
    }

    async fetchImages() {
        // Connect to MongoDB
        const uri = process.env.MONGO_URI;
        if (!uri) {
            console.error(
                'MONGO_URI is not defined in the environment variables'
            );
            process.exit(1);
        }

        try {
            await mongoose.connect(uri);

            // Retrieve image documents
            const images = await Image.find().lean(); // Use lean() to get plain JavaScript objects
            return images;
        } catch (err) {
            console.error(
                'Failed to connect to MongoDB or retrieve images',
                err
            );
            throw err;
        }
    }

    async logStep(message) {
        const timestamp = new Date().toISOString();
        const logMessage = `Step [${timestamp}]: ${message}\n`;

        if (this.projectId) {
            // Ensure the directory exists
            if (!fs.existsSync(this.sessionDocsPath)) {
                fs.mkdirSync(this.sessionDocsPath);
            }
            // User.addMessage(userId, [
            //   projectId,
            //   {
            //     role: "assistant",
            //     content: logMessage,
            //   }

            // ]);
            fs.appendFileSync(this.documentationFileName, logMessage);
        } else {
            // Handle logging when projectId is not available
            console.log(logMessage); // Or other default logging behavior
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

    // Parses the AI's analysis to generate a task list
    async generateTaskList(analysisArray, userId) {
        if (analysisArray !== null) {
            function generateRandomId(length) {
                let result = '';
                let characters =
                    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
                let charactersLength = characters.length;
                for (let i = 0; i < length; i++) {
                    result += characters.charAt(
                        Math.floor(Math.random() * charactersLength)
                    );
                }
                return result;
            }

            let taskList = [];

            // Add random IDs to all tasks in the analysisArray and filter them
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

    async extractAndParseJson(rawJsonString) {
        try {
            // Step 1: Find the start of the JSON array
            const startIndex = rawJsonString.indexOf('[');
            const endIndex = rawJsonString.lastIndexOf(']') + 1;
    
            // Ensure that we found a valid JSON array
            if (startIndex === -1 || endIndex === -1) {
                throw new Error('No JSON array found in the response.');
            }
    
            // Step 2: Extract the JSON array string
            let jsonArrayString = rawJsonString.substring(startIndex, endIndex);
    
            // Step 3: Clean up any prefixes like '[0]' within the JSON array string
            jsonArrayString = jsonArrayString.replace(/^\[0\] /gm, '');
    
            // Step 4: Handle escaped characters by unescaping double quotes
            jsonArrayString = jsonArrayString.replace(/\\"/g, '"');
    
            // Step 5: Parse the JSON string into a JavaScript array
            const parsedArray = JSON.parse(jsonArrayString);
    
            return parsedArray;
        } catch (error) {
            console.error('Error parsing JSON:', error.message);
            return null;
        }
    }

    // Stores tasks in a local file organized by project name
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
        console.log('All tasks stored successfully.'); // Debug statement to confirm storage
    }

    listAssets = (userId) => {
        const workspace = path.join(__dirname, 'workspace');
        const appPath = path.join(workspace, this.projectId);
        const assetsDir = path.join(appPath, 'assets');

        if (!fs.existsSync(assetsDir)) {
            return
        }

        return fs.readdirSync(assetsDir);
    };

    async addImagesToFolder(data, projectOverView, projectId, appName) {
        try {
            const prompt = `
          You are an Ai agent part of a node js autonomous system that creates beautiful and elegant HTML web applications. Your role involves using 'Data' and 'Conversation History' to generate essential images for the project using DALL-E.
          
          Data: ${JSON.stringify(data, null, 2)},
          Project OverView: ${JSON.stringify(projectOverView)}
          
          Your task is as follows:
          
          1. If the 'Data' object is not null, identify the specific image requirements that will enhance the application's UI/UX based on this data.
          2. If the 'Data' object is null, analyze the 'Conversation History' to determine if any images are needed based on user discussions and requirements.
          3. For each required image, construct an object within an array that includes:
             a. A detailed DALL-E prompt for generating a single image. This prompt should specify the type of image needed, its purpose within the UI components, ideal dimensions for a perfect fit, and adaptability for various screen sizes and device types.
             b. A suggested filename for the image, which should be succinct, descriptive, and follow standard file naming conventions.
          4. Use your understanding of the image relative to the project to suggest dimensions that will not cause misalignment within the application.
          
          The output should always be a JSON array of objects, even if only one image is needed. Each object in the array must contain:
          - A 'prompt' field with a non-empty string describing the image generation prompt.
          - An 'imageName' field with a non-empty string providing the suggested filename for the image.
          
          ALWAYS RETURN A JSON OBJECT WITH THOSE TWO PROPERTIES LIKE THE EXAMPLE BELOW:
          
          [
            {
              "prompt": "Generate a high-resolution image of a beautiful curly afro wig that gives a natural look. The wig should be displayed on a mannequin head with a neutral background. The image should be 800x800 pixels to fit perfectly within product catalog components and adaptable to different screen sizes and device types.",
              "imageName": "curly_afro_wig.jpg"
            }
          ]
          
          Ensure that both 'prompt' and 'imageName' fields are always present and non-empty. This structured approach ensures that we can dynamically generate specific image prompts for DALL-E, tailored to the precise requirements of the project based on the 'Data' object or 'Conversation History'.
          
          NEVER return just an object like this => {
            prompt: "Generate a high-resolution image of a beautiful curly afro wig that gives a natural look. The wig should be displayed on a mannequin head with a neutral background. The image should be 800x800 pixels to fit perfectly within product catalog components and adaptable to different screen sizes and device types.",
            imageName: "curly_afro_wig.jpg"
          }. it should alsways be an array.

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

            const dynamicName = appName;
            const workspaceDir = path.join(__dirname, 'workspace');
            const views = path.join(workspaceDir, projectId);

            const createDirectory = (dynamicName) => {
                const dirPath = path.join(views, 'assets');
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

        async function generateAndDownloadImages(dataResponse, directory) {
            for (const { prompt, imageName } of dataResponse) {
                try {
                    const imageUrl = await generateImageWithDallE(prompt);

                    if (imageUrl) {
                        await downloadImage(imageUrl, directory, imageName);
                    } else {
                        console.log(
                            `No image URL returned for prompt: ${prompt}`
                        );
                    }
                } catch (error) {
                    console.error(
                        `Error processing prompt "${prompt}":`,
                        error
                    );
                }
            }
        }
    }

    async imagePicker(conversationHistory, userId) {
        const imageArray = await this.fetchImages();
        const selectedProject = User.getUserProject(userId, this.projectId)[0];
        try {
            const prompt = `
        Conversation History: ${conversationHistory}

        Curated list of images: ${JSON.stringify(imageArray, null, 2)}

        You are an AI agent, part of a Node.js autonomous system that creates beautiful and elegant HTML web applications from user prompts. Your role is to analyze the conversation history thoroughly to understand the user's requirements and preferences for the web application.

        Instructions:
        1. Review Conversation History: Carefully review the entire conversation history to extract key details about the user's needs, including desired layout, features, styles, and any specific elements mentioned.
        2. Compare with Curated List: Compare these requirements with the curated list of images in the imageArray. Each image is a sketch of a potential website layout accompanied by a detailed description.
        3. Select the Best Match: Select the single most relevant sketch that closely matches the user's specifications based on layout, features, and style.
        4. Provide JSON Object: Provide a JSON object with the id of the selected image.
        Note:
        Ensure that the selected sketch aligns as closely as possible with the user's stated requirements.
        Return only the id of the object that best fits the user's needs from the curated list of images.
        If the requirements do not match any object in the list, return a JSON object with "id": null.

        Example list of images :
        [
            {
            id: 1xchhr6,
            classification: 'example_classification_1',
            description: 'This is the first example description'
            },
            {
            id: 2fkfkkg889,
            classification: 'example_classification_2',
            description: 'This is the second example description'
            }
        ]
        
        If image falls under example_classification_2 then Example Response:
        [{
            "id": "2fkfkkg889"
        }]

        If the requirements are not within or closely related to any object in the list:
        [{
            "id": null
        }]

        
       *TAKE YOUR TIME AND ALSO MENTALLY THINK THROUGH THIS STEP BY STEP TO PROVIDE THE MOST ACCURATE AND EFFECTIVE RESULT*
        `;

            const response = await this.openai.chat.completions.create({
                model: 'gpt-3.5-turbo-0125',
                response_format: { type: 'json_object' },
                temperature: 0,
                messages: [
                    {
                        role: 'system',
                        content: prompt,
                    },
                ],
            });

            const res = response.choices[0].message.content.trim();
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
            await this.logStep('Error in code analysis:', error);
            return '';
        }
    }

    async codeWriter(message, projectOverView, appName, userId) {
        const selectedProject = User.getUserProject(userId, this.projectId)[0];
        const imageArray = await this.fetchImages();
        let { imageId, taskList } = selectedProject;
        const selectedImage = imageId
            ? imageArray.find((image) => image.id === imageId)
            : null;

        const assets = this.listAssets(userId);

        const systemPrompt = `
            You are an AI agent, part of a Node.js autonomous system that creates beautiful and elegant HTML on Tailwind web pages from user prompts.Your role is to write the HTML with Tailwind CSS code, following the Key Instructions, and return fully complete, production-ready code.
    
           Project Overview: ${projectOverView}
           Task List: ${JSON.stringify(taskList, null, 2)}
           These are all the current images, icons, or static files in the project's assets folder for reference: ${JSON.stringify(assets, null, 2)}
    
           Key Instructions:
    
           1. **Analyze Thoroughly:** Before coding, carefully analyze the task and project overview to determine the most efficient and effective approach. Approach each coding task methodically.
            
           2. **Contextual Memory:** Maintain a contextual memory of all interactions, tasks provided, and discussions held. Use this information to build upon previous tasks, ensuring a cohesive and continuous development process.
    
           3. **Take your time:** Always take your time and aim to avoid any mistakes.
           
           4. **Styling with Tailwind CSS:** Apply Tailwind CSS for all styling. Ensure the interface is responsive and visually aligns with the overall application design.
    
           5. **Task Analysis:** Carefully examine the  properties within the task list for each task. Ensure your code integrates seamlessly with established functionalities and design patterns, avoiding potential conflicts or redundancies.
    
           6. **Return Code Only:** Your response should only include the code block. Do not add any other text or comments in the response.
    
           7. **Image Handling:** Reference images from the './assets' folder. Do not import or create code to import images not found in this assets folder. If a specified image is not found, do not include any image imports for that task.
    
           8. **Robust Image Importing:** For components requiring images, implement a robust method to include images linked to data, for example:
    
           <img src="./assets/img.jpg" alt="Description of image">
    
           9. Unless specifically instructed to call an endpoint, do not attempt to make any network or API calls.

            
    
        const mockData = [
         {
         ...,
         image: "img.jpg"
         }
        ];
    
        return (\`
            <img src="./assets/\${mockData[0].image}" alt="Description of image" />
        \`);
    
         *TAKE YOUR TIME AND ALSO MENTALLY THINK THROUGH THIS STEP BY STEP TO PROVIDE THE MOST ACCURATE AND EFFECTIVE RESULT*
        `;

        try {
            // Preparing the context for the AI
            let aiContext;

            if (selectedImage) {
                aiContext = [
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'text',
                                text: `${systemPrompt}\n\n${message}`,
                            },
                            {
                                type: 'image_url',
                                image_url: {
                                    url: `${selectedImage.url}`,
                                },
                            },
                        ],
                    },
                ];
            } else {
                aiContext = [
                    {
                        role: 'system',
                        content: systemPrompt,
                    },
                    {
                        role: 'user',
                        content: message,
                    },
                ];
            }

            const response = await this.openai.chat.completions.create({
                model: 'gpt-4o',
                messages: aiContext,
                temperature: 0,
            });
            const aiResponse = response.choices[0].message.content;

            const codeBlockRegex = /```(?:\w+\n)?([\s\S]*?)```/g;
            const matches = aiResponse.match(codeBlockRegex);

            if (matches && matches.length > 0) {
                let code = matches[0].replace(/```(?:\w+\n)?|```/g, '').trim();
                return code;
            } else {
                await this.logStep('No code block found in response.');
                return '';
            }
        } catch (error) {
            await this.logStep('Error sending message to OpenAI:', error);
            return '';
        }
    }

    async codeReviewer(projectOverView, userId) {
        const workspace = path.join(__dirname, 'workspace');
        const appPath = path.join(workspace, this.projectId);
        const selectedProject = User.getUserProject(userId, this.projectId)[0];
        const imageArray = await this.fetchImages();
        let { imageId, taskList } = selectedProject;
        const selectedImage = imageId
            ? imageArray.find((image) => image.id === imageId)
            : null;

        const listAssets = () => {
            const assetsDir = path.join(appPath, 'assets');

            if (!fs.existsSync(assetsDir)) {
                throw new Error('Assets directory does not exist.');
            }

            return fs.readdirSync(assetsDir);
        };

        const assets = listAssets();
        let context = {
            projectOverView,
            taskList,
            assets,
            modifications: [],
        };

        for (const task of taskList) {
            const componentFileName = `${task.name}.${task.extension}`;
            const componentFilePath = path.join(appPath, componentFileName);

            let componentCodeAnalysis;
            try {
                componentCodeAnalysis = await fsPromises.readFile(
                    componentFilePath,
                    'utf8'
                );
            } catch (readError) {
                console.error(
                    `Error reading the component file ${componentFileName}:`,
                    readError
                );
                componentCodeAnalysis = `Error reading component file ${componentFileName}`;
            }

            context.currentComponent = {
                fileName: componentFileName,
                code: componentCodeAnalysis,
            };

            const userPrompt = `
                Project Overview: ${context.projectOverView}
                Task List: ${JSON.stringify(context.taskList, null, 2)}
                Contents in the assets folder: ${JSON.stringify(context.assets, null, 2)}
                Previous Modifications: ${JSON.stringify(context.modifications, null, 2)}
                
                You are an AI agent, part of a Node.js autonomous system, tasked with creating beautiful and elegant HTML on Tailwind web pages from user prompts. The image/s if provided serves as a template or visual guide, to give you a concrete reference of the user's vision and design preferences. It ensures that the resulting application aligns closely with the user's expectations. Your role is to meticulously review the provided HTML and Tailwind CSS code, taking context from the given task list, specifically the toDo and componentCodeAnalysis properties, the project overview, and the assets folder. Your objective is to ensure that each component's code is error-free, fully functional with no placeholders, properly integrated with other components, and matches the described functionality.
                
                For each component in the task list:
                1. **Analyze the toDo Property:** Understand the purpose and functionality required for the component.
                2. **Analyze the componentCodeAnalysis Property:** Review the detailed analysis to understand the key elements, functions, and any critical information for development.
                3. **Check for Proper HTML Structure:** 
                   - Ensure the HTML Structure is semantic and well-formed.
                   - Remove any unnecessary elements.
                4. **Ensure Code Functionality:** 
                   - Confirm the code performs the required tasks.
                   - Ensure it handles user interactions appropriately.
                   - Check that it displays the expected UI elements.
                5. **Check for Context Integration:** 
                   - Verify that the component works seamlessly with other components as per the given context.
                6. **Verify Asset Imports:** 
                   - Ensure that all image or static file imports correspond to actual files in the assets folder.
                   - Remove any imports that refer to non-existent files to prevent errors.
                7. **Return a Single JSON Object:** 
                   - If the code is correct, return a JSON object with the component filename and newCode as null.
                   - If the code needs adjustments, provide the updated code in the newCode field.
    
                8. **Data-testid for Testing:** Ensure all testable elements have a data-testid attribute to facilitate automated testing with Playwright.
    
                Take your time and use a chain-of-thought approach to ensure your review is comprehensive and nothing is missed. Consider every aspect of the component code, including structure, styling, and integration with other components, assets, or files.
                
                Example responses:
                1. Component with no problem => [
                    {
                      "component": "Home.html",
                      "newCode": null
                    }
                  ]
                2. Component with problem => [
                    {
                      "component": "Food.html",
                      "newCode": "<!DOCTYPE html>
                      <html lang='en'>
                      <head>
                        <meta charset='UTF-8'>
                        <meta name='viewport' content='width=device-width, initial-scale=1.0'>
                        <link href='https://cdn.jsdelivr.net/npm/tailwindcss@2.0.1/dist/tailwind.min.css' rel='stylesheet'>
                        <title>Food Component</title>
                      </head>
                      <body>
                        <div class='absolute bg-green-500' style='width: 20px; height: 20px; left: 20px; top: 20px;'></div>
                      </body>
                      </html>"
                    }
                  ]
                
                The component: ${context.currentComponent.fileName}
                The component code: ${JSON.stringify(context.currentComponent.code, null, 2)}
                
                Make sure the HTML on Tailwind project works as expected. Fix any issues found in the component code, ensuring that it is well-written, functional, and adheres to the specified requirements.
        
                *TAKE YOUR TIME AND ALSO MENTALLY THINK THROUGH THIS STEP BY STEP TO PROVIDE THE MOST ACCURATE AND EFFECTIVE RESULT*
            `;

            let response;
            if (selectedImage) {
                response = await this.openai.chat.completions.create({
                    model: 'gpt-4o',
                    response_format: { type: 'json_object' },
                    temperature: 0,
                    messages: [
                        {
                            role: 'user',
                            content: [
                                { type: 'text', text: userPrompt },
                                {
                                    type: 'image_url',
                                    image_url: {
                                        url: `${selectedImage.url}`,
                                    },
                                },
                            ],
                        },
                    ],
                });
            } else {
                response = await this.openai.chat.completions.create({
                    model: 'gpt-4o',
                    response_format: { type: 'json_object' },
                    temperature: 0,
                    messages: [
                        {
                            role: 'system',
                            content: userPrompt,
                        },
                    ],
                });
            }

            const res = response.choices[0].message.content.trim();
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
                    continue;
                }

                const newCode = aiResponse.newCode;

                try {
                    await fsPromises.writeFile(
                        componentFilePath,
                        newCode,
                        'utf8'
                    );
                    console.log(`Updated ${componentFileName} successfully.`);
                    context.modifications.push({
                        component: aiResponse.component,
                        newCode,
                    });
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
            const prompt = `
            You are an AI agent, part of a Node.js autonomous system that creates beautiful and elegant HTML on Tailwind web pages from user prompts. Your role is to analyze the following code and generate a comprehensive, concise, and well-structured overview of its functionality, elements, styling, and other relevant aspects. Your overview should:
    
            1. **Detailed Explanation:** Provide a thorough explanation of what the code does.
            2. **HTML Structure Analysis:** List and describe all HTML elements and their purposes.
            3. **CSS Classes Enumeration:** Enumerate all Tailwind CSS classes used and explain their styling effects.
            4. **Critical Development Information:** Highlight any critical information necessary for the development of new components that integrate with or extend this code.
            5. **Concise and Digestible:** Ensure the overview is concise, easily digestible, and focuses on essential information for developers.
    
            Include every aspect of the code, ensuring nothing is missed.
    
            *TAKE YOUR TIME AND ALSO MENTALLY THINK THROUGH THIS STEP BY STEP TO PROVIDE THE MOST ACCURATE AND EFFECTIVE RESULT*
            `;

            // Construct the user prompt with the code that needs analysis
            const userPrompt = `${prompt} \n\nCode to analyze:\n${JSON.stringify(codeToAnalyze, null, 2)}`;

            const response = await this.openai.chat.completions.create({
                model: 'gpt-4o',
                messages: [
                    {
                        role: 'system',
                        content: userPrompt,
                    },
                ],
            });

            const aiResponse = response.choices[0].message.content.trim();
            return aiResponse;
        } catch (error) {
            await this.logStep('Error in code analysis:', error);
            return '';
        }
    }

    async isCriticalError(error) {
        // Regular expression to detect '@babel' related errors
        const babelErrorRegex = /@babel/;

        // Regular expression to detect 'DEP_WEBPACK_DEV_SERVER_ON_BEFORE_SETUP_MIDDLEWARE' warning
        const webpackDevServerWarningRegex =
            /DEP_WEBPACK_DEV_SERVER_ON_BEFORE_SETUP_MIDDLEWARE/;

        const webpackDevAfterServerWarningRegex =
            /DEP_WEBPACK_DEV_SERVER_ON_AFTER_SETUP_MIDDLEWARE/;

        // If the error contains '@babel' or the specific webpack dev server warning, treat it as non-critical
        if (
            babelErrorRegex.test(error) ||
            webpackDevServerWarningRegex.test(error) ||
            webpackDevAfterServerWarningRegex.test(error)
        ) {
            return false;
        }

        const systemPrompt = `You are an AI agent in a Node.js autonomous system that generates elegant HTML web applications from user prompts. Analyze the following log message: "${error}". If it indicates a critical error that could stop the application from functioning correctly, respond only with "Critical Error Detected". Otherwise, respond only with "No Critical Error Detected". Provide no additional information or analysis.
        *TAKE YOUR TIME AND ALSO MENTALLY THINK THROUGH THIS STEP BY STEP TO PROVIDE THE MOST ACCURATE AND EFFECTIVE RESULT*
        `;

        // Critical error indication phrase
        const criticalErrorPhrase = 'Critical Error Detected';
        // Non-critical error indication phrase
        const nonCriticalErrorPhrase = 'No Critical Error Detected';

        try {
            const response = await this.openai.chat.completions.create({
                model: 'gpt-4o',
                temperature: 0,
                messages: [
                    {
                        role: 'system',
                        content: systemPrompt,
                    },
                    {
                        role: 'user',
                        content: error,
                    },
                ],
            });

            const answer = response.choices[0].message.content
                .trim()
                .toLowerCase();

            // Check for exact match to avoid false positives
            if (answer === criticalErrorPhrase.toLowerCase()) {
                return true;
            } else if (answer === nonCriticalErrorPhrase.toLowerCase()) {
                return false;
            } else {
                // Log unexpected responses for further analysis
                console.warn('Unexpected response from AI model:', answer);
                return false; // Default to non-critical if the response is unclear
            }
        } catch (apiError) {
            await this.logStep('Error sending message to OpenAI:', apiError);
            return false; // Fallback in case of an error in querying the model
        }
    }
}

module.exports = ProjectCoordinator;
