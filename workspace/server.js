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

// Route to serve project files
app.get('/workspace/:projectId/*', async (req, res) => {
    const projectId = req.params.projectId;
    const filePath = req.params[0];
    const key = `workspace/${projectId}/${filePath}`;

    logger.info(`Attempting to serve: ${key}`);

    try {
        const fileContent = await s3Utility.getFile(key);
        setContentType(res, filePath);
        logger.info(`Successfully served: ${key}`);
        res.send(fileContent);
    } catch (error) {
        logger.error(`Error serving file: ${key}`, error);
        if (error.code === 'NoSuchKey') {
            logger.info(`File not found: ${key}`);
            if (filePath === 'index.html') {
                res.status(404).send(generate404Page("The requested project does not exist."));
            } else {
                // For other files, redirect to index.html of the project
                res.redirect(`/workspace/${projectId}/index.html`);
            }
        } else {
            logger.error(`Unexpected error: ${error.message}`);
            res.status(500).send(generate404Page("An unexpected error occurred."));
        }
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

// Catch-all route for any other requests
app.use((req, res) => {
    res.status(404).send(generate404Page("The requested resource does not exist."));
});

// Start the server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
});