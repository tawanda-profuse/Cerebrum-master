require('dotenv').config();
const OpenAI = require('openai');
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});
const ProjectCoordinator = require('./projectCoordinator');
const User = require('./User.schema');

async function createTaskObjects(projectId, userId) {
    const projectCoordinator = new ProjectCoordinator(openai, projectId);

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

    async function getConversationHistory() {
        const conversations = await User.getUserMessages(userId, projectId);
        return conversations.map(({ role, content }) => ({ role, content }));
    }

    async function getSelectedProject() {
        const projects = User.getUserProject(userId, projectId)[0];
        return projects;
    }

    async function generateChatResponse(conversationContext, taskContent) {
        const msg = [
            {
                role: 'system',
                content: `Conversation History:\n${conversationContext}`,
            },
            { role: 'user', content: taskContent },
        ];

        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: msg,
        });

        return response.choices[0].message.content;
    }

    async function getDescriptionResponse() {
        const conversationHistory = await getConversationHistory();
        const selectedProject = await getSelectedProject();
        const imageArray = await projectCoordinator.fetchImages();

        let { imageId } = selectedProject;
        const selectedImage = imageId
            ? imageArray.find((image) => image._id === imageId)
            : null;

        const conversationContext = conversationHistory
            .map(({ role, content }) => `${role}: ${content}`)
            .join('\n');

        const detailedPrompt = `
            You are an AI agent within a Node.js autonomous system specializing in creating elegant and functional HTML web applications using Tailwind CSS. Your task is to interpret user prompts,to deliver high-quality HTML-Tailwind web applications that align with the user's vision and design preferences.
            
            Your role is to provide a comprehensive and concise summary of the user's requirements, ensuring clarity and precision. Improve and refine the user request to ensure it accurately reflects the desired outcome and can be translated into a functional and aesthetically pleasing web application. At any point if there is any need for any mock data mention the creation of a data.json file.
            `;

        const projectDescription = await generateChatResponse(
            conversationContext,
            detailedPrompt,
            selectedImage
        );

        User.addMessage(
            userId,
            [{ role: 'system', content: projectDescription }],
            projectId
        );

        selectedProject.projectOverView = projectDescription;
        User.addProject(userId, selectedProject);

        return projectDescription;
    }

    async function consolidateResponses() {
        const tasks = await createTaskList();
        const newArray = await projectCoordinator.findFirstArray(tasks);
        await projectCoordinator.generateTaskList(newArray, userId);
    }

    async function createTaskList() {
        const projectOverView = await getDescriptionResponse();
        const selectedProject = User.getUserProject(userId, projectId)[0];
        const imageArray = await projectCoordinator.fetchImages();

        let { imageId } = selectedProject;
        const selectedImage = imageId
            ? imageArray.find((image) => image._id === imageId)
            : null;

        const prompt = `
            You will be creating a fully functional HTML-Tailwind web application based on a provided project description and. Your task is to structure the application's code as a JSON array of objects, where each object represents a separate file (e.g., HTML, JavaScript) with properties for the file name, extension, and content.

        Here is the project description: ${projectOverView}

        Example JSON structure:
              [
                  {
                      "name": "index",
                      "extension": "html",
                      "content": "full HTML code here"
                  },
                  {
                      "name": "script",
                      "extension": "js",
                      "content": "full JavaScript code here"
                  },
                    {
                        "name": "data",
                        "extension": "json",
                        "content": "mock data here"
                    }
                  // Add other files as needed
              ]


        When creating the HTML-Tailwind web application, adhere to the following requirements:
        - Use HTML and Tailwind CSS for the structure and styling of the application. Do not create separate CSS files or use any additional CSS frameworks.
        - Structure the application's code as a JSON array of objects, with each object representing a separate file (e.g., HTML, JavaScript).
        - Include all referenced pages or files as objects in the JSON array, ensuring that the application can function correctly without any missing components.
        - Use Tailwind CSS for all styling purposes, and ensure that the JavaScript file handles the application's logic.
        - Provide all required files (HTML, JavaScript, etc.) as separate objects within the JSON array.
        - Do not attempt to make any network or API calls unless specifically instructed to do so in the project description.
        - Ensure that the code is fully functional, production-ready, and does not contain any placeholders or omitted sections.

        When generating the application:
        - Take your time to think through each step carefully, ensuring that all files are correctly referenced and included.
        - At any point if there is any need for any mock data, create a data.json file and use JavaScript to pass the data to the Pages.
        - Return only the JSON array of objects as the final output, without any additional comments or explanations.

        Remember, the JSON array should contain multiple objects, each representing a separate file required for the application to function properly. Do not return just a single object.

        Reflection:
        Before you begin, take a moment to carefully review the project description to ensure you have a clear understanding of the user's requirements. Plan out the necessary components and structure of the application, considering how to best organize the code using HTML, Tailwind CSS, and JavaScript. 
  

        Result:
        Return the fully functional web application as a JSON array of objects, adhering to the specified requirements and ensuring that all necessary files and components are included. The application should be production-ready and align with the user's expectations based on the provided project description.
    
            `;

        const msg = [
            {
                role: 'system',
                content: prompt,
            },
        ];


        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: msg,
        });

        const rawArray = response.choices[0].message.content;

        const startIndex = rawArray.indexOf('[');
        const endIndex = rawArray.lastIndexOf(']') + 1;

        // Ensure that we found a valid JSON array
        if (startIndex === -1 || endIndex === -1) {
            console.log('No JSON array found in the response.');
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
            return newJSon;
        }
    }

    // Entry point for the function
    await consolidateResponses();
}

module.exports = {
    createTaskObjects,
};
