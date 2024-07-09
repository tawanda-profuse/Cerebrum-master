require("dotenv").config();
const ProjectCoordinator = require("./classes/projectCoordinator");
const { createTaskObjects } = require("./createTaskObjects");
const s3FileManager = require("./s3FileManager");
const logger = require("./logger");

async function createWebApp(projectName, projectId, userId) {
  const projectCoordinator = new ProjectCoordinator(userId, projectId);
  try {
    const indexHtmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Error Occurred - ${projectName}</title>
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js" defer></script>
</head>
<body class="bg-gradient-to-r from-blue-100 to-purple-100 text-gray-800 min-h-screen flex items-center justify-center">
    <div class="container mx-auto p-8 max-w-md">
        <div class="bg-white rounded-lg shadow-xl overflow-hidden">
            <div class="bg-red-500 p-4">
                <h1 class="text-2xl font-bold text-white text-center">${projectName}</h1>
            </div>
            <div class="p-6">
                <div class="flex items-center justify-center mb-6">
                    <svg class="w-16 h-16 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                </div>
                <h2 class="text-xl font-semibold text-center mb-4">Oops! Something went wrong.</h2>
                <p class="text-gray-600 text-center mb-6">We apologize for the inconvenience. Please try the following steps:</p>
                <ol class="list-decimal list-inside text-gray-600 mb-6">
                    <li>Refresh the page</li>
                    <li>Clear your browser cache</li>
                    <li>If the problem persists, delete this project and create a new one</li>
                </ol>
                <div class="text-center">
                    <button onclick="window.location.reload()" class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-full transition duration-300 ease-in-out transform hover:-translate-y-1">
                        Refresh Page
                    </button>
                </div>
            </div>
        </div>
    </div>
    <script src="./script.js"></script>
</body>
</html>`;

    await s3FileManager.writeFile(projectId, "index.html", indexHtmlContent);

    // Create data.json file with an empty array
    const dataJsonContent = JSON.stringify([], null, 2);
    await s3FileManager.writeFile(projectId, "data.json", dataJsonContent);

    await createTaskObjects(projectId, userId);
  } catch (error) {
    await projectCoordinator.logStep(`An error occurred: ${error}`);
  }
}

module.exports = createWebApp;
