require('dotenv').config();
const { createTaskObjects } = require('./createTaskObjects');
const createWebApp = require('./createAppFunction');
const ExecutionManager = require('./executionManager');
const ProjectCoordinator = require('./projectCoordinator');
const User = require('./User.schema');

async function createApplication(projectId, userId) {
        const projectCoordinator = new ProjectCoordinator(userId, projectId);
        const selectedProject = User.getUserProject(userId, projectId)[0];
        let { taskList, appName, projectOverView } = selectedProject;
        let conversations = await User.getUserMessages(userId, projectId);
        let conversationHistory = conversations.map(({ role, content }) => {
            return { role, content };
        });
        const conversationContext = conversationHistory
            .map(({ role, content }) => `${role}: ${content}`)
            .join('\n');

        await createWebApp(appName, projectId, selectedProject, User, userId);
       // await projectCoordinator.findSimilarProject(conversationContext, userId);
        await createTaskObjects(projectId, userId);
        await projectCoordinator.codeReviewer(
            projectOverView,
            userId,
            taskList
        );
        const developerAssistant = new ExecutionManager(taskList, projectId,userId);
        await developerAssistant.executeTasks(appName, userId);
        await projectCoordinator.logStep('All tasks have been executed.');
  
}

module.exports = { createApplication };
