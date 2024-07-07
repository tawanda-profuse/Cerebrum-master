require('dotenv').config();
const express = require('express');
const app = express();
const path = require('path');
const S3Utility = require('./s3Utility');
const mongoose = require('mongoose');
const mongoURI = process.env.MONGO_URI;
const logger = require('./logger');

mongoose.connect(mongoURI);

mongoose.connection.on('connected', () => {
    logger.info('Connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
    logger.info('Error connecting to MongoDB', err);
});

// Create an instance of S3Utility
const s3Utility = new S3Utility();

// Middleware to parse JSON
app.use(express.json());

// Function to set content type based on file extension
function setContentType(res, fileName) {
    const ext = path.extname(fileName).toLowerCase();
    switch (ext) {
        case '.html': res.set('Content-Type', 'text/html'); break;
        case '.js': res.set('Content-Type', 'application/javascript'); break;
        case '.css': res.set('Content-Type', 'text/css'); break;
        case '.json': res.set('Content-Type', 'application/json'); break;
        case '.png': res.set('Content-Type', 'image/png'); break;
        case '.jpg':
        case '.jpeg': res.set('Content-Type', 'image/jpeg'); break;
        default: res.set('Content-Type', 'text/plain');
    }
}
    
// Function to generate a custom 404 HTML page
function generate404Page(message) {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>404 - Not Found</title>
        <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            h1 { color: #444; }
            p { color: #666; }
        </style>
    </head>
    <body>
        <h1>404 - Not Found</h1>
        <p>${message}</p>
    </body>
    </html>
    `;
}

// Helper function to check if a project exists
async function projectExists(projectId) {
    try {
        await s3Utility.getFile(`workspace/${projectId}/index.html`);
        return true;
    } catch (error) {
        return false;
    }
}

// Prefix all routes with /workspace
app.use('/workspace', express.static('public'));

// Route to serve project files
app.get('/workspace/:projectId/*', async (req, res) => {
    const projectId = req.params.projectId;
    const filePath = req.params[0];
    const key = `workspace/${projectId}/${filePath}`;

    if (await projectExists(projectId)) {
        try {
            const fileContent = await s3Utility.getFile(key);
            setContentType(res, filePath);
            res.send(fileContent);
        } catch (error) {
            // File not found, but project exists, so redirect to index.html
            res.redirect(`/workspace/${projectId}/index.html`);
        }
    } else {
        // Project doesn't exist
        res.status(404).send(generate404Page("The requested project does not exist."));
    }
});

// Route to serve the main project page
app.get('/workspace/:projectId', async (req, res) => {
    const projectId = req.params.projectId;
    res.redirect(`/workspace/${projectId}/index.html`);
});

// Catch-all route for /workspace to handle 404 for non-existent projects
app.use('/workspace', (req, res) => {
    res.status(404).send(generate404Page("The requested resource does not exist."));
});

// Handle requests to the root path
app.get('/', (req, res) => {
    res.send('Welcome to the YeduAI Workspace Server');
});

// Catch-all route for any other requests
app.use((req, res) => {
    res.status(404).send(generate404Page("The requested resource does not exist."));
});

// Start the server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
});