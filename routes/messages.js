const express = require('express');
const router = express.Router();
const User = require('../User.schema');
const { verifyToken } = require('../utilities/functions');
const {
    handleActions,
    handleIssues,
    handleUserReply,
    handleGetReuirements
} = require('../gptActions');
const { createApplication } = require('../createApplication');

router.get('/', verifyToken, async (req, res) => {
    try {
        // Fetch the user's ID from the decoded JWT token
        const userId = req.user.id;

        // Optionally get a projectId from the query string
        const { projectId } = req.query;

        // Find the user by their ID
        const user = await User.findById(userId);

        if (user) {
            // Filter and format messages with only role and content, based on projectId
            const formattedMessages = user.messages
                .filter((msg) =>
                    projectId ? msg.projectId == projectId : true
                )
                .map((msg) => {
                    return {
                        messageId: msg.messageId,
                        role: msg.role,
                        content: msg.content,
                        timestamp: msg.timestamp,
                    };
                });

            // Extract the subscription amount
            // Assuming the first subscription in the array is the current one
            const subscriptionAmount =
                user.subscriptions.length > 0
                    ? user.subscriptions[0].amount
                    : 0;

            // Create the response object
            const response = {
                messages: formattedMessages,
                subscriptionAmount: subscriptionAmount,
            };

            // Send the response
            res.send(response);
        } else {
            res.status(404).send('User not found');
        }
    } catch (error) {
        console.error(
            'Error in /api/user/messages-and-subscription endpoint:',
            error
        );
        res.status(500).send('Internal Server Error');
    }
});

router.post('/cerebrum_v1', verifyToken, async (req, res) => {
    const userId = req.user.id;
    const userMessage = req.body.message;
    const projectId = req.body.projectId;

    const selectedProject = User.getUserProject(userId, projectId)[0];

    // Check for a selected project and its stage
    if (selectedProject) {
        await processSelectedProject(
            userId,
            projectId,
            userMessage
        );
    }
});

async function processSelectedProject(
    userId,
    projectId,
    userMessage,
) {
    const action = await handleActions(userMessage, userId, projectId);
    let response;

    const addMessage = (response, hasUser = true) => {
        User.addMessage(
            userId,
            [
                hasUser ? { role: 'user', content: userMessage } : null,
                { role: 'assistant', content: response },
            ].filter(Boolean),
            projectId
        );
    };

    switch (action) {
        case 'getRequirements':
            response = await handleGetReuirements(userMessage, userId, projectId);
            addMessage(response);
            break;

        case 'createApplication':
            response = `Fantastic! I've got all the details I need. Time to start building your amazing project! 😊`;
            addMessage(response);
            await createApplication(projectId, userId);
            response = `Great news! Your project has been built successfully. You can check it out at http://localhost:5001/${projectId}. If you need any adjustments, just let me know and I'll take care of it for you.`
            addMessage(response,false)
            break;

        case 'modifyApplication':
            response =
                'Got it! I am now modifying the existing application, wait a while....';
            addMessage(response);
            await handleIssues(userMessage, projectId, userId);
            response = 'I have finished modifying your application as requested.';
            addMessage(response, false);
            break;

        case 'generalResponse':
            response = await handleUserReply(userMessage, userId, projectId);
            addMessage(response);
            break;

        case 'reject':
            response = 'You can only create one project at a time!.';
            addMessage(response);
            break;

        case 'error':
            response =
                'Sorry, there seems to be an issue with the server. Please try again later.';
            addMessage(response);
            break;

        default:
            console.log('issues')
            return; // Add return to ensure the function exits here
    }
}

module.exports = router;
