require('dotenv').config();
const { createTaskObjects } = require('./createTaskObjects');
const createWebApp = require('./createAppFunction');
const ExecutionManager = require('./executionManager');
const ProjectCoordinator = require('./projectCoordinator');
const UserModel = require('./User.schema');

async function createApplication(projectId, userId) {
    const projectCoordinator = new ProjectCoordinator(userId, projectId);
    const selectedProject = await UserModel.getUserProject(userId, projectId);
    let { taskList, appName, projectOverView } = selectedProject;

    await createWebApp(appName, projectId, selectedProject, userId);

    await createTaskObjects(projectId, userId);

    // Refetch the updated project after createTaskObjects
    const updatedProjectAfterTasks = await UserModel.getUserProject(
        userId,
        projectId
    );
    taskList = updatedProjectAfterTasks.taskList;

    await projectCoordinator.codeReviewer(projectOverView, userId, taskList);

    // Refetch the updated project after codeReviewer
    const updatedProjectAfterReview = await UserModel.getUserProject(
        userId,
        projectId
    );
    taskList = updatedProjectAfterReview.taskList;

    const developerAssistant = new ExecutionManager(
        taskList,
        projectId,
        userId
    );
    await developerAssistant.executeTasks(appName, userId);
    await projectCoordinator.logStep('All tasks have been executed.');
}

module.exports = { createApplication };
