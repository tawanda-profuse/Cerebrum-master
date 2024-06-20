require('dotenv').config();
const OpenAI = require('openai');
const ProjectCoordinator = require('./projectCoordinator');
const UserModel = require('./User.schema');
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
            await UserModel.addTokenCountToUserSubscription(
                userId,
                rawResponse
            );
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
        const conversations = await UserModel.getUserMessages(
            userId,
            projectId
        );
        return conversations.map(({ role, content }) => ({ role, content }));
    }

    async function getSelectedProject() {
        const projects = await UserModel.getUserProject(userId, projectId);
        return projects;
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
        const logs = await UserModel.getProjectLogs(userId, projectId);
        const detailedPrompt = generateDetailedPrompt(logs);
        await UserModel.addTokenCountToUserSubscription(userId, detailedPrompt);

        const projectDescription = await generateChatResponse(
            conversationContext,
            detailedPrompt,
            selectedImage
        );

        await UserModel.addMessage(
            userId,
            [{ role: 'system', content: projectDescription }],
            projectId
        );
        await UserModel.addProjectOverview(
            userId,
            projectId,
            projectDescription
        );

        return projectDescription;
    }

    async function consolidateResponses() {
        const tasks = await createTaskList();
        const newArray = await findFirstArray(tasks);
        await projectCoordinator.generateTaskList(newArray, userId);
    }

    async function createTaskList() {
        const projectOverView = await getDescriptionResponse();

        const prompt = generateWebAppPrompt(projectOverView);

        await UserModel.addTokenCountToUserSubscription(userId, prompt);

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
