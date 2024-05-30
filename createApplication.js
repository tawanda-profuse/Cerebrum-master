require('dotenv').config();
const fs = require('fs');
const fsPromises = fs.promises;
const path = require('path');
const ExecutionManager = require('./executionManager');
const ProjectCoordinator = require('./projectCoordinator');
const Requirements = require('./requirements');
const { manageReactServer, resolveStartIssues } = require('./errorHandler');
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
        await projectCoordinator.codeReviewer(
            taskList,
            projectOverView,
            appName
        );
        await projectCoordinator.logStep('All tasks have been executed.');
        autoMode.saveState('lastCompletedTask', 3);
        lastCompletedTask = 3;
        selectedProject.stage = 3;
        User.addProject(userId, selectedProject);
    }

    if (lastCompletedTask < 4) {
        const selectedProject = User.getUserProject(userId, projectId)[0];
        let { projectOverview, appName, taskList } = selectedProject;
        const workspaceDir = path.join(__dirname, 'workspace');
        const projectDir = path.join(workspaceDir, projectId);

        const myAppPath = path.join(projectDir, appName);
        selectedProject.appPath = myAppPath;

        const appJsPath = path.join(myAppPath, 'src', 'App.js');
        appJsContent = `
        import React from 'react';
        import "" from './""';
  
        function App() {
          return (
              <"" />
          );
        }
  
        export default App;
      `;

        taskDescription = `Please review the current App.js file provided here: ${appJsContent}. Your task is to modify it to align with the project's requirements. As part of this task, you should:
  
      1. Analyse the component achitecture from the project overview and based on that modify the App.js file to reflect the project' component structure.
      2. The Easy Peasy store is already imported in the index.js file and wrapped around the App component, so there is no need to import it again in the App.js file.
      3. Examine the project overview and task list to understand the necessary changes.
      4. If there are any child components or additional imports required for the application, include them.
      5. Ensure that the amended App.js file reflects the objectives and specifications outlined in the project documentation.
      6. All components and files are imported within the same directory, so './' is sufficient to import them.
      7. If the project uses react-router-dom, know that In react-router-dom version 6, the Switch component has been replaced by Routes. 
         - In React Router v6, you should wrap the components in an element prop as JSX like this <Routes> <Route path="/" element={<Component />} /> </Routes>
      8. You import them like this: import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';   
  
      While mentally thinking this through step by step and taking your time, provide only the revised code for the App.js file with these amendments.`;
        // project overview , component achitecture , overview
        const code = await projectCoordinator.codeWriter(
            taskDescription,
            taskList,
            projectOverview,
            appName,
            userId
        );
        await fsPromises.writeFile(appJsPath, code);
        await projectCoordinator.logStep(
            'App.js file updated and React app is starting...'
        );
        autoMode.saveState('lastCompletedTask', 4);
        lastCompletedTask = 4;
        selectedProject.stage = 4;
        User.addProject(userId, selectedProject);
    }

    if (lastCompletedTask < 5) {
        const selectedProject = User.getUserProject(userId, projectId)[0];
        let { appPath } = selectedProject;

        try {
            await manageReactServer(appPath, projectId, userId);

            await projectCoordinator.logStep('React app started successfully.');
        } catch (error) {
            await resolveStartIssues(error.message, projectId, userId);
            await projectCoordinator.logStep('Issues resolved');
            selectedProject.stage = 5;
            User.addProject(userId, selectedProject);
        }
        autoMode.saveState('lastCompletedTask', 5);
        selectedProject.stage = 5;
        User.addProject(userId, selectedProject);
    }

    await projectCoordinator.logStep(
        `React app ${appName} is set up, built, and ready.`
    );
}

module.exports = { createApplication };
