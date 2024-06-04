const path = require('path');
const fs = require('fs');
const fsPromises = require('fs').promises;
const { generateImageWithDallE, downloadImage } = require('./imageGeneration');
const User = require('./User.schema');
const {fetchImages} = require('./images');

// fetchImages().then(images => console.log(images)).catch(err => console.error(err));

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

            let arr = JSON.parse(analysisArray);
            const jsonObject = await this.findFirstArray(arr);

            // Add random IDs to all tasks in the analysisArray and filter them
            jsonObject.forEach((analysis) => {
                if (
                    !(
                        analysis.extensionType === 'css' ||
                        analysis.library === 'easy-peasy' ||
                        analysis.library === 'tailwindcss' ||
                        analysis.fileName === 'App' ||
                        (analysis.fileName === 'store' &&
                            analysis.extensionType === 'js') ||
                        analysis.fileName === 'index'
                    )
                ) {
                    taskList.push({
                        ...analysis,
                        id: generateRandomId(5),
                    });
                }
            });

            // Prepend the creation of the React app as the first task
            taskList.unshift({
                taskName: 'createReact',
                name: 'React',
                description:
                    "Create a new React application inline with the user's request",
                needsRework: false,
                reviewFeedback: null,
                id: generateRandomId(5),
            });

            await this.storeTasks(userId, taskList);

            await this.logStep(
                'Tasks have been created and stored for the project.'
            );
        }
    }

    // Stores tasks in a local file organized by project name
    async storeTasks(userId, tasks) {
        if (!Array.isArray(tasks)) {
            // If tasks is not an array, wrap it in an array
            tasks = [tasks];
        }

        // Wrap the task storage in a promise to handle async/await
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

        // Wait for all tasks to be stored
        await Promise.all(taskPromises);
    }

    listAssets = (userId) => {
        const workspace = path.join(__dirname, 'workspace');
        const projectDir = path.join(workspace, this.projectId);
        const selectedProject = User.getUserProject(userId, this.projectId)[0];
        let { appName } = selectedProject;
        const appPath = path.join(projectDir, appName);
        const assetsDir = path.join(appPath, 'src', 'assets');

        if (!fs.existsSync(assetsDir)) {
            throw new Error('Assets directory does not exist.');
        }

        return fs.readdirSync(assetsDir);
    };

    async addImagesToFolder(data, projectOverView, projectId, appName) {
        try {
            const prompt = `
          You are an Ai agent part of a node js autonomous system that creates beautiful and elegant React web applications. Your role involves using 'Data' and 'Conversation History' to generate essential images for the project using DALL-E.
          
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

    async codeWriter(message, taskList, projectOverView, appName, userId) {
        const workspace = path.join(__dirname, 'workspace');
        const projectDir = path.join(workspace, this.projectId);
        const appPath = path.join(projectDir, appName);
        const storeFilePath = path.join(appPath, 'src', 'store.js');

        // Read the current Easy Peasy store configuration
        let easyPeasyStoreDetails;
        try {
            easyPeasyStoreDetails = await fsPromises.readFile(
                storeFilePath,
                'utf8'
            );
        } catch (readError) {
            console.error(
                'Error reading the Easy Peasy store file:',
                readError
            );
            easyPeasyStoreDetails = 'Error reading store file';
        }
        const assets = this.listAssets(userId);

        const systemPrompt = `
        You are an AI agent, part of a Node.js autonomous system that creates beautiful and elegant React web applications from user prompts. Your role is to write the code for React components, following the Key Instructions, and return fully complete, production-ready code based on the task's toDo.

       Project Overview: ${projectOverView}
       Task List: ${JSON.stringify(taskList, null, 2)}
       Easy Peasy store.js file: ${JSON.stringify(easyPeasyStoreDetails, null, 2)}
       These are all the current images, icons, or static files in the project's assets folder for reference: ${JSON.stringify(assets, null, 2)}

       Key Instructions:

       1. **Analyze Thoroughly:** Before coding, carefully analyze the task and project overview to determine the most efficient and effective approach. Approach each coding task methodically.
        
       2. **Contextual Memory:** Maintain a contextual memory of all interactions, tasks provided, and discussions held. Use this information to build upon previous tasks, ensuring a cohesive and continuous development process.

       3. **Data Handling:** All data should be managed within the Easy Peasy store and should not be placed directly within components.

       4. **Component Analysis:** From the task list, analyze the 'componentCodeAnalysis' property (if provided) for tasks related to the component you are writing code for, ensuring compatibility with the existing codebase.

      5. **State Management:** Implement all state variables and state-related logic using Easy Peasy. Ensure efficient state structure and management, adhering to best practices.

      6. **Minimal Third-Party Libraries:** Utilize native or in-house solutions wherever possible. Resort to third-party libraries only if absolutely necessary, and justify their use in the code comments.

      7. **Efficient State Usage:** Ensure all state variables declared in the Easy Peasy store are actively used and manipulated within the component. Avoid unused state declarations.

      8. **Styling with Tailwind CSS:** Apply Tailwind CSS for all styling. Ensure the interface is responsive and visually aligns with the overall application design.

      9. **Task Analysis:** Carefully examine the 'toDo' and 'componentCodeAnalysis' properties within the task list for each task. Ensure your code integrates seamlessly with established functionalities and design patterns, avoiding potential conflicts or redundancies.

     10. **Return Code Only:** Your response should only include the code block. Do not add any other text or comments in the response.

     11. **PropTypes for Type Checking:** If using PropTypes for type checking props passed to the component, ensure you import them: import PropTypes from 'prop-types';

     12. **Props Analysis:** Identify components with parent-child relationships. Analyze the 'componentCodeAnalysis' property and the usage of props within these components. Ensure your code aligns with the props being utilized, facilitating seamless integration and functionality.

     13. **Importing Components:** All components and files are imported within the same directory, so './' is sufficient to import them.

     14. **Image Handling:** Reference images from the './assets' folder. Do not import or create code to import images not found in this assets folder. If a specified image is not found, do not include any image imports for that task.

     15. **Robust Image Importing:** For components requiring images, implement a robust method to import images linked to data, for example:

     16. Apart from store.js, index.js, and App.js, only the components or files listed in the Task List are the ones present in the project's directory.
        

    const mockData = [
     {
     ...,
     image: "img.jpg"
     }
    ];

    const getImage = imageName => {
      try {
       return require(\`./assets/\${imageName}\`);
       } catch (err) {
      return null; // Never return a default image
      }
      };

     return (<img src={getImage(mockData[0].image)} />);

     *TAKE YOUR TIME AND ALSO MENTALLY THINK THROUGH THIS STEP BY STEP TO PROVIDE THE MOST ACCURATE AND EFFECTIVE RESULT*
     `;

        try {
            // Preparing the context for the AI
            let aiContext = [
                {
                    role: 'system',
                    content: systemPrompt,
                },
                {
                    role: 'user',
                    content: message,
                },
            ];

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

    async codeReviewer(taskList, projectOverView, appName) {
        const workspace = path.join(__dirname, 'workspace');
        const projectDir = path.join(workspace, this.projectId);
        const appPath = path.join(projectDir, appName);
        const storeFilePath = path.join(appPath, 'src', 'store.js');

        const listAssets = () => {
            const assetsDir = path.join(appPath, 'src', 'assets');

            if (!fs.existsSync(assetsDir)) {
                throw new Error('Assets directory does not exist.');
            }

            return fs.readdirSync(assetsDir);
        };

        // Read the current Easy Peasy store configuration
        let easyPeasyStoreDetails;
        try {
            easyPeasyStoreDetails = await fsPromises.readFile(
                storeFilePath,
                'utf8'
            );
        } catch (readError) {
            console.error(
                'Error reading the Easy Peasy store file:',
                readError
            );
            easyPeasyStoreDetails = 'Error reading store file';
        }
        const assets = listAssets();

        for (const task of taskList) {
            if (task.taskName === 'createReact') {
                continue;
            }

            const componentFileName = `${task.fileName}.${task.extensionType}`;
            const componentFilePath = path.join(
                appPath,
                'src',
                componentFileName
            );

            let componentCode;
            try {
                componentCode = await fsPromises.readFile(
                    componentFilePath,
                    'utf8'
                );
            } catch (readError) {
                console.error(
                    `Error reading the component file ${componentFileName}:`,
                    readError
                );
                componentCode = `Error reading component file ${componentFileName}`;
            }

            const userPrompt = `
            Project Overview: ${projectOverView}
            Task List: ${JSON.stringify(taskList, null, 2)}
            Easy Peasy store.js file: ${JSON.stringify(easyPeasyStoreDetails, null, 2)}
            Contents in the assets folder: ${JSON.stringify(assets, null, 2)}
            
            You are an AI agent, part of a Node.js autonomous system, tasked with creating beautiful and elegant React web applications from user prompts. Your role is to meticulously review the provided component code, taking context from the given task list, specifically the toDo and componentCodeAnalysis properties, the project overview, the store.js file, and the assets folder. Your objective is to ensure that each component's code is error-free, fully functional with no placeholders, properly integrated with other components, and matches the described functionality.
            
            For each component in the task list:
            1. **Analyze the toDo Property:** Understand the purpose and functionality required for the component.
            2. **Analyze the componentCodeAnalysis Property:** Review the detailed analysis to understand the key elements, functions, props, state dependencies, and any critical information for development.
            3. **Check for Imports and Dependencies:** 
               - Ensure all necessary imports are included.
               - Remove any unnecessary imports.
               - Verify that state dependencies and actions (if any) are correctly implemented using easy-peasy or any other state management libraries mentioned.
            4. **Ensure Code Functionality:** 
               - Confirm the code performs the required tasks.
               - Ensure it handles user interactions appropriately.
               - Check that it displays the expected UI elements.
            5. **Check for Context Integration:** 
               - Verify that the component works seamlessly with other components as per the given context.
               - Ensure that state, props, and prop types passed to and from the component are correctly linked and utilized.
            6. **Verify Asset Imports:** 
               - Ensure that all image or static file imports correspond to actual files in the assets folder.
               - Remove any imports that refer to non-existent files to prevent errors.
            7. **Verify Integration with the easy-peasy Store:** 
               - If its being used ensure that the component correctly utilizes the easy-peasy store for state management.
               - Check that the actions and state properties from the store are correctly consumed and used within the component if it uses the state.
            8. **Return a Single JSON Object:** 
               - If the code is correct, return a JSON object with the component filename and newCode as null.
               - If the code needs adjustments, provide the updated code in the newCode field.

            9. Apart from store.js, index.js, and App.js, only the components or files listed in the Task List are the ones present in the project's directory.
            
            10. For any imports not listed in the Task List, adjust the code to use alternative logic that relies solely on the components and files present in the Task List.
                  
            
            Take your time and use a chain-of-thought approach to ensure your review is comprehensive and nothing is missed. Consider every aspect of the component code, including state, props, prop types, imports, and integration with other components, assets, or files.
            
            Example responses:
            1. Component with no problem => [
                {
                  "component": "Home.jsx",
                  "newCode": null
                }
              ]
            2. Component with problem => [
                {
                  "component": "Food.jsx",
                  "newCode": "import React from 'react';
                  import { useStoreState } from 'easy-peasy';
                  
                  const Food = () => {
                    const food = useStoreState((state) => state.food);
                  
                    return (
                      <div
                        className='absolute bg-green-500'
                        style={{
                          width: '20px',
                          height: '20px',
                          left: '20px',
                          top: '20px',
                        }}
                      />
                    );
                  };
                  
                  export default Food;"
                }
              ]
            
            The component: ${componentFileName}
            The component code: ${JSON.stringify(componentCode, null, 2)}
            
            Make sure the React application works as expected. Fix any issues found in the component code, ensuring that it correctly utilizes the easy-peasy store and is properly integrated with other components and assets. Ensure the code is well-written, functional, and adheres to the specified requirements.

            *TAKE YOUR TIME AND ALSO MENTALLY THINK THROUGH THIS STEP BY STEP TO PROVIDE THE MOST ACCURATE AND EFFECTIVE RESULT*
            
       `;

            const response = await this.openai.chat.completions.create({
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
        You are an AI agent, part of a Node.js autonomous system that creates beautiful and elegant React web applications from user prompts. Your role is to analyze the following code and generate a comprehensive, concise, and well-structured overview of its functionality, elements, functions, props, prop types, state, and other relevant aspects. Your overview should:

        1. **Detailed Explanation:** Provide a thorough explanation of what the code does.
        2. **Component Analysis:** List and describe all components, including their elements, props, and functions.
        3. **Prop Types Enumeration:** Enumerate all prop types used and explain their purpose.
        4. **State Management Details:** Detail the state management within the components, including initial state, state updates, and any state-related functions.
        5. **Critical Development Information:** Highlight any critical information necessary for the development of new components that integrate with or extend this code.
        6. **Concise and Digestible:** Ensure the overview is concise, easily digestible, and focuses on essential information for developers.

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

        const systemPrompt = `You are an AI agent in a Node.js autonomous system that generates elegant React web applications from user prompts. Analyze the following log message: "${error}". If it indicates a critical error that could stop the application from functioning correctly, respond only with "Critical Error Detected". Otherwise, respond only with "No Critical Error Detected". Provide no additional information or analysis.
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

            const answer = response.choices[0].message.content.trim().toLowerCase();

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
