require('dotenv').config();
const OpenAI = require('openai');
const ProjectCoordinator = require('./projectCoordinator');
const User = require('./User.schema');
const { extractJsonArray } = require('./utilities/functions');
const {
    generateDetailedPrompt,
    generateWebAppPrompt,
} = require('./promptUtils');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });




async function createTaskObjects(projectId, userId) {
    const projectCoordinator = new ProjectCoordinator(userId, projectId);

    // Utility function for OpenAI API calls
    async function openAiChatCompletion(
        systemPrompt,
        userMessage = '',
        options = {}
    ) {
    try {
        const messages = [{ role: 'system', content: systemPrompt }];
        if (userMessage) {
            messages.push({ role: 'user', content: userMessage });
        }

        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            ...options,
            messages,
        });
        const rawResponse = response.choices[0].message.content.trim();
         User.addTokenCountToUserSubscription(userId, rawResponse);
        return rawResponse;
    } catch (error) {
        console.error('OpenAI API Error:', error);
    }
}

    async function findFirstArray(data) {
        if (Array.isArray(data)) return data;

        if (typeof data === 'object' && data !== null) {
            const firstArray = Object.values(data).find(Array.isArray);
            if (firstArray) return firstArray;
        }

        return [data];
    }

    async function getConversationHistory() {
        const conversations = await User.getUserMessages(userId, projectId);
        return conversations.map(({ role, content }) => ({ role, content }));
    }

    async function getSelectedProject() {
        const projects = User.getUserProject(userId, projectId);
        return projects[0];
    }

    async function generateChatResponse(conversationContext, taskContent) {
        const systemPrompt = `Conversation History:\n${conversationContext}`;
        return await openAiChatCompletion(systemPrompt, taskContent);
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
            const logs = User.getProjectLogs(userId, projectId);
        const detailedPrompt = generateDetailedPrompt(logs);
        User.addTokenCountToUserSubscription(userId, detailedPrompt);

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
        const projectOverView = await getDescriptionResponse();
        const conversationHistory = await getConversationHistory();
        const conversationContext = conversationHistory
            .map(({ role, content }) => `${role}: ${content}`)
            .join('\n');
        // use sentiment analysis from conversationContext and projectOverView to find out if the task requres a server created, if so return true, if not return false
        //if false do nothing
        //if true call the function connect server
        const tasks = await createTaskList();
        const newArray = await findFirstArray(tasks);
        await projectCoordinator.generateTaskList(newArray, userId);
    }

    async function createTaskList() {
        const projectOverView = await getDescriptionResponse();
        const selectedProject = await getSelectedProject();
        const imageArray = await projectCoordinator.fetchImages();

        let { imageId } = selectedProject;
        const selectedImage = imageId
            ? imageArray.find((image) => image._id === imageId)
            : null;

        const prompt = generateWebAppPrompt(projectOverView);

        User.addTokenCountToUserSubscription(userId, prompt);

        const rawArray = await openAiChatCompletion(prompt);
        const jsonArrayString = extractJsonArray(rawArray);

        try {
            const parsedArray = JSON.parse(jsonArrayString);
            return parsedArray;
        } catch (error) {
            const newJson = await projectCoordinator.JSONFormatter(
                jsonArrayString,
                `Error parsing JSON:${error}`
            );
            return newJson;
        }
    }

    // Entry point for the function
    await consolidateResponses();
}

module.exports = {
    createTaskObjects,
};
