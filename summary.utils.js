require('dotenv').config();
const path = require('path');
const fs = require('fs');
const fsPromises = require('fs').promises;

const OpenAI = require('openai');
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const localStorage = {};

function saveToPersistentStorage(key, data) {
    localStorage[key] = data;
}

// Function to retrieve data from the local storage
function retrieveFromPersistentStorage(key) {
    return localStorage[key] || null; // Return null if the key is not found
}

async function createComponentFiles(
    systemResponse,
    projectDes,
    appName,
    projectId
) {
    const listAssets = () => {
        const dynamicName = appName;
        const workspaceDir = path.join(__dirname, 'workspace');
        const projectDir = path.join(workspaceDir, projectId);
        const assetsDir = path.join(projectDir, dynamicName, 'src', 'assets');

        if (!fs.existsSync(assetsDir)) {
            throw new Error('Assets directory does not exist.');
        }

        return fs.readdirSync(assetsDir);
    };

    const assets = listAssets();
    const systemPrompt = `
    You are an AI agent within a Node.js autonomous system designed to create beautiful and elegant React web applications. Your task is to meticulously analyze the provided Component Architecture and Project Description. Based on your thorough understanding, construct a detailed array of task JSON objects that reflect the project's requirements, ordered sequentially from parent components to child components or from main components to nested linked components.

    Component Architecture: ${systemResponse}
    Project Description: ${projectDes}
    Current assets in the project: ${JSON.stringify(assets, null, 2)}
    
    Task Details:
    Each task JSON object should capture essential aspects of the development process, including the identification of parent, child, and linked components within the architecture. Break down each task into specific, actionable items targeting individual components or functionalities.
    
    Component Minimization Guidelines:
    
    -Minimal Components: To prevent errors, minimize the number of components. If the app can be made with one component, use only one component.
    -Single File Preference: If all code fits within 400 lines, create just one component. Create additional components only if the code exceeds this limit.
    -Component Line Threshold: If a component has at least 400 lines of code, it can suffice as a single component. Create another component when the code exceeds 400 lines.
    
    'toDo' Property:
    The 'toDo' property must contain a comprehensive, detailed description of the task and the code that needs to be written. This description should enable a code-writing AI to generate optimized and efficient code, tailored to your requirements. Include functionality details, design elements, and any unique specifications or constraints. Ensure the description is thorough and explicit, eliminating assumptions and enabling precise coding solutions.
    
    JSON Task Object Structure:
    Each JSON task object should include the following fields:
    
    1.taskName: Define the task ('Create' or 'Install').
    2.fileName: Specify the file to be created or modified.
    3.extensionType: Indicate the file type ('jsx' for React components or 'js' for scripts).
    4.toDo: Provide a highly detailed description of the required code.
    5.imports: List all necessary imports for the component, considering the project's guidelines.
    6.linkedComponents: Mention any sub-components associated with the main component.
    
    Key Considerations:
    -Centralize image imports in the './assets' folder.
    -Position all components in the root directory.
    -Use appropriate file extensions ('jsx' for React components and 'js' for scripts).
    -Clearly categorize each task as either 'Create' or 'Install', focusing on components or functions.
    -Define and associate main tasks with their respective sub-components.
    -Assign dedicated tasks for each identified sub-component.
    -Ensure every component mentioned in the Component Architecture is translated into a task.
    -If images are needed, always reference them from the './assets' folder: ${JSON.stringify(assets, null, 2)}.
    -Do not import the tailwind.css file as it is already pre-configured.
    -Only import images that are in the assets folder. If the specified image is not found in the assets folder, do not include any image imports for that task.
    -All styling should be implemented using Tailwind CSS. Do not use or create any CSS files. Tailwind is already pre-configured, ensuring consistent design.
    -Ensure all component imports are relative to the root directory and do not include subdirectories. For example: import Header from './Header', import Slideshow from './Slideshow'.
    
    Task Order and Dependencies:
    Construct tasks starting from the highest level (parent) components to the lower-level (child) components.
    Ensure that main components are created before their nested or linked sub-components to maintain a logical development flow.
    All imports, excluding images, icons, and videos, should be relative to the root directory containing the App.jsx file without subdirectories.
    Example of a task object:

    [
    {
        "taskName": "Create",
        "fileName": "",
        "extensionType": "jsx or js",
        "toDo": "",
        "imports": [
        "React from 'react'",
        "Component from './Component'",
        ],
        "linkedComponents": []
    }
    ]

    The App.js file, Tailwind CSS, and Easy Peasy initial configurations are already set up. Do not include them in your task list. Your goal is to structure each task aligning with the Component Architecture. After completing this, return the JSON objects for implementation. Approach this task methodically, considering each step carefully.

    *TAKE YOUR TIME AND ALSO MENTALLY THINK THROUGH THIS STEP BY STEP TO PROVIDE THE MOST ACCURATE AND EFFECTIVE RESULT*
    `;

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            response_format: { type: 'json_object' },
            temperature: 0,
            messages: [
                {
                    role: 'system',
                    content: systemPrompt,
                },
            ],
        });
        const aiResponse = response.choices[0].message.content.trim();

        // Improved extraction process
        const extractedJsonObjects = await aiResponse;
        saveToPersistentStorage('tasks', extractedJsonObjects);
    } catch (error) {
        console.log('ma1:', error);
        return [];
    }
}

