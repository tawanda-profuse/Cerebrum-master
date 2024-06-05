require('dotenv').config();
const path = require('path');
const fs = require('fs');

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
        const workspaceDir = path.join(__dirname, 'workspace');
        const projectDir = path.join(workspaceDir, projectId);
        const projectPath = path.join(projectDir, appName);
        const assetsDir = path.join(projectPath, 'assets');

        if (!fs.existsSync(assetsDir)) {
            throw new Error('Assets directory does not exist.');
        }

        return fs.readdirSync(assetsDir);
    };

    const assets = listAssets();
    const systemPrompt = `
    Context: You are an AI agent within a Node.js autonomous system designed to create beautiful and elegant HTML/Tailwind web projects. Your task is to meticulously analyze the provided Component Architecture and Project Description. Based on your thorough understanding, construct a detailed array of task JSON objects that reflect the project's requirements, ordered sequentially from main HTML files to linked  files.

    Component Architecture: ${systemResponse}
    Project Description: ${projectDes}
    Current assets in the project: ${JSON.stringify(assets, null, 2)}

    Task Details:

    Each task JSON object should capture essential aspects of the development process, including the identification of main HTML files, linked pages, and JS files within the architecture. Break down each task into specific, actionable items targeting individual components or functionalities.

    'toDo' Property:

    The 'toDo' property must contain a comprehensive, detailed description of the task and the code that needs to be written. This description should enable a code-writing AI to generate optimized and efficient code, tailored to your requirements. Include functionality details, design elements, and any unique specifications or constraints. Ensure the description is thorough and explicit, eliminating assumptions and enabling precise coding solutions.

    Key Considerations:
    Minimal Pages and Files: To prevent errors, minimize the number of pages and js files.
    Centralize image imports in the './assets' folder.
    Position all pages in the root directory.
    Index.html is always the entry point of the project 
    Assign dedicated tasks for each identified sub-page
    Ensure every page mentioned in the Component Architecture is translated into a task.
    If images are needed, always reference them from the './assets' folder: ${JSON.stringify(assets, null, 2)}.
    Do not import the tailwind.css file as it is already pre-configured.
    Only import images that are in the assets folder. If the specified image is not found in the assets folder, do not include any image imports for that task.
    All styling should be implemented using Tailwind CSS. Do not use or create any CSS files. Tailwind is already pre-configured, ensuring consistent design.
    
    JSON Task Object Structure:

    Each JSON task object should include the following fields:

    taskName: Define the task ('Create').
    fileName: Specify the file to be created or modified.
    extensionType: Indicate the file type ('html', 'js').
    toDo: Provide a highly detailed description of the required code.
    imports: List all necessary imports for the file, considering the project's guidelines.
    linkedFiles: Mention any sub-files associated with the main file.

    Example of a task object:

    [
    {
        "taskName": "Create",
        "fileName": "",
        "extensionType": "html or js",
        "toDo": "",
        "imports": [],
        "linkedFiles": []
    },
    .......
    ]

    The Tailwind CSS initial configurations are already set up. Do not include them in your task list. Your goal is to structure each task aligning with the Component Architecture. After completing this, return the JSON objects for implementation. Approach this task methodically, considering each step carefully.



    Special Instruction:

    When an object is importing a file, always include this as a separate task!

    *TAKE YOUR TIME AND ALSO MENTALLY THINK THROUGH THIS STEP BY STEP TO PROVIDE THE MOST ACCURATE AND EFFECTIVE RESULT*
    `;

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            response_format: { type: 'json_object' },
            messages: [
                {
                    role: 'system',
                    content: systemPrompt,
                },
            ],
        });
        const aiResponse = response.choices[0].message.content.trim();

        const extractedJsonObjects = await aiResponse;
        saveToPersistentStorage('tasks', extractedJsonObjects);
    } catch (error) {
        console.log('Error:', error);
        return [];
    }
}

async function addTailwindPropertiesToComponents(systemResponse) {
    const tasks = retrieveFromPersistentStorage('tasks');
    const systemPrompt = `
    You are an AI agent within a Node.js autonomous system designed to create beautiful and elegant HTML/Tailwind web projects. Your role is to meticulously analyze the provided Tailwind Properties and Task List. Based on your thorough understanding, your task is to enrich each task JSON object with the appropriate Tailwind CSS properties, ensuring that each component is styled according to the project's requirements.

    Tailwind Properties: ${systemResponse}
    
    Task List: ${JSON.stringify(tasks, null, 2)}

    Your response should be a complete and updated array of JSON objects, each one representing a task, now enriched with Tailwind CSS styling details (if necessary).

    The key elements of this task include:

    1. Addition of a 'tailwindStyles' key in each JSON task object. This key should detail the specific Tailwind CSS classes you've selected to style each component, reflecting the design and functional requirements of the project.
    2. Ensuring that the Tailwind CSS styles you choose align harmoniously with each component's inherent design and functional needs.
    3. Emphasizing responsive design principles. Leverage Tailwind's utility-first approach to create adaptable, visually appealing layouts that respond to different device sizes and orientations.

    Each JSON object in the task list should maintain the following structure, now including the newly added Tailwind CSS details:
     - taskName: Either 'Create' or 'Install', as per the original task requirements.
     - fileName: The file to be created or modified.
     - extensionType: Use 'html', 'js', or 'css'.
     - toDo: A detailed description of the task, encompassing functionality, design elements, and specific requirements.
     - imports: All necessary imports for the component.
     - linkedFiles: Names of any sub-files associated with the main file.
     - tailwindStyles: The newly added key, detailing the Tailwind CSS classes for styling the component.

     Ensure all styling is implemented using Tailwind CSS. Do not use or create any CSS files.

     Example tasks with Tailwind CSS integration:

    [
      {
        "taskName": "Create",
        "fileName": "Home.html",
        "extensionType": "html",
        "toDo": "Create the main HTML file with a header, main content area, and footer.",
        "imports": [],
        "linkedFiles": ["style.css", "script.js"],
        "tailwindStyles": {
          "header": "bg-gray-800 text-white p-4",
          "main": "container mx-auto p-4",
          "footer": "bg-gray-800 text-white p-4"
        }
      },
      ......
    ]

    Take your time to methodically integrate Tailwind CSS into each task, ensuring that each component not only functions optimally but also adheres to the highest standards of modern, responsive design.
    Return the full, complete updated list of all the JSON objects, ensuring no omissions or placeholders.

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

        const extractedJsonObjects = await aiResponse;
        saveToPersistentStorage('tasks', extractedJsonObjects);

    } catch (error) {
        console.log('Error:', error);
        return [];
    }
}

module.exports = {
    createComponentFiles,
    addTailwindPropertiesToComponents,
    saveToPersistentStorage,
    retrieveFromPersistentStorage,
};
