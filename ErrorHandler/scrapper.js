const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const errorExpiryTime = 30000; // 30 seconds expiry time for errors
let browserInstance = null;
let browserPage = null;

async function monitorBrowserConsoleErrors(url) {
    if (browserInstance) {
        return; // If a browser instance already exists, don't create a new one
    }

    browserInstance = await chromium.launch({ headless: true });
    browserPage = await browserInstance.newPage();

    let consoleMessages = [];

    // Setup console listener
    browserPage.on('console', async (msg) => {
        const msgType = msg.type();
        const msgText = msg.text();
        consoleMessages.push({ type: msgType, text: msgText });
    });

    // Capture page errors with more detail
    await browserPage.exposeFunction('onCustomError', ({ message, source, lineno, colno, error }) => {
        consoleMessages.push({ type: 'pageerror', text: `${message} at ${source}:${lineno}:${colno}`, error });
    });

    await browserPage.addInitScript(() => {
        window.addEventListener('error', event => {
            window.onCustomError({
                message: event.message,
                source: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                error: event.error
            });
        });
    });

    // Capture request failures
    browserPage.on('requestfailed', (request) => {
        consoleMessages.push({ type: 'requestfailed', text: `${request.url()} ${request.failure().errorText}` });
    });

    await browserPage.goto(url);

    // Wait for a longer time to capture console messages
    await new Promise(resolve => setTimeout(resolve, 5000)); // Increase wait time to ensure all messages are captured

    // Take a screenshot
    const screenshotPath = path.join(__dirname, 'screenshot.png');
    await browserPage.screenshot({ path: screenshotPath });
    // Close browser after a period of inactivity
    setTimeout(async () => {
        if (browserInstance) {
            await browserInstance.close();
            browserInstance = null;
            browserPage = null;
        }
    }, errorExpiryTime);

    const screenshotBuffer = fs.readFileSync(screenshotPath);
    return {
        screenshot: screenshotBuffer.toString('base64'),
        consoleMessages,
        screenshotPath
    };
}

module.exports = { monitorBrowserConsoleErrors };
