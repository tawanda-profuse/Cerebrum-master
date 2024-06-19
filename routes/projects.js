const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const fileSystem = require('fs');
const path = require('path');
const multer = require('multer');
const User = require('../User.schema');
const { verifyToken } = require('../utilities/functions');


// Configure multer for file upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    },
});


// GET route for fetching user projects
router.get('/', verifyToken, async (req, res) => {
    try {
        // req.user.id is set by the verifyToken middleware after token validation
        const userId = req.user.id;

        // Get the projects for the authenticated user
        const projects = User.getUserProjects(userId);
        res.send(projects);
    } catch (error) {
        console.error('Error fetching projects:', error);
        res.status(500).send('Internal Server Error');
    }
});

async function addNewProject(userId, projectName, id, appName) {
    try {
        // Retrieve the user data
        const user = User.findById(userId);
        if (!user) {
            console.log('User not found8');
        }

        // Create a new project object with default values
        const newProject = {
            id: id, // Generate a unique ID for the project
            name: projectName,
            createdAt: new Date().toISOString(),
            projectOverView: null,
            taskList: [],
            appPath: null,
            logs: [],
            sketches: [],
            appName: appName,
            stage: 0,
        };

        User.addProject(userId, newProject);
    } catch (error) {
        // Handle any errors that occur during the process
        console.error('Error adding new project:', error);
        console.log(error);
    }
}

router.post('/create-project', verifyToken, async (req, res) => {
    try {
        // Destructure and validate input
        const { projectName, projectId } = req.body;
        if (!projectName || !projectId) {
            return res
                .status(400)
                .json({ error: 'Project name and ID are required.' });
        }

        // Prepare data
        const userId = req.user.id; // Assuming req.user is populated by verifyToken middleware
        const appName = projectName.toLowerCase().replace(/\s+/g, '-');

        // Add new project
        await addNewProject(userId, projectName, projectId, appName);

        // Send success response
        res.status(201).json({ message: 'Project created successfully.' });
    } catch (error) {
        console.error('Failed to create project:', error);

        // Determine if it's a user-caused error or server error
        const statusCode = error.isClientError ? 400 : 500;

        res.status(statusCode).json({ error: error.message });
    }
});

router.delete('/project', verifyToken, async (req, res) => {
    const userId = req.user.id;
    const projectId = req.body.projectId;

    async function deleteProjectDirectory(projectId) {
        const workspaceDir = path.join(__dirname, 'workspace');
        const projectDir = path.join(workspaceDir, projectId);
        const sessionDocsPath = path.join(__dirname, 'sessionDocs');
        const documentationFileName = path.join(
            sessionDocsPath,
            `documentation_${projectId}.txt`
        );

        try {
            // Check if the project directory exists
            await fs.access(projectDir);
            // Delete the project directory recursively
            await fs.rm(projectDir, { recursive: true, force: true });
            console.log(
                `Project directory ${projectDir} deleted successfully.`
            );
        } catch (error) {
            if (error.code === 'ENOENT') {
                console.log(`Project directory ${projectDir} does not exist.`);
            } else {
                console.log(
                    `Failed to delete project directory ${projectDir}: ${error.message}`
                );
            }
        }

        try {
            // Check if the documentation file exists
            await fs.access(documentationFileName);
            // Delete the documentation file
            await fs.unlink(documentationFileName);
            console.log(
                `Documentation file ${documentationFileName} deleted successfully.`
            );
        } catch (error) {
            if (error.code === 'ENOENT') {
                console.log(
                    `Documentation file ${documentationFileName} does not exist.`
                );
            } else {
                console.log(
                    `Failed to delete documentation file ${documentationFileName}: ${error.message}`
                );
            }
        }
    }

    try {
        User.deleteProject(userId, projectId);
        await deleteProjectDirectory(projectId);
        res.status(200).json({ message: 'Project deleted successfully' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

module.exports = router;
