const path = require('path');
const executeCommand = require('./executeCommand');


async function runTests(projectId,appName) {
    const dir = path.join(__dirname, 'workspace');
    const appPath = path.join(dir, projectId);
    try {
        await executeCommand(`npx playwright test --config=playwright.config.js ${projectId}`, appPath);
    } catch (error) {
        console.error(error.message);
    }
}

module.exports = { runTests };
