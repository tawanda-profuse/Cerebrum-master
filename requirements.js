require('dotenv').config();
const { createTaskObjects } = require('./createTaskObjects');
const ProjectCoordinator = require('./projectCoordinator');
const User = require('./User.schema');
const AutoMode = require('./autoMode');
const { connectServer } = require('./connectServer');

class Requirements {
    constructor(openaiInstance) {
        this.openai = openaiInstance;
        this.MAX_MAIN_QUESTIONS = 3;
        this.initialQuestions = [
            `Hi there! I'm here to gather information about the application you want to build 😊. Could you start by sharing an overview of your app and the features you'd like it to have?`,
            'Have you thought about the colors and styles for the site?',
            'Tell me do you have any sketches, designs, or images for the type of application you want? If so, please upload them',
        ];

    }

    async getWebsiteRequirements(projectId,userId) {
        const autoMode = new AutoMode('./autoModeRequirements.json', projectId);
        let lastAskedQuestionIndex = autoMode.getLastAskedQuestionIndex() || 0;
        let lastCompletedStep = autoMode.getLastCompletedStep() || 0;

        // Step 1: Iterate through initial questions
        if (lastCompletedStep < 1) {
            for (
                let i = lastAskedQuestionIndex;
                i < this.MAX_MAIN_QUESTIONS;
                i++
            ) {
                const question = this.initialQuestions[i];
                await this.getUserResponse(question, userId, projectId);
                autoMode.saveLastAskedQuestionIndex(i + 1);
            }
            autoMode.saveLastCompletedStep(1);
            lastCompletedStep = 1; // Update the last completed step
        }

        // The logic for checking and handling if data is needed
        if (lastCompletedStep < 2) {
           
            setTimeout(async () => {
                // Save the message to the database instead of emitting it via Socket.IO
                User.addMessage(
                    userId,
                    [
                        {
                            role: 'assistant',
                            content: 'rq_true',
                        },
                    ],
                    projectId
                );
            }, 3000);
           // await connectServer(projectId, userId)
            autoMode.saveLastCompletedStep(2);
            lastCompletedStep = 2; // Update the last completed step
        }

        // Final step: Create the project overview
        if (lastCompletedStep < 3) {
            const projectCoordinator = new ProjectCoordinator(
                this.openai,
                projectId
            );
            let conversations = await User.getUserMessages(userId, projectId);

            // Removing 'projectId' and 'time' properties from each object
            let conversationHistory = conversations.map(({ role, content }) => {
                return { role, content };
            });
            const conversationContext = conversationHistory
                .map(({ role, content }) => `${role}: ${content}`)
                .join('\n');

            await projectCoordinator.imagePicker(conversationContext, userId);
            await createTaskObjects(projectId, userId);
        }
    }

    // Function to get response from user input
    async getUserResponse(question, userId, projectId) {
        // Save the assistant's message
        User.addMessage(
            userId,
            [{ role: 'assistant', content: question, awaitingResponse: true }],
            projectId
        );

        // Function to check for the user's response
        function checkForResponse() {
            return new Promise((resolve, reject) => {
                const checkInterval = setInterval(() => {
                    // Read the latest user data
                    const currentUser = User.findById(userId);
                    if (currentUser) {
                        // Assuming the last message from the user is the response
                        const lastMessage =
                            currentUser.messages[
                                currentUser.messages.length - 1
                            ];
                        // Check if the last message is a user's response after the assistant's question
                        if (lastMessage && lastMessage.role === 'user') {
                            clearInterval(checkInterval);
                            resolve(lastMessage);
                        }
                    }
                }, 1000); // Check every 1 second
            });
        }

        // Wait for the user's response
        try {
            const userResponse = await checkForResponse();
            return userResponse; // This is the user's response
        } catch (error) {
            console.error('Error waiting for user response:', error);
            console.log(error);
        }
    }
}

module.exports = Requirements;
