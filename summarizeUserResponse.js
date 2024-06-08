require('dotenv').config();
const OpenAI = require('openai');
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});
const ProjectCoordinator = require('./projectCoordinator');
const globalState = require('./globalState');
const User = require('./User.schema');

async function summarizeUserResponse(projectId, userId) {
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

    async function getSelectedImage(selectedProject) {
        const imageArray = await projectCoordinator.fetchImages();
        return selectedProject.imageId
            ? imageArray.find((image) => image.id === selectedProject.imageId)
            : null;
    }

    async function generateChatResponse(conversationContext, taskContent, selectedImage = null) {
        const messages = [
            {
                role: 'system',
                content: `Conversation History:\n${conversationContext}`,
            },
            { role: 'user', content: taskContent },
        ];

        if (selectedImage) {
            messages.push({
                role: 'user',
                content: [
                    { type: 'text', text: `\n${taskContent}` },
                    { type: 'image_url', image_url: { url: selectedImage.url } },
                ],
            });
        }

        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: messages,
        });

        return response.choices[0].message.content;
    }

    async function getDescriptionResponse() {
        const conversationHistory = await getConversationHistory();
        const selectedProject = await getSelectedProject();
        const selectedImage = await getSelectedImage(selectedProject);
        
        const conversationContext = conversationHistory
            .map(({ role, content }) => `${role}: ${content}`)
            .join('\n');

            const detailedPrompt = `
            You are an AI agent within a Node.js autonomous system specializing in creating elegant and functional HTML web applications using Tailwind CSS. Your task is to interpret user prompts, which may include text descriptions and image templates, to deliver high-quality web applications that align with the user's vision and design preferences.
            
            Your role is to provide a comprehensive and concise summary of the user's requirements, ensuring clarity and precision. Improve and refine the user request to ensure it accurately reflects the desired outcome and can be translated into a functional and aesthetically pleasing web application.
            `;
            

        const projectDescription = await generateChatResponse(conversationContext, detailedPrompt, selectedImage);

        User.addMessage(userId, [{ role: 'system', content: projectDescription }], projectId);

        globalState.setProjectOverView(userId, projectDescription);

        selectedProject.projectOverView = projectDescription;
        User.addProject(userId, selectedProject);

        return projectDescription;
    }

    async function consolidateResponses() {
        const tasks = await createTaskList();
        await projectCoordinator.generateTaskList(tasks, userId);
    }


    async function createTaskList() {
        const projectOverView = await getDescriptionResponse();
        const prompt = `
        Using HTML and Tailwind CSS (no additional CSS!), create a fully functional web application based on the provided project description and site map. Structure the code in a JSON array of objects, where each object represents a separate file. Each object should include the properties: name, extension, and content.

        Project Description: ${projectOverView}

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
            }
            // Add other files as needed
        ]

        Instructions:
        1. Include all referenced pages or files as objects in the JSON array.
        2. Use Tailwind CSS for styling.
        3. Ensure the JavaScript file handles the application logic.
        4. Do not omit any necessary tasks, files, or references for the application to function correctly.
        5. Provide all required files (HTML, JavaScript, etc.) as separate objects in the JSON array.

        Important:
        - Take your time to think through each step carefully.
        - Ensure the HTML and JavaScript files are included and correctly referenced.
        - Ensure the code is fully functional and production-ready.
        - Return only the JSON array of objects as the final output.

        Ensure the JSON array contains multiple objects for each file required. Do not return just one object.
        `;


            const response = await openai.chat.completions.create({
                model: 'gpt-4o',
                messages: [
                    {
                        role: 'system',
                        content: prompt,
                    },
                ],
            });

             const  rawArray = response.choices[0].message.content;
             try {
                // Extract the JSON array from the response using a regular expression
                const jsonArrayMatch = rawArray.match(/\[\s*{[\s\S]*?}\s*]/);
                if (!jsonArrayMatch) {
                    throw new Error('No JSON array found in the response.');
                }
        
                const jsonArrayString = jsonArrayMatch[0];
                // Parse the JSON string into a JavaScript array
                const parsedArray = JSON.parse(jsonArrayString);
                return parsedArray;
            } catch (error) {
                console.error('Error parsing JSON:', error);
                throw new Error('Failed to parse JSON response from OpenAI.');
            }
           
        }

    // Entry point for the function
    await consolidateResponses();
}

module.exports = {
    summarizeUserResponse,
};
