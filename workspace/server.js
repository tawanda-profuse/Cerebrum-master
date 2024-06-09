require('dotenv').config();
const express = require('express');
const app = express();
const path = require('path');
const mongoose = require('mongoose');
const loadRoutes = require('./loadRoutes');

// Middleware to parse JSON
app.use(express.json());

// Connect to MongoDB
const mongoURI = process.env.MONGO_URI;
mongoose.connect(mongoURI);

mongoose.connection.on('connected', () => {
    console.log('Connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
    console.log('Error connecting to MongoDB', err);
});

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

// Load initial routes
loadRoutes(app);

// Endpoint to reload routes dynamically
app.post('/reload-routes', (req, res) => {
    loadRoutes(app);
    res.status(200).send('Routes reloaded successfully');
});

// Start the server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
