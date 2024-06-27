const UserModel = require('../models/User.schema');
const {
    handleIssues,
    handleUserReply,
    handleGetRequirements,
} = require('../gptActions');
const { handleImages } = require('../createImgApplication');
const createWebApp = require('../createAppFunction');
const aIChatCompletion = require('../ai_provider');
const { defaultResponse } = require('./promptUtils');
const env = process.env.NODE_ENV || 'development';
const baseURL =
    env === 'production' ? process.env.PROD_URL : process.env.LOCAL_URL;

function extractJsonArray(rawArray) {
    const startIndex = rawArray.indexOf('[');
    const endIndex = rawArray.lastIndexOf(']') + 1;

    if (startIndex === -1 || endIndex === -1) {
        throw new Error('No JSON array found in the response.');
    }

    let jsonArrayString = rawArray.substring(startIndex, endIndex);
    jsonArrayString = jsonArrayString.replace(/\\"/g, '"');

    return jsonArrayString;
}

async function handleAction(
    action,
    userMessage,
    userId,
    projectId,
    sketches,
    addMessage
) {
    let response, defResponse, newRespons;
    switch (action) {
        case 'getRequirements':
            response = await handleGetRequirements(
                userMessage,
                userId,
                projectId
            );
            addMessage(response);
            break;

        case 'createApplication':
            defResponse = await defaultResponse(
                `Cool! I've got all the details I need. Time to start building your amazing project!, please wait a while 😊`,
                userId,
                projectId
            );
            newRespons = await aIChatCompletion({
                userId: userId,
                systemPrompt: defResponse,
            });
            response = newRespons;
            await UserModel.addisProcessing(userId, projectId,true);
            await addMessage(response);
            
            const selectedProject = await UserModel.getUserProject(
                userId,
                projectId
            );
            let { appName } = selectedProject;
            await createWebApp(appName, projectId, userId);
            defResponse = await defaultResponse(
                `Great news! Your project has been built successfully. You can check it out at ${baseURL}/${projectId}. If you need any adjustments, just let me know and I'll take care of it for you.`,
                userId,
                projectId
            );
            newRespons = await aIChatCompletion({
                userId: userId,
                systemPrompt: defResponse,
            });
            response = newRespons;
            await UserModel.addIsCompleted(userId, projectId);
            await UserModel.addisProcessing(userId, projectId,false);
            addMessage(response, false);         
            break;

        case 'modifyApplication':
            defResponse = await defaultResponse(
                `Got it! We are now modifying the existing application, wait a while....`,
                userId,
                projectId
            );
            
            newRespons = await aIChatCompletion({
                userId: userId,
                systemPrompt: defResponse,
            });
            response = newRespons;
            await UserModel.addisProcessing(userId, projectId,true);
            await addMessage(response);
            
            await handleIssues(userMessage, projectId, userId);
            defResponse = await defaultResponse(
                'I have finished modifying your application as requested.',
                userId,
                projectId
            );
            newRespons = await aIChatCompletion({
                userId: userId,
                systemPrompt: defResponse,
            });
            response = newRespons;
            await UserModel.addisProcessing(userId, projectId,false);
            addMessage(response, false);
            
            break;

        case 'generalResponse':
            response = await handleUserReply(userMessage, userId, projectId);
            addMessage(response);
            break;

        case 'handleImages':
            if (sketches && sketches.length > 0) {
                await handleImages(
                    userMessage,
                    userId,
                    projectId,
                    sketches[0],
                    addMessage
                );
            } else {
                addMessage('No sketches provided.');
            }
            break;

        case 'error':
            defResponse = await defaultResponse(
                'Sorry, there seems to be an issue with the server. Please try again later.',
                userId,
                projectId
            );
            newRespons = await aIChatCompletion({
                userId: userId,
                systemPrompt: defResponse,
            });
            response = newRespons;
            addMessage(response);
            break;

        default:
            await UserModel.addSystemLogToProject(
                userId,
                projectId,
                'There was an issue with analysing sentiment'
            );
            return; // Exit function if action is not recognized
    }
}

module.exports = {
    extractJsonArray,
    handleAction,
};
