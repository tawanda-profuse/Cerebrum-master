require('dotenv').config();
const aIChatCompletion = require('./ai_provider');
const ProjectCoordinator = require('./classes/projectCoordinator');
const UserModel = require('./models/User.schema');
const { extractJsonArray } = require('./utilities/functions');
const {
    makeDynamicData,
    generateWebAppPrompt,
    fixIssues
} = require('./utilities/promptUtils');
const { monitorBrowserConsoleErrors } = require('./ErrorHandler/scrapper');
const ExecutionManager = require('./classes/executionManager');
const env = process.env.NODE_ENV || 'development';
const baseURL =
    env === 'production' ? process.env.PROD_URL : process.env.LOCAL_URL;

async function createTaskObjects(projectId, userId) {
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

    async function consolidateResponses() {
        try {
            const tasks = await createTaskList();
            const newArray = await findFirstArray(tasks);
            const developerAssistant = new ExecutionManager(
                newArray,
                projectId,
                userId
            );
            await developerAssistant.executeTasks();
            
            const errors = await monitorBrowserConsoleErrors(
                baseURL,
                projectId,
                null  // Explicitly passing null to open index.html
            );
    
            const relevantErrors = errors.consoleMessages.filter(msg => 
                !(msg.type === "warning" && msg.text.includes("cdn.tailwindcss.com should not be used in production")) &&
                msg.type !== "requestfailed"
            );
    
            if (relevantErrors.length > 0) {
                // Resolve issues
                const array = await resolveIssues(relevantErrors,newArray);
                const newArray = await findFirstArray(array);
            const developerAssistant = new ExecutionManager(
                newArray,
                projectId,
                userId
            );
            await developerAssistant.executeTasks();
            }
    
        } catch (error) {
            console.error("Error in consolidateResponses:", error);
            // Handle or rethrow the error as appropriate
        }
    }
    
    // Assuming you have or will implement this function
    async function resolveIssues(errors, currentTaskList) {
        // Logic to resolve the issues
        console.log("Resolving issues:", errors);
        const conversationHistory = await getConversationHistory(
            userId,
            projectId
        );

        const prompt = fixIssues(conversationHistory,currentTaskList,errors);

        const array = await aIChatCompletion({
            userId: userId,
            systemPrompt: prompt,
        });


        const jsonArrayString = await extractJsonArray(array);
        // now update pased on the json
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

        const array = await aIChatCompletion({
            userId: userId,
            systemPrompt: prompt,
        });

        const prompt2 = makeDynamicData(array,conversationHistory);

        const rawArray = await aIChatCompletion({
            userId: userId,
            systemPrompt: prompt2,
        });


        const jsonArrayString = await extractJsonArray(rawArray);
        // now update pased on the json
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
