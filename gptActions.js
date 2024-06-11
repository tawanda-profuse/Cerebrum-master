require('dotenv').config();
const path = require('path');
const fsPromises = require('fs').promises;
const fs = require('fs');
const OpenAI = require('openai');
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});
const ProjectCoordinator = require('./projectCoordinator');
const User = require('./User.schema');
const { TaskProcessor } = require('./taskProcessor');

async function handleActions(userMessage, userId, projectId) {
    let conversations = await User.getUserMessages(userId, projectId);
    const selectedProject = User.getUserProject(userId, projectId)[0];

    // Removing 'projectId' and 'time' properties from each object
    let conversationHistory = conversations.map(({ role, content }) => {
        return { role, content };
    });
    let { projectOverView } = selectedProject;
    try {
        const systemPrompt = `
    You are an AI agent from Yedu AI , you are part of a Node.js autonomous system that creates web applications for users. Your primary role is advanced sentiment analysis to ensure compliance with system rules.

    Current conversation history: ${JSON.stringify(conversationHistory, null, 2)},

    Project Overview: ${JSON.stringify(projectOverView, null, 2)}

    If the Project Overview is null it means there is no project created yet

    The user has sent a message that requires analysis to determine the appropriate action. Follow these guidelines strictly and always return only one word as the response:

    1. New HTML Application: If the message indicates a request to create a new HTML application, initiate the application creation process and RETURN ONLY ONE WORD: "createApplication".

    2. Modify Existing Application: If the message pertains to modifying the existing application in any way, including adding new features, changing design, or updating content, begin the modification process and RETURN ONLY ONE WORD: "modifyApplication". Use sentiment analysis to ensure the request is genuinely a modification and not an attempt to create a new project detect this and if thats the case RETURN ONLY ONE WORD: "reject". 
    
    3. General Inquiries and Project Details: For queries related to specific projects, general inquiries, or any other requests that do not fall under the creation or modification conditions, RETURN ONLY ONE WORD: "generalResponse".

    4. Deceptive Requests: If the message is an attempt to deceive the system into creating a new project through modification requests, detect this through sentiment analysis and RETURN ONLY ONE WORD: "reject".


    Use advanced context and content analysis to determine the best course of action and respond accordingly to the user's request.

    *TAKE YOUR TIME AND ALSO MENTALLY THINK THROUGH THIS STEP BY STEP TO PROVIDE THE MOST ACCURATE AND EFFECTIVE RESULT*
`;

        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            temperature: 0,
            messages: [
                {
                    role: 'system',
                    content: systemPrompt,
                },
                {
                    role: 'user',
                    content: userMessage,
                },
            ],
        });

        const aiResponse = response.choices[0].message.content.trim();

        return aiResponse;
    } catch (error) {
        console.log(error);
        return 'error';
    }
}

async function handleUserReply(userMessage, userId, projectId) {
    let conversations = await User.getUserMessages(userId, projectId);
    

    // Removing 'projectId' and 'time' properties from each object
    let conversationHistory = conversations.map(({ role, content }) => {
        return { role, content };
    });
    try {
        const systemPrompt = `You are an Ai agent part of a node js autonomous system that creates beautiful and elegant HTML web applications  from user prompts. Your role is to respond to the user
        Current conversation history: ${JSON.stringify(
            conversationHistory,
            null,
            2
        )},`;

        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                {
                    role: 'system',
                    content: systemPrompt,
                },
                {
                    role: 'user',
                    content: userMessage,
                },
            ],
        });

        const aiResponse = response.choices[0].message.content.trim();

        return aiResponse;
    } catch (error) {
        console.log('Error in code analysis:', error);
        return '';
    }
}

