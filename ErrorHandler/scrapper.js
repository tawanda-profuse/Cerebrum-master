require('dotenv').config();
const { chromium } = require('playwright');
const AWS = require('aws-sdk');
const errorExpiryTime = 30000; // 30 seconds expiry time for errors

let browserInstance = null;
let browserPage = null;

// AWS S3 Configuration
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
});

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
    const screenshotBuffer = await browserPage.screenshot();

    // Upload screenshot to S3
    const uploadParams = {
        Bucket: 'my-sketches-bucket',
        Key: `screenshots/${Date.now().toString()}.png`,
        Body: screenshotBuffer,
        ContentType: 'image/png'
    };

    const s3Upload = new Promise((resolve, reject) => {
        s3.upload(uploadParams, (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data.Location); // The URL of the uploaded image
            }
        });
    });

    const screenshotUrl = await s3Upload;

    // Close browser after a period of inactivity
    setTimeout(async () => {
        if (browserInstance) {
            await browserInstance.close();
            browserInstance = null;
            browserPage = null;
        }
    }, errorExpiryTime);

    return {
        consoleMessages,
        screenshotUrl
    };
}

module.exports = { monitorBrowserConsoleErrors };