async function addTailwindPropertiesToComponents(systemResponse) {
    const tasks = retrieveFromPersistentStorage('tasks');
    const systemPrompt = `
    You are an Ai agent part of a node js autonomous system that creates beautiful and elegant React web applications, Your role is to meticulously analyze the provided Tailwind Properties and Task List. Based on your thorough understanding,your task is to enrich each task JSON object with the appropriate Tailwind CSS properties, ensuring that each component is styled according to the project's requirements.      

    Tailwind Properties: ${systemResponse}
    
    Task List: ${JSON.stringify(tasks, null, 2)}

    Your response should be a complete and updated array of JSON objects, each one representing a task, now enriched with Tailwind CSS styling details (if neccesary). 

    The key elements of this task include:

    1. Addition of a 'tailwindStyles' key in each JSON task object. This key should detail the specific Tailwind CSS classes you've selected to style each component, reflecting the design and functional requirements of the project.
    2. Ensuring that the Tailwind CSS styles you choose align harmoniously with each component's inherent design and functional needs.
    3. Emphasizing responsive design principles. Leverage Tailwind's utility-first approach to create adaptable, visually appealing layouts that respond to different device sizes and orientations.
    
    Each JSON object in the task list should maintain the following structure, now including the newly added Tailwind CSS details:
     - taskName: Either 'Create' or 'Install', as per the original task requirements.
     - fileName: The file to be created or modified.
     - extensionType: Use 'jsx' for React components and 'js' for scripts.
     - toDo: A detailed description of the task, encompassing functionality, design elements, and specific requirements.
     - imports: All necessary imports for the component.
     - linkedComponents: Names of any sub-components associated with the main component.
     - tailwindStyles: The newly added key, detailing the Tailwind CSS classes for styling the component.

     The App.js file , Tailwind  CSS and Easy Peazy initial configurations have alreasy been made and set up so dont include them in your task list!. Now Incorporate the provided Tailwind Properties and the original Task List into your response. Your final output should be a comprehensive and updated array of JSON objects, each reflecting the integration of Tailwind CSS into the tasks. Here is an example of how a task object might look with detailed Tailwind CSS property additions:

      [
      {
        "taskName": "Create",
        "fileName": "",
        "extensionType": "jsx or js",
        "toDo": "",
        "imports": ["React from 'react'","{useStoreActions} from 'easy-peasy'", "{useStoreState} from 'easy-peasy'"],
        "linkedComponents": [],
        "tailwindStyles": {
          "container": "flex flex-wrap justify-center items-center",
          "header": "text-2xl font-bold mb-4",
          "body": "p-4 bg-white shadow-md rounded"
        }
      },
      
    ]

    Never import the tailwind.css file because its already been imported in pre configuration.  
    Take your time to methodically integrate Tailwind CSS into each task, ensuring that each component not only functions optimally but also adheres to the highest standards of modern, responsive design.
    Return the full, complete updated list of all the JSON objects, ensuring no omissions or placeholders

    *TAKE YOUR TIME AND ALSO MENTALLY THINK THROUGH THIS STEP BY STEP TO PROVIDE THE MOST ACCURATE AND EFFECTIVE RESULT*
    `;

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            response_format: { type: 'json_object' },
            temperature: 0,
            messages: [
                {
                    role: 'system',
                    content: systemPrompt,
                },
            ],
        });

        const aiResponse = response.choices[0].message.content.trim();

        // Improved extraction process
        const extractedJsonObjects = await aiResponse;
        saveToPersistentStorage('tasks', extractedJsonObjects);
    } catch (error) {
        console.log('ma1:', error);
        return [];
    }
}