async function findFirstArray(data) {
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

async function exponentialBackoff(fn, retries = 5, delay = 300) {
    let attempt = 0;
    while (attempt < retries) {
        try {
            return await fn();
        } catch (error) {
            if (error.status === 429 && attempt < retries - 1) {
                const retryAfter = error.headers['retry-after-ms'] || delay;
                console.log(
                    `Rate limit exceeded. Retrying in ${retryAfter}ms...`
                );
                await new Promise((resolve) => setTimeout(resolve, retryAfter));
                delay *= 2; // Exponential backoff
                attempt++;
            } else {
                throw error;
            }
        }
    }
    throw new Error('Max retries reached');
}

async function getConversationHistory(userId, projectId) {
    const conversations = await User.getUserMessages(userId, projectId);
    return conversations.map(({ role, content }) => ({ role, content }));
}

async function handleIssues(message, projectId, userId) {
    const selectedProject = User.getUserProject(userId, projectId)[0];
    let { taskList, projectOverView, appName } = selectedProject;
    const workspaceDir = path.join(__dirname, 'workspace');
    const appPath = path.join(workspaceDir, projectId);
    const projectCoordinator = new ProjectCoordinator(
        openai,
        projectId
    );

    const listAssets = () => {
        const workspaceDir = path.join(__dirname, 'workspace');
        const projectDir = path.join(workspaceDir, projectId);
        const assetsDir = path.join(projectDir, 'assets');

        if (!fs.existsSync(assetsDir)) {
            throw new Error('Assets directory does not exist.');
        }

        return fs.readdirSync(assetsDir);
    };

    const conversationHistory = await getConversationHistory(userId, projectId);

    const conversationContext = conversationHistory
        .map(({ role, content }) => `${role}: ${content}`)
        .join('\n');

    
        // Contextualize AI's role and current tasks
        const assets = listAssets();
        let aiContext = {
            role: 'system',
            content:`
            Project Overview:
            ${projectOverView}

            Conversation Context:
            ${conversationContext}

            Task List:
            ${JSON.stringify(taskList, null, 2)}

            Current Assets in the Project's Assets Folder:
            ${JSON.stringify(assets, null, 2)}

            Your task is to generate specific tasks in JSON format to address the modification requests for the provided HTML application. Follow these steps:

            1. Carefully analyze the Project Overview, Conversation Context, user request, and Task List to understand the required components and functionalities. Pay close attention to the content property in the Task List, which provides an overview of the code. Identify dependencies to ensure all necessary pages and files are accounted for.

            2. Generate tasks in JSON format based on the project requirements. Tasks may involve modifying existing components or files, generating missing images, or creating new HTML or JS pages and files. Ensure each task is actionable, clear, and directly related to the project's requirements.

            3. When creating a new file or page, ensure that the corresponding parent file or page is updated accordingly, including creating a modification task for the parent to reflect the changes. Ensure the output is always an array of objects, even if only one task is generated.

            4. Only create 'Modify' tasks for pages or files that are explicitly listed in the Task List. Never modify files that are not mentioned in the task list. Align tasks with the project's original specifications and user intentions.

            5. For modifications, ensure the fileName field contains the exact name of a single file listed in the Task List.

            6. Create tasks that align with the Project Overview, Conversation Context, user request, and Task List to address the issues.

            7. Handle missing or misspelled assets by creating tasks to locate or correct them. For example, if an image asset is missing, create a task to either generate the image based on the import name.

            8. If the user wants an image generated, create a task to describe the image in detail and generate it using an image generation API.

            9. When creating a new HTML or JS file:
            - Create a 'Generate' task for the new file with a detailed prompt.
            - Create a 'Modify' task for the parent file to include references to the new file.
            - Ensure the new file and parent file are both listed in the Task List.

            10. Use the following JSON structure for tasks:
                [
                {
                    "name": "index",
                    "extension": "html",
                    "content": "full HTML code here",
                    "taskType": "Modify"
                },
                {
                    "name": "script",
                    "extension": "js",
                    "content": "full JavaScript code here",
                    "taskType": "Modify"
                }
                // Add other files as needed
                ]

            11. Take your time to think through each step carefully. All pages and files are in the same directory, with images in the './assets' folder. Ensure the HTML and JavaScript files are included and correctly referenced. Ensure the code is fully functional and production-ready.

            12. Return only the JSON array of objects as the final output and nothing else!

            <thinkingProcess>
            Before generating the tasks, take a moment to carefully consider the following:
            1. Analyze the project overview, conversation context, user request, and task list to gain a comprehensive understanding of the project requirements and dependencies.
            2. Identify the specific components, files, or assets that need to be modified, generated, or created based on the provided information.
            3. Determine the most effective approach to address each modification request, whether it involves modifying existing code, generating new files, or handling missing assets.
            4. Ensure that the generated tasks are clear, actionable, and aligned with the project's original specifications and user intentions.
            </thinkingProcess>

            <taskFormat>
            taskType: Type of task ('Modify', 'Generate', 'Install').
            content: the code to be written.
            name: The name of the file to be modified or where the new component is to be created.
            extension: The file extension (e.g., 'html', 'css', 'js', ejs).
            </taskFormat>

            <finalInstructions>
            Generate the tasks in JSON format based on the provided project overview, conversation context, user request, and task list. Ensure that each task addresses a specific modification request and aligns with the project requirements. Include all necessary files, references, and assets to maintain code quality, functionality, and user experience. Return the tasks as a JSON array of objects, following the specified format. Take your time to think through each step carefully and ensure the code is fully functional and production-ready.
            </finalInstructions>
                        `
        };

        // User message
        let userMessage = {
            role: 'user',
            content: message,
        };

        // Generate AI response based on context
        const response = await exponentialBackoff(() =>
            openai.chat.completions.create({
                model: 'gpt-4o',
                messages: [aiContext, userMessage],
            })
        );
        const rawArray = response.choices[0].message.content.trim();
        // Extract the JSON array from the response using a regular expression
        const startIndex = rawArray.indexOf('[');
        const endIndex = rawArray.lastIndexOf(']') + 1;
        
        // Ensure that we found a valid JSON array
        if (startIndex === -1 || endIndex === -1) {
            throw new Error('No JSON array found in the response.');
        }
        
        // Step 2: Extract the JSON array string
        let jsonArrayString = rawArray.substring(startIndex, endIndex);
        
        // Step 4: Handle escaped characters by unescaping double quotes
        jsonArrayString = jsonArrayString.replace(/\\"/g, '"');
        try {
        const parsedArray = JSON.parse(jsonArrayString);

        console.log('array', parsedArray);
        const developerAssistant = new ExecutionManager(parsedArray , projectId);
        await developerAssistant.executeTasks(appName, userId);
        await projectCoordinator.logStep('All tasks have been executed.');
    } catch (error) {
        const newJSon =  await projectCoordinator.JSONFormatter(jsonArrayString,`Error parsing JSON:${error}` )
        const newArray = await findFirstArray(newJSon)
        const developerAssistant = new ExecutionManager(newArray, projectId);
        await developerAssistant.executeTasks(appName, userId);
        await projectCoordinator.logStep('All tasks have been executed.');
    }
}

module.exports = {
    handleActions,
    handleIssues,
    handleUserReply,
};
