require('dotenv').config();
const OpenAI = require('openai');
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});
const ProjectCoordinator = require('./projectCoordinator');
const User = require('./User.schema');
const { extractJsonArray } = require('./helper.utils');
const {
    generateDetailedPrompt,
    generateWebAppPrompt,
} = require('./promptUtils');

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

        const detailedPrompt = generateDetailedPrompt();

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

        const prompt = generateWebAppPrompt(projectOverView);

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

        const jsonArrayString = extractJsonArray(rawArray);

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
