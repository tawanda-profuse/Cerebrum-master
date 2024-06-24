require('dotenv').config();
const express = require('express');
const app = express();
const path = require('path');
const S3Utility = require('../classes/s3Utility');

// Create an instance of S3Utility
const s3Utility = new S3Utility();

// Middleware to parse JSON
app.use(express.json());

// Dynamic routing to serve HTML files from S3
app.get('/:project', async (req, res) => {
    const project = req.params.project;
    console.log('project', project)
    const key = `workspace/${project}/index.html`;

    try {
        const fileContent = await s3Utility.getFile(key);
        res.set('Content-Type', 'text/html');
        res.send(fileContent);
    } catch (error) {
        console.error(`Error serving index.html from S3 for project ${project}:`, error);
        res.status(404).send('File not found');
    }
});

// Route to serve other files from S3
app.get('/:project/*', async (req, res) => {
    const key = `workspace/${req.params.project}/${req.params[0] || ''}`;

    try {
        const fileContent = await s3Utility.getFile(key);

        // Set appropriate Content-Type based on file extension
        const ext = path.extname(key).toLowerCase();
        switch (ext) {
            case '.js':
                res.set('Content-Type', 'application/javascript');
                break;
            case '.css':
                res.set('Content-Type', 'text/css');
                break;
            case '.json':
                res.set('Content-Type', 'application/json');
                break;
            case '.png':
                res.set('Content-Type', 'image/png');
                break;
            case '.jpg':
            case '.jpeg':
                res.set('Content-Type', 'image/jpeg');
                break;
            default:
                res.set('Content-Type', 'text/plain');
        }
        res.send(fileContent);

        // Log additional information (optional)
        const trueUrl = s3Utility.getTrueUrl(key);
        console.log(`True URL: ${trueUrl}`);
    } catch (error) {
        console.error(`Error serving file from S3: ${key}`, error);
        res.status(404).send('File not found');
    }
});

// Start the server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});