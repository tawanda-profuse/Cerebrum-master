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
    You are an AI agent part of a Node.js autonomous system that creates beautiful and elegant HTML web applications from user prompts. Your primary role is advanced sentiment analysis to ensure compliance with system rules.

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

async function handleIssues(message, projectId, userId) {
    const selectedProject = User.getUserProject(userId, projectId)[0];
let { taskList, projectOverview, appPath, appName } = selectedProject;
const taskProcessor = new TaskProcessor(
    appPath,
    appName,
    projectOverview,
    projectId,
    taskList
);


const listAssets = () => {
    const dynamicName = appName;
    const workspaceDir = path.join(__dirname, 'workspace');
    const projectDir = path.join(workspaceDir, projectId);
    const assetsDir = path.join(projectDir, dynamicName, 'assets');

    if (!fs.existsSync(assetsDir)) {
        throw new Error('Assets directory does not exist.');
    }

    return fs.readdirSync(assetsDir);
};

try {
    // Contextualize AI's role and current tasks
    const assets = listAssets();
    let aiContext = {
        role: 'system',
        content: `You are an AI agent in a Node.js autonomous system that creates elegant HTML web projects from user prompts, utilizing Tailwind CSS for styling. Your specialized role is to resolve issues in the application. Look at the issue presented. Your task is to generate specific tasks in JSON format to address these things effectively, strictly adhering to the provided project overview and task list. Take your time and use a chain of thought to ensure accuracy.

        Project Overview: ${JSON.stringify(projectOverview)}

        Task List: ${JSON.stringify(taskList, null, 2)}

        Current assets in the project's assets folder: ${JSON.stringify(assets, null, 2)}

        Guidelines for Task Generation:

        Analyze Entire Task List and Dependencies:
        Focus on the task list, current files in the assets folder, the HTML, CSS, and JS files, and project overview to understand the required components and functionalities.
        Pay close attention to the componentCodeAnalysis and toDo properties in the task list.
        Identify dependencies to ensure all necessary components are accounted for.

        Task Generation for Issue Resolution:
        Generate tasks in JSON format based on the project overview and task list requirements.
        Tasks may involve modifying existing components or files, generating missing images, or installing a new library.
        Ensure each task is actionable, clear, and directly related to the project's requirements.
        Ensure the output is always an array of objects, even if only one task is generated.

        Verify Component Existence in Task List:
        Confirm the component or issue is explicitly mentioned in the task list before creating a task.

        Strict Component Handling:
        Only 'Modify' tasks for components explicitly listed in the task list.
        Never create new components and files or modify files that are not mentioned in the task list.
        Align tasks with the project's original specifications and intentions.

        Ensure Single File Reference:
        Each task must reference only one file name from the task list.
        Ensure the fileName field contains the exact name of a single file listed in the task list.

        Decision Making Based on Task List Analysis:
        Create tasks that align with the project overview and task list to address the issues.
        Do not consider components or issues not listed in the task list for task generation.

        Handling Missing or Misspelled Assets:
        Create tasks to locate or correct missing or misspelled assets.
        Example: If an image asset is missing, create a task to either generate the image based on the import name

        Adding Images to the Project:
        Generate an image using AI
        Example: If the user wants an image generated, create a task to describe the image in detail and generate it using an image generation API.

        taskType: Type of task ('Modify', 'Generate', 'Install').
        promptToCodeWriterAi: A prompt for the code writer AI to generate the required code or modifications.
        fileName: The name of the file to be modified or where the new component is to be created.
        extensionType: The file extension (e.g., 'html', 'css', 'js').
        Example Correct Usage:
        [
            {
                "taskType": "Modify",
                "promptToCodeWriterAi": "Update the structure and content of about.html to improve layout and readability.",
                "fileName": "about",
                "extensionType": "html"
            }
            ,
        {
        "taskType": "Modify",
        "promptToCodeWriterAi": "Correct the path and name of the missing 'logo.png' asset in the HTML file.",
        "fileName": "index",
        "extensionType": "html"
        },
        {
        "taskType": "Generate",
        "promptToCodeWriterAi": "Generate a placeholder image for the missing 'banner.png' asset.",
        "fileName": "banner",
        "extensionType": "png"
        }
        ]

        Avoid Incorrect Usage:
        
        Never ever suggest creating additional components or files.
        Never create a new component or file outside the existing ones.
        Do not use vague or multiple file names like 'globalTheme or App'.
        Ensure the fileName corresponds to a specific file listed in the task list.
        Apart from the main HTML, CSS, and JS files, only the components or files listed in the Task List are the ones present in the project's directory.
        For any imports not listed in the Task List, adjust the code to use alternative logic that relies solely on the components and files present in the Task List.

        *TAKE YOUR TIME AND ALSO MENTALLY THINK THROUGH THIS STEP BY STEP TO PROVIDE THE MOST ACCURATE AND EFFECTIVE RESULT*
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
                temperature: 0,
                response_format: { type: 'json_object' },
            })
        );
        const res = response.choices[0].message.content.trim();
        let arr = JSON.parse(res);
        const aiResponseTasks = await findFirstArray(arr);
        await Promise.all(
            aiResponseTasks.map((task) =>
                taskProcessor.processTasks(userId, task)
            )
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
