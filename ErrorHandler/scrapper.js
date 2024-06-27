require('dotenv').config();
const { chromium } = require('playwright');
const errorExpiryTime = 30000; // 30 seconds expiry time for errors

let browserInstance = null;

async function monitorBrowserConsoleErrors(baseURL, projectId, results) {
    if (!browserInstance) {
        browserInstance = await chromium.launch({ headless: true });
    }

    let allConsoleMessages = [];

    for (const result of results) {
        // Only process HTML files
        if (result.extension !== 'html') {
            continue;
        }

        let url;
        if (result.name === 'index') {
            url = `${baseURL}/${projectId}`;
        } else {
            url = `${baseURL}/${projectId}/${result.name}.html`;
        }

        const page = await browserInstance.newPage();

        // Setup console listener
        page.on('console', async (msg) => {
            const msgType = msg.type();
            const msgText = msg.text();
            allConsoleMessages.push({ url, type: msgType, text: msgText });
        });

        // Capture page errors with more detail
        await page.exposeFunction(
            'onCustomError',
            ({ message, source, lineno, colno, error }) => {
                allConsoleMessages.push({
                    url,
                    type: 'pageerror',
                    text: `${message} at ${source}:${lineno}:${colno}`,
                    error,
                });
            }
        );

        await page.addInitScript(() => {
            window.addEventListener('error', (event) => {
                window.onCustomError({
                    message: event.message,
                    source: event.filename,
                    lineno: event.lineno,
                    colno: event.colno,
                    error: event.error,
                });
            });
        });

        // Capture request failures
        page.on('requestfailed', (request) => {
            allConsoleMessages.push({
                url,
                type: 'requestfailed',
                text: `${request.url()} ${request.failure().errorText}`,
            });
        });

        await page.goto(url);

        // Wait for a short time to capture console messages
        await new Promise((resolve) => setTimeout(resolve, 2000));

        await page.close();
    }

    // Close browser after a period of inactivity
    setTimeout(async () => {
        if (browserInstance) {
            await browserInstance.close();
            browserInstance = null;
        }
    }, errorExpiryTime);

    return { consoleMessages: allConsoleMessages };
}

module.exports = { monitorBrowserConsoleErrors };
