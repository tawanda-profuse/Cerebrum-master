require('dotenv').config();
const path = require('path');
const fs = require('fs');
const OpenAI = require('openai');
const ExecutionManager = require('./executionManager');
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

    1. New Web  Application: If the message indicates a request to create a new web  application, initiate the application creation process and RETURN ONLY ONE WORD: "createApplication".

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
        const systemPrompt = `You are an Ai agent part of a node js autonomous system that create web applications  from user prompts. Your role is to respond to the user
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

async function filePicker(projectId) {
    const projectCoordinator = new ProjectCoordinator(openai, projectId);
    const workspaceDir = path.join(__dirname, 'workspace');
    const appPath = path.join(workspaceDir, projectId);
    const prompt = ``;
    // Generate AI response based on context
    const response = await exponentialBackoff(() =>
        openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                {
                    role: 'system',
                    content: prompt,
                },
            ]
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

        return parsedArray;
    } catch (error) {
        const newJSon = await projectCoordinator.JSONFormatter(
            jsonArrayString,
            `Error parsing JSON:${error}`
        );
        const newArray = await findFirstArray(newJSon);
        return newArray;
    }
}

async function handleIssues(message, projectId, userId) {
    const selectedProject = User.getUserProject(userId, projectId)[0];
    let { taskList, projectOverView, appName } = selectedProject;
    const projectCoordinator = new ProjectCoordinator(openai, projectId);
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

    // Contextualize AI's role and current tasks
    const assets = listAssets();

    let aiContext = {
        role: 'system',
        content: `
            Project Overview:
            ${projectOverView}

            Conversation Context:
            ${conversationContext}

            Task List:
            ${JSON.stringify(taskList, null, 2)}

            Current Assets in the Project's Assets Folder:
            ${JSON.stringify(assets, null, 2)}

            Your task is to generate specific tasks in JSON format to address the modification requests for the provided HTML or EJS application. Follow these steps:

            1. Carefully analyze the Project Overview, Conversation Context, user request, and Task List to understand the required components and functionalities. Pay close attention to the content property in the Task List, which provides an overview of the code. Identify dependencies to ensure all necessary pages and files are accounted for.

            2. Generate tasks in JSON format based on the project requirements. Tasks may involve modifying existing components or files, generating missing images, or creating new HTML,  EJS  or JS pages and files. Ensure each task is actionable, clear, and directly related to the project's requirements.

            3. When creating a new file or page, ensure that the corresponding parent file or page is updated accordingly, including creating a modification task for the parent to reflect the changes. Ensure the output is always an array of objects, even if only one task is generated.

            4. Only create 'Modify' tasks for pages or files that are explicitly listed in the Task List. Never modify files that are not mentioned in the task list. Align tasks with the project's original specifications and user intentions.

            5. For modifications, ensure the fileName field contains the exact name of a single file listed in the Task List.

            6. Create tasks that align with the Project Overview, Conversation Context, user request, and Task List to address the issues.

            7. Handle missing or misspelled assets by creating tasks to locate or correct them. For example, if an image asset is missing, create a task to either generate the image based on the import name.

            8. If the user wants an image generated, create a task to describe the image in detail and generate it using an image generation API.

            9. When creating a new HTML,EJS or JS file:
            - Create a 'Generate' task for the new file with a detailed prompt.
            - Create a 'Modify' task for the parent file to include references to the new file.
            - Ensure the new file and parent file are both listed in the Task List.

            10. Use the following JSON structure for tasks:
           [
                {
                "taskType": "Create",
                "promptToCodeWriterAi": "Create a new HTML page for the contact section with a form for users to submit inquiries. Include input fields for name, email, subject, and message. Add appropriate labels and placeholders for each input field. Use CSS to style the form with a visually appealing layout, including proper spacing, font styles, and colors. Adjust the following CSS properties: margin, padding, font-family, font-size, color, and background-color.",
                "fileName": "contact",
                "extensionType": "html"
                },
                {
                "taskType": "Modify",
                "promptToCodeWriterAi": "Update the 'navigation.html' file to include a link to the newly created 'contact.html' page. Ensure the link is properly placed within the navigation menu and has a consistent style with other navigation links. Adjust the following CSS properties for the navigation link: color, font-weight, text-decoration, and hover effects.",
                "fileName": "navigation",
                "extensionType": "html"
                },
                {
                "taskType": "Modify",
                "promptToCodeWriterAi": "Update the structure and content of 'about.html' to improve layout and readability. Use appropriate heading tags (h1, h2, etc.) to create a hierarchical structure. Add relevant images and format the text into paragraphs. Use CSS to adjust the following properties: line-height, text-align, margin, padding, and max-width for optimal readability.",
                "fileName": "about",
                "extensionType": "html"
                },
                {
                "taskType": "Modify",
                "promptToCodeWriterAi": "Correct the path and name of the missing 'logo.png' asset in the 'index.html' file. Ensure the file extension and path are accurate. If the logo is not available, consider creating a placeholder logo using CSS. Adjust the following CSS properties for the logo: width, height, background-color, and text styles.",
                "fileName": "index",
                "extensionType": "html"
                },
                {
                "taskType": "Generate",
                "promptToCodeWriterAi": "Generate a placeholder image for the missing 'banner.png' asset. Use an appropriate image size and resolution suitable for the banner section. Consider using a solid color background with text overlay or a simple pattern. Optimize the image for web usage to ensure fast loading times.",
                "fileName": "banner",
                "extensionType": "png"
                },
                {
                "taskType": "Modify",
                "promptToCodeWriterAi": "Update 'script.js' to include the code for handling form submissions from the new 'contact.html' page. Implement the following logic: \n1. Retrieve the form data entered by the user.\n2. Validate the form fields to ensure they are not empty and the email is in a valid format.\n3. If the form data is valid, send an AJAX request to the server to submit the form data.\n4. Display a success message to the user upon successful form submission.\n5. If the form data is invalid or the submission fails, display appropriate error messages to the user.\n6. Clear the form fields after successful submission.",
                "fileName": "script",
                "extensionType": "js"
                }
            ]

            11. Take your time to think through each step carefully. All pages and files are in the same directory, with images in the './assets' folder. Ensure the HTML or EJS and JavaScript files are included and correctly referenced. Ensure the code is fully functional and production-ready.

            12. Return only the JSON array of objects as the final output and nothing else!

            <thinkingProcess>
            Before generating the tasks, take a moment to carefully consider the following:
            1. Analyze the project overview, conversation context, user request, and task list to gain a comprehensive understanding of the project requirements and dependencies.
            2. Identify the specific components, files, or assets that need to be modified, generated, or created based on the provided information.
            3. Determine the most effective approach to address each modification request, whether it involves modifying existing code, generating new files, or handling missing assets.
            4. Ensure that the generated tasks are clear, actionable, and aligned with the project's original specifications and user intentions.
            </thinkingProcess>

            <taskFormat>
            taskName: Type of task ('Modify', 'Generate', 'Create').
            promptToCodeWriterAi: Explanation of the code to be written, be as detailed as possible
            fileName: The name of the file to be modified or where the new component is to be created.
            extensionType: The file extension (e.g., 'html', 'css', 'js', ejs).
            </taskFormat>

            <finalInstructions>
            Generate the tasks in JSON format based on the provided project overview, conversation context, user request, and task list. Ensure that each task addresses a specific modification request and aligns with the project requirements. Include all necessary files, references, and assets to maintain code quality, functionality, and user experience. Return the tasks as a JSON array of objects, following the specified format. Take your time to think through each step carefully and ensure the code is fully functional and production-ready.
            </finalInstructions>
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
        await Promise.all(
            parsedArray.map((task) => taskProcessor.processTasks(userId, task))
        );
    } catch (error) {
        const newJSon = await projectCoordinator.JSONFormatter(
            jsonArrayString,
            `Error parsing JSON:${error}`
        );
        const newArray = await findFirstArray(newJSon);
        await Promise.all(
            newArray.map((task) => taskProcessor.processTasks(userId, task))
        );
    }
}

module.exports = {
    handleActions,
    handleIssues,
    handleUserReply,
};
