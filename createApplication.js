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
