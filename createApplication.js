require('dotenv').config();
const { createTaskObjects } = require('./createTaskObjects');
const createWebApp = require('./createAppFunction');
const ExecutionManager = require('./executionManager');
const ProjectCoordinator = require('./projectCoordinator');
const AutoMode = require('./autoMode');
const OpenAI = require('openai');
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});
const globalState = require('./globalState');
const User = require('./User.schema');

async function createApplication(projectId, userId) {
    const autoMode = new AutoMode('./autoModeState.json', projectId);
    const projectCoordinator = new ProjectCoordinator(userId, projectId);

    globalState.setSessionId(userId);

    // Check if there is a saved state and decide where to resume
    let lastCompletedTask = autoMode.getState('lastCompletedTask');

    if (lastCompletedTask < 2) {
        const selectedProject = User.getUserProject(userId, projectId)[0];
        let { appName } = selectedProject;

        await createWebApp(appName, projectId, selectedProject, User, userId);
        const projectCoordinator = new ProjectCoordinator(userId, projectId);
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
        autoMode.saveState('lastCompletedTask', 2);
        lastCompletedTask = 2;
        selectedProject.stage = 2;
        User.addProject(userId, selectedProject);
    }

    if (lastCompletedTask < 3) {
        const selectedProject = User.getUserProject(userId, projectId)[0];
        let { taskList, appName, projectOverView } = selectedProject;
        await projectCoordinator.codeReviewer(
            projectOverView,
            userId,
            taskList
        );
        const developerAssistant = new ExecutionManager(taskList, projectId,userId);
        await developerAssistant.executeTasks(appName, userId);
        await projectCoordinator.logStep('All tasks have been executed.');
        autoMode.saveState('lastCompletedTask', 3);
        lastCompletedTask = 3;
        selectedProject.stage = 3;
        User.addProject(userId, selectedProject);
    }
}

module.exports = { createApplication };
