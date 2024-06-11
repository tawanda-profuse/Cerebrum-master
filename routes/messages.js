const express = require('express');
const router = express.Router();
const User = require('../User.schema');
const { verifyToken } = require('../utilities/functions');
const {
    handleActions,
    handleIssues,
    handleUserReply,
} = require('../gptActions');
const { createApplication } = require('../createApplication');
const {socketIO} = require("../server");

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
            selectedProject,
            userId,
            projectId,
            userMessage,
            res
        );
    }

    socketIO.to(userId).emit('new-message', userMessage);
});

async function processSelectedProject(
    selectedProject,
    userId,
    projectId,
    userMessage,
    res
) {
    if (selectedProject.stage === 1) {
        User.addMessage(
            userId,
            [{ role: 'user', content: userMessage }],
            projectId
        );
    } else {
        await handleSentimentAnalysis(res, userId, userMessage, projectId);
    }
}

async function handleSentimentAnalysis(res, userId, userMessage, projectId) {
    const action = await handleActions(userMessage, userId, projectId);
    let response;

    const addMessage = (response) => {
        User.addMessage(
            userId,
            [
                { role: 'user', content: userMessage },
                { role: 'assistant', content: response },
            ],
            projectId
        );
    };

    switch (action) {
        case 'createApplication':
            response = 'cr_true';
            addMessage(response);
            await createApplication(projectId, userId);
            break;

        case 'modifyApplication':
            response = 'We are now modifying the existing application.';
            addMessage(response);
            await handleIssues(userMessage, projectId, userId);
            console.log('I am done modifying your request');
            break;

        case 'generalResponse':
            response = await handleUserReply(userMessage, userId, projectId);
            addMessage(response);
            break;

        case 'reject':
            response = 'You can only create one project at a time!.';
            User.addMessage(
                userId,
                [
                    { role: 'user', content: userMessage },
                    { role: 'assistant', content: response },
                ],
                projectId
            );
            break;

        case 'error':
            response =
                'Sorry, there seems to be an issue with the server. Please try again later.';
            addMessage(response);
            break;

        default:
            res.status(400).send('Invalid action');
            return; // Add return to ensure the function exits here
    }
}

module.exports = router;
