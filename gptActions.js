require('dotenv').config();
const path = require('path');
const fsPromises = require('fs').promises;
const fs = require('fs');
const OpenAI = require('openai');
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});
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
    const taskProcessor = new TaskProcessor(
        appPath,
        appName,
        projectOverView,
        projectId,
        taskList
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

    try {
        // Contextualize AI's role and current tasks
        const assets = listAssets();
        let aiContext = {
            role: 'system',
            content: `You are an AI agent in a Node.js autonomous system that creates elegant HTML web projects from user prompts, utilizing Tailwind CSS for styling. Your specialized role is to resolve issues and modification requests in the application. Look at the things presented. Your task is to generate specific tasks in JSON format to address these things effectively, strictly adhering to the provided project overview and task list. Take your time and use a chain of thought to ensure accuracy.

        Project Overview: ${projectOverView}

        Conversation Context: ${conversationContext}

        Task List: ${JSON.stringify(taskList, null, 2)}

        Current assets in the project's assets folder: ${JSON.stringify(assets, null, 2)}

        Guidelines for Task Generation:

        1. Analyze Entire Task List and Dependencies:
        Focus on the task list, current files in the assets folder, the HTML, and JS files, conversation context and project overview to understand the required components and functionalities.
        For every task, pay close attention to the content property which gives you the current overview of the code in the task list.
        Identify dependencies to ensure all necessary pages and files are accounted for.

        2. Task Generation for Issue Resolution:
        Generate tasks in JSON format based on the project overview, conversation context, and task list requirements.
        Tasks may involve modifying existing components or files, generating missing images, or creating new HTML or JS pages and files.
        Ensure each task is actionable, clear, and directly related to the project's requirements.
        When you create a new file or page, ensure that the corresponding parent file or page is updated accordingly. This includes creating a modification task for the parent to reflect the changes.
        Ensure the output is always an array of objects, even if only one task is generated.

        3. Verify Component Existence in Task List:
        Before adding a task, confirm that the page, file, or issue is explicitly mentioned in the task list.

        4. Strict Component Handling:
        Only create 'Modify' tasks for pages or files that are explicitly listed in the task list.
        Never modify files that are not mentioned in the task list.
        Align tasks with the project's original specifications and user intentions.

        5. Ensure Single File Reference:
        Each task must reference only one file name from the task list.
        For modifications, ensure the fileName field contains the exact name of a single file listed in the task list.

        6. Decision Making Based on Task List Analysis:
        Create tasks that align with the project overview, conversation context, and task list to address the issues.
        Do not consider components or issues not listed in the task list for task generation.

        7. Handling Missing or Misspelled Assets:
        Create tasks to locate or correct missing or misspelled assets.
        Example: If an image asset is missing, create a task to either generate the image based on the import name.

        8. Adding Images to the Project:
        Generate an image using AI.
        Example: If the user wants an image generated, create a task to describe the image in detail and generate it using an image generation API.

        9. Task Creation and Associating Task Modifications:
        - When creating a new HTML or JS file:
          - Create a 'Generate' task for the new file with a detailed prompt.
          - Create a 'Modify' task for the parent file to include references to the new file.
          - Ensure the new file and parent file are both listed in the task list. 

        taskType: Type of task ('Modify', 'Generate', 'Install').
        promptToCodeWriterAi: A detailed prompt for the code writer AI to generate the required code or modifications.
        fileName: The name of the file to be modified or where the new component is to be created.
        extensionType: The file extension (e.g., 'html', 'css', 'js').

        Example Correct Usage:

          [
            {
                "taskType": "Create",
                "promptToCodeWriterAi": "Create a new HTML page for the contact section with a form for users to submit inquiries.",
                "fileName": "contact",
                "extensionType": "html"
            },
            {
                "taskType": "Modify",
                "promptToCodeWriterAi": "Update the 'navigation.html' file to include a link to the newly created 'contact.html' page.",
                "fileName": "navigation",
                "extensionType": "html"
            },
            {
                "taskType": "Modify",
                "promptToCodeWriterAi": "Update the structure and content of 'about.html' to improve layout and readability.",
                "fileName": "about",
                "extensionType": "html"
            },
            {
                "taskType": "Modify",
                "promptToCodeWriterAi": "Correct the path and name of the missing 'logo.png' asset in the 'index.html' file.",
                "fileName": "index",
                "extensionType": "html"
            },
            {
                "taskType": "Generate",
                "promptToCodeWriterAi": "Generate a placeholder image for the missing 'banner.png' asset.",
                "fileName": "banner",
                "extensionType": "png"
            },
            {
                "taskType": "Modify",
                "promptToCodeWriterAi": "Update 'script.js' to include the code for handling form submissions from the new 'contact.html' page.",
                "fileName": "script",
                "extensionType": "js"
            }
        ]

        Avoid Incorrect Usage:

        Ensure the fileName corresponds to a specific file listed in the task list.
        When creating a new page or file, ensure that the file name corresponds to the specific file referenced in the parent file. Additionally, make sure all pages or files are located in the same directory.

        *TAKE YOUR TIME AND THINK THROUGH THIS STEP BY STEP TO PROVIDE THE MOST ACCURATE AND EFFECTIVE RESULT*
    `,
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
        const jsonArrayMatch = rawArray.match(/\[\s*{[\s\S]*?}\s*]/);
        if (!jsonArrayMatch) {
            throw new Error('No JSON array found in the response.');
        }

        const jsonArrayString = jsonArrayMatch[0];
        // Parse the JSON string into a JavaScript array
        const parsedArray = JSON.parse(jsonArrayString);

        console.log('array', parsedArray);
        await Promise.all(
            parsedArray.map((task) => taskProcessor.processTasks(userId, task))
        );
    } catch (error) {
        console.error('Error in AI Assistant:', error);
    }
}

module.exports = {
    handleActions,
    handleIssues,
    handleUserReply,
};
