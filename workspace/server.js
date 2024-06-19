require('dotenv').config();
const express = require('express');
const app = express();
const path = require('path');

// Middleware to parse JSON
app.use(express.json());



// Middleware to serve static files from project directories
app.use('/:project', (req, res, next) => {
    const project = req.params.project;
    const projectPath = path.join(__dirname, project);

    // Serve CSS, JS, and asset files
    express.static(projectPath)(req, res, next);
});

// Dynamic routing to serve HTML files directly
app.get('/:project', (req, res) => {
    const project = req.params.project;
    const projectViewsPath = path.join(__dirname, project, 'index.html');

    // Serve the index.html file located in the project directory
    res.sendFile(projectViewsPath);
});

// Start the server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