async function addSateConfigarationToComponents(systemResponse, userId) {
    const tasks = retrieveFromPersistentStorage('tasks');
    const systemPrompt = `You are an Ai agent part of a node js autonomous system that creates beautiful and elegant React web applications, Your role is to meticulously analyze the provided Easy Peasy Properties and Task List. Based on your thorough understanding, your task is to enrich each task JSON object with the appropriate Easy Peasy state and actions, ensuring that each component is fully integrated with the Easy Peasy store.

    Easy Peasy Properties: ${systemResponse}
    
    Task List: ${JSON.stringify(tasks, null, 2)}'

    Your response should be a complete and updated array of JSON objects, each one representing a task, now enriched with Easy Peasy state management details (if needed). The key elements of this task include:
    
    1. Identifying components within the task list that require enhanced state management and integrating Easy Peasy accordingly.
    2. Defining and integrating Easy Peasy state, actions, or thunks that are relevant to each component's specific functionality.
    3. Updating the 'imports' section of each task object to include necessary Easy Peasy hooks and stores.
    
    Each JSON object in the task list should maintain its original structure, now including the Easy Peasy integration details:

    - taskName: Either 'Create' or 'Install', as per the original task requirements.
    - fileName: The file to be created or modified.
    - extensionType: Use 'jsx' for React components and 'js' for scripts.
    - toDo: A detailed description of the task, encompassing functionality, design elements, and specific requirements.
    - imports: All necessary imports for the component, now including Easy Peasy hooks and stores.
    - linkedComponents: Names of any sub-components associated with the main component.
    - tailwindStyles: Tailwind CSS classes for styling, if applicable.
    - easyPeasyState: Newly added key, detailing the state, actions, or thunks in the Easy Peasy store related to the task.
    - Incorporate the provided Easy Peasy Properties and the original Task List into your response. Your final output should be a comprehensive and updated array of JSON objects, each reflecting the integration of Easy Peasy into the tasks. Here is an example of how a task object might look with Easy Peasy integration:

    Example tasks with Easy Peasy integration:
    
    [
      {
        "taskName": "Create",
        "fileName": "",
        "extensionType": "jsx or js",
        "toDo": "",
        "imports": ["React from 'react'","{useStoreActions} from 'easy-peasy'", "{useStoreState} from 'easy-peasy'"],
        "linkedComponents": [],
        "tailwindStyles": {
          "container": "flex flex-wrap justify-center items-center",
          "header": "text-2xl font-bold mb-4",
          "body": "p-4 bg-white shadow-md rounded"
        },
        "easyPeasyState": {
          "state": ["uiElements"],
          "actions": ["updateElement"]
        }
      }
      
    ]
    
    
    Take your time and think through each step meticulously. Return the full, complete updated list of all the JSON objects, ensuring no omissions or placeholders
    `;

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            response_format: { type: 'json_object' },
            temperature: 0,
            messages: [
                {
                    role: 'system',
                    content: systemPrompt,
                },
            ],
        });

        const aiResponse = response.choices[0].message.content.trim();

        // Improved extraction process
        const extractedJsonObjects = await aiResponse;
        saveToPersistentStorage('tasks', extractedJsonObjects);
    } catch (error) {
        console.log('ma1:', error);
        return [];
    }
}

