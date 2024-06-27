require('dotenv').config();
const ProjectCoordinator = require('./classes/projectCoordinator');
const { createTaskObjects } = require('./createTaskObjects');
const s3FileManager = require('./s3FileManager');

async function createWebApp(projectName, projectId, userId) {
    const projectCoordinator = new ProjectCoordinator(userId, projectId);
    try {
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

        await s3FileManager.writeFile(
            projectId,
            'index.html',
            indexHtmlContent
        );

        await createTaskObjects(projectId, userId, projectName);
    } catch (error) {
        await projectCoordinator.logStep(`An error occurred: ${error}`);
    }
}

module.exports = createWebApp;
