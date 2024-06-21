require('dotenv').config();
const fsPromises = require('fs').promises;
const path = require('path');
const ProjectCoordinator = require('./classes/projectCoordinator');

async function createWebApp(projectName, projectId, selectedProject, userId) {
    const projectCoordinator = new ProjectCoordinator(userId, projectId);
    try {
        const workspaceDir = path.join(__dirname, 'workspace');
        // Check if the workspace directory exists, if not, create it
        await fsPromises.mkdir(workspaceDir, { recursive: true });
        // Create a directory for the project using projectId
        const projectDir = path.join(workspaceDir, projectId);
        // Check if the project directory exists, if not, create it
        await fsPromises.mkdir(projectDir, { recursive: true });

        // Create the HTML/Tailwind project structure
        await projectCoordinator.logStep(
            `We are now creating your HTML/Tailwind project named ${projectName}...`
        );

        // Create script.js
        const scriptJsContent = ``; // Empty script.js file
        await fsPromises.writeFile(
            path.join(projectDir, 'script.js'),
            scriptJsContent
        );
        await projectCoordinator.logStep('script.js created.');

        // Create index.html
        const indexHtmlContent = `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${projectName}</title>
        <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
      </head>
      <body class="bg-gray-100 text-gray-800">
        <div class="container mx-auto p-4">
            <h1 class="text-4xl font-bold text-center">${projectName}</h1>
        </div>
        <script src="./script.js"></script>
      </body>
      </html>`;

        await fsPromises.writeFile(
            path.join(projectDir, 'index.html'),
            indexHtmlContent
        );
        await projectCoordinator.logStep(
            'index.html using the CDN tailwind link created.'
        );
    } catch (error) {
        await projectCoordinator.logStep(`An error occurred: ${error}`);
    }
}

module.exports = createWebApp;
