const aIChatCompletion = require('./ai_provider');
const ProjectCoordinator = require('./classes/projectCoordinator');
const UserModel = require('./models/User.schema');
const { extractJsonArray } = require('./utilities/functions');
const {
    generateDetailedPrompt,
    generateWebAppPrompt,
} = require('./utilities/promptUtils');
const ExecutionManager = require('./classes/executionManager');

async function createTaskObjects(projectId, userId, projectName) {
    const projectCoordinator = new ProjectCoordinator(userId, projectId);

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

    async function generateChatResponse(conversationContext, taskContent) {
        const systemPrompt = `Conversation History:\n${conversationContext}`;
        systemPrompt;
        return await aIChatCompletion({
            userId: userId,
            systemPrompt: systemPrompt,
            userMessage: taskContent,
        });
    }

    async function consolidateResponses() {
        const tasks = await createTaskList();
        const newArray = await findFirstArray(tasks);
        const developerAssistant = new ExecutionManager(
            newArray,
            projectId,
            userId
        );
        await developerAssistant.executeTasks();
    }

    async function getConversationHistory(userId, projectId) {
        const conversations = await UserModel.getUserMessages(
            userId,
            projectId
        );
        return conversations.map(({ role, content }) => ({ role, content }));
    }

    async function createTaskList() {
        const conversationHistory = await getConversationHistory(
            userId,
            projectId
        );

        const prompt = generateWebAppPrompt(conversationHistory);

        const rawArray = await aIChatCompletion({
            userId: userId,
            systemPrompt: prompt,
        });
        const jsonArrayString = await extractJsonArray(rawArray);
        try {
            const parsedArray = JSON.parse(jsonArrayString);

            return parsedArray;
        } catch (error) {
            const newJson = await projectCoordinator.JSONFormatter(
                jsonArrayString,
                `Error parsing JSON:${error}`
            );
            const cleanedArray = await findFirstArray(newJson);
            return cleanedArray;
        }
    }

    // Entry point for the function
    await consolidateResponses();
}

module.exports = {
    createTaskObjects,
};
