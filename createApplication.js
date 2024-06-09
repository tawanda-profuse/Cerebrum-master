require('dotenv').config();
const fs = require('fs');
const fsPromises = fs.promises;
const path = require('path');
const ExecutionManager = require('./executionManager');
const ProjectCoordinator = require('./projectCoordinator');
const Requirements = require('./requirements');
const AutoMode = require('./autoMode');
const createReactApp = require('./createReactAppFunction');
const OpenAI = require('openai');
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});
const globalState = require('./globalState');
const User = require('./User.schema');

async function createApplication(projectId, userId) {
    let taskDescription, appJsContent;
    const autoMode = new AutoMode('./autoModeState.json', projectId);
    const projectCoordinator = new ProjectCoordinator(openai, projectId);
    const requirements = new Requirements(openai);

    globalState.setSessionId(userId);

    // Check if there is a saved state and decide where to resume
    let lastCompletedTask = autoMode.getState('lastCompletedTask');
    if (!lastCompletedTask || lastCompletedTask < 1) {
        const selectedProject = User.getUserProject(userId, projectId)[0];
        let { appName } = selectedProject;

        await createReactApp(appName, projectId, selectedProject, User, userId);
        autoMode.saveState('lastCompletedTask', 1);
        lastCompletedTask = 1;
        selectedProject.stage = 1;
        User.addProject(userId, selectedProject);
    }
    if (lastCompletedTask < 2) {
        const selectedProject = User.getUserProject(userId, projectId)[0];
        let { appName } = selectedProject;
        globalState.setAwaitingRequirements(userId, true);
        await requirements.getWebsiteRequirements(projectId, appName, userId);
        globalState.setAwaitingRequirements(userId, false);
        autoMode.saveState('lastCompletedTask', 2);
        lastCompletedTask = 2;
        selectedProject.stage = 2;
        User.addProject(userId, selectedProject);
    }

    if (lastCompletedTask < 3) {
        const selectedProject = User.getUserProject(userId, projectId)[0];
        let { taskList, appName, projectOverView } = selectedProject;
        const developerAssistant = new ExecutionManager(taskList, projectId);
        await developerAssistant.executeTasks(appName, userId);
        await projectCoordinator.logStep('All tasks have been executed.');
        autoMode.saveState('lastCompletedTask', 3);
        lastCompletedTask = 3;
        selectedProject.stage = 3;
        User.addProject(userId, selectedProject);
    }

    if (lastCompletedTask < 4) {
        const selectedProject = User.getUserProject(userId, projectId)[0];
        User.addMessage(
            userId,
            [
                {
                    role: 'assistant',
                    content: `Great news! Your project has been built successfully. You can check it out at http://localhost:5000/${projectId}. If you need any adjustments, just let me know and I'll take care of it for you.`,
                },
            ],
            projectId
        );
        autoMode.saveState('lastCompletedTask', 4);
        selectedProject.stage = 4;
        User.addProject(userId, selectedProject);
    }
}

module.exports = { createApplication };
