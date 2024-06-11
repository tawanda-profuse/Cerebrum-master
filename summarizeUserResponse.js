require('dotenv').config();
const OpenAI = require('openai');
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});
const ProjectCoordinator = require('./projectCoordinator');
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

    async function generateChatResponse(
        conversationContext,
        taskContent,
        selectedImage
    ) {

        const imageMsg = [
            {
                role: 'user',
                content: [
                    {
                        type: 'text',
                        text: `Conversation History:\n${conversationContext}\n${taskContent}\n - Do not copy the actual information or data in the template or images but use the information and data provided in the Conversation History.\n - The template is just a visual and styling guide; never use information or data from it.\n - If the user's information is not enough, generate the information based on your interpretation of the user's requirements.` ,
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

        const msg = [
            {
                role: 'system',
                content: `Conversation History:\n${conversationContext}`,
            },
            { role: 'user', content: taskContent },
        ];

        selectedImage.id !== null ? console.log('found image') : console.log('No images found')
        
        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: selectedImage.id !== null ? imageMsg : msg,
        })

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
            You are an AI agent within a Node.js autonomous system specializing in creating elegant and functional HTML web applications using Tailwind CSS. Your task is to interpret user prompts, which may include text descriptions and image templates, to deliver high-quality web applications that align with the user's vision and design preferences.
            
            Your role is to provide a comprehensive and concise summary of the user's requirements, ensuring clarity and precision. Improve and refine the user request to ensure it accurately reflects the desired outcome and can be translated into a functional and aesthetically pleasing web application.
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
        const newArray = await projectCoordinator.findFirstArray(tasks)
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
            ${selectedImage.id !== null ? `The image/s serves as a template or  visual guide, to give you a concrete reference of the user's vision and design preferences. It ensures that the resulting application aligns closely with the user's expectations. Using HTML and Tailwind CSS (no additional CSS!), create a fully functional web application based on the provided project description and site map. Structure the code in a JSON array of objects, where each object represents a separate file. Each object should include the properties: name, extension, and content.` : `Using HTML and Tailwind CSS (no additional CSS!), create a fully functional web application based on the provided project description and site map. Structure the code in a JSON array of objects, where each object represents a separate file. Each object should include the properties: name, extension, and content.`} 
      
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
              6. Unless specifically instructed to call an endpoint, do not attempt to make any network or API calls.
              7. Always use Tailwind, never attempt to create css files.
              8. Never use placeholders, or ommit some code. Return fully functional production ready code.
      
      
             Important: 
            - Take your time to think through each step carefully.
            - Ensure the HTML and JavaScript files are included and correctly referenced.
            - Ensure the code is fully functional and production-ready.
            - Return only the JSON array of objects as the final output and nothing else!
            ${selectedImage.id !== null ? `
            - Do not copy the actual information or data in the template or images but use the information and data provided in the Project Description.
            - The template is just a visual and styling guide; never use information or data from it.
            - If the user's information is not enough, generate the information based on your interpretation of the user's requirements.` : ''}
            Ensure the JSON array contains multiple objects for each file required. Do not return just one object.
            `;


        const imageMsg = [
            {
                role: 'user',
                content: [
                    {
                        type: 'text',
                        text: `${prompt}`,
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

        const msg = [
            {
                role: 'system',
                content: prompt,
            },
        ];

        selectedImage.id !== null ? console.log('found image') : console.log('No images found')

        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: selectedImage.id !== null ? imageMsg : msg,
        });

        const rawArray = response.choices[0].message.content;

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
           const newJSon =  await projectCoordinator.JSONFormatter(jsonArrayString,`Error parsing JSON:${error}` )
           return newJSon
        }
    }

    // Entry point for the function
    await consolidateResponses();
}

module.exports = {
    summarizeUserResponse,
};
