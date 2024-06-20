const UserModel = require('./User.schema');
const {
    handleIssues,
    handleUserReply,
    handleGetRequirements,
    handleImageGetRequirements,
} = require('./gptActions');
const { createApplication } = require('./createApplication');
const { handleImages } = require('./createImgApplication');

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
    let response;
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
            response = `Fantastic! I've got all the details I need. Time to start building your amazing project! 😊`;
            await addMessage(response);
            await createApplication(projectId, userId);
            response = `Great news! Your project has been built successfully. You can check it out at http://localhost:5001/${projectId}. If you need any adjustments, just let me know and I'll take care of it for you.`;
            await UserModel.addIsCompleted(userId,projectId)
            addMessage(response, false);
            break;

        case 'modifyApplication':
            response =
                'Got it! We are now modifying the existing application, wait a while....';
            await addMessage(response);
            await handleIssues(userMessage, projectId, userId);
            response =
                'I have finished modifying your application as requested.';
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
            response =
                'Sorry, there seems to be an issue with the server. Please try again later.';
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