async function updateStore(
    systemResponse,
    imageDetails,
    appName,
    userId,
    projectId
) {
    let easyPeasyPrompt = `While taking your time, update the store.js file that manages state within a React application. The code should be exhaustive, functional, and specifically tailored to meet the detailed requirements of your application.

  Instructions:
  
  1. Integrate Full Component-Specific Data (if given):
     Ensure no data is omitted or generalized. All data should be included in the store.js file and be fully accessible to the components.
  
  2. Detailed Implementation of State Variables:
     Define each state variable accordingly. These variables should have precise structures and values that align perfectly with the needs of your project.
     Avoid any form of placeholder data. Each state variable should directly represent the data structures and types required by your application's components.
  
  3. Develop Action Methods with Specific Logic:
     Create action methods for each action as outlined in your project. These methods should contain exact logic for manipulating the state and be directly related to the functionalities of your application.
     Each action method should be fully operational, avoiding generic or placeholder implementations.
  
  4. Exclude External API Data Fetching:
     Since the project is based on the data object (if given), ensure no functionality for fetching data from external APIs is included in the store.js file.
  
  5. Deliver a Fully Functional File:
     The final store.js file should be structurally sound, rich in functional logic, and encompass all processes detailed in the project overview.
     This file should effectively manage the state of the React application, fulfilling all specified requirements and ensuring seamless integration with the functionality of each component.
  
  6. Never alter the initial state data. The provided initial state should be used as-is.
  
  7. If the original state data has images, the specified paths for images should be amended and named to reflect the images details of the project. Under no circumstances should images or static assets be imported in the store.js file. All images and static assets are imported in the specific component.
  
  - Image Details: ${imageDetails}
  
  *TAKE YOUR TIME AND ALSO MENTALLY THINK THROUGH THIS STEP BY STEP TO PROVIDE THE MOST ACCURATE AND EFFECTIVE RESULT*`;

    const newStoreFileContent = await storeCodeWriter(
        easyPeasyPrompt,
        systemResponse,
        appName,
        projectId
    );

    async function updateEasyPeasyStore(fileContent, appName, projectId) {
        const workspace = path.join(__dirname, 'workspace');
        const projectDir = path.join(workspace, projectId);
        const appPath = path.join(projectDir, appName);
        const storeFilePath = path.join(appPath, 'src', 'store.js');

        try {
            await fsPromises.writeFile(storeFilePath, fileContent);
        } catch (error) {
            console.error('Error updating the Easy Peasy store file:', error);
        }
    }

    await updateEasyPeasyStore(newStoreFileContent, appName, projectId);

    console.log('I have updated store.js file configuration.');
}

async function storeCodeWriter(
    easyPeasyPrompt,
    systemResponse,
    appName,
    projectId
) {
    const workspace = path.join(__dirname, 'workspace');
    const projectDir = path.join(workspace, projectId);
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
        console.error('Error reading the Easy Peasy store file:', readError);
        easyPeasyStoreDetails = 'Error reading store file';
    }
    const systemPrompt = `You are an Ai agent part of a node js autonomous system that creates beautiful and elegant React web applications  from user prompts. Your role is to update the store.js file by adding the full configuration and overall functionality . Return the complete, production-ready code for the updated Easy Peasy Store.js file, do not put placeholders, meet high-quality standards. Derive context from the provided Store Configuration, and return code that will have no errors.

    Key Instructions:

    1. Before coding, thoroughly analyze the task and project overview to determine the most efficient and effective approach, Approach each coding task methodically.
    
    2. Take your time while thinking this through step by step, and then write the code for the component.

    3. Easy Peasy State Management: All state variables and state-related logic must be implemented using Easy Peasy. Ensure that the state is efficiently structured and managed within the Easy Peasy store, reflecting best practices in state management.

    4. Efficient State Usage: Ensure all state variables declared in the Easy Peasy store are actively used and manipulated within the component. Avoid any unused state declarations.

    5. No Console Logging: The final code should not include any console.log statements or other debugging output. It must be clean and production-ready.

    6. React Best Practices: Adhere strictly to React best practices, including the use of hooks for state and effects, proper component structuring, and effective rendering techniques.

    7. Error Handling: Implement robust error handling mechanisms to ensure stability and reliability.

    8. RETURN ONLY THE CODE: Your response should be a code block only. Do not include any other text or comments in the response.

    9. NEVER WRITE PLACEHOLDER CODE: The code you generate should be production-ready and fully executable. Do not write placeholders or ommit some implementation, do not leave comments where code should be or write code that is not executable.  

    10. The store should never import images or static files; all static assets should be imported within their respective components. 

    11. Under no circumstances should images or static assets be imported in the store.js file. All images and static assets are imported in the specific component.
    Project Store Configuration : ${systemResponse}
    
    Current store.js file: ${JSON.stringify(easyPeasyStoreDetails, null, 2)}

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
                content: easyPeasyPrompt,
            },
        ];

        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: aiContext,
        });

        const aiResponse = response.choices[0].message.content;

        const codeBlockRegex = /```(?:\w+\n)?([\s\S]*?)```/g;
        const matches = aiResponse.match(codeBlockRegex);

        if (matches && matches.length > 0) {
            let code = matches[0].replace(/```(?:\w+\n)?|```/g, '').trim();
            return code;
        } else {
            console.log('No code block found in response.');
            return '';
        }
    } catch (error) {
        console.log('Error sending message to OpenAI:', error);
        return '';
    }
}

module.exports = {
    createComponentFiles,
    addTailwindPropertiesToComponents,
    addSateConfigarationToComponents,
    updateStore,
    saveToPersistentStorage,
    retrieveFromPersistentStorage,
};
