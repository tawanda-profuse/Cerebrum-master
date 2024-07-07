// routes/projects.js or routes/api_v2_router.js
const express = require('express');
const router = express.Router();
const logger = require('../logger');
const UserModel = require('../models/User.schema');
const { verifyToken } = require('../utilities/functions');
const s3FileManager = require('../s3FileManager');

// GET route for fetching user projects
router.get('/', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const projects = await UserModel.getUserProjects(userId);
        res.send(projects);
    } catch (error) {
        logger.info('Error fetching projects:', error);
        res.status(500).send('Internal Server Error');
    }
});

async function checkSubscriptionAmount(userId) {
    try {
        const subscriptionAmount = await UserModel.getSubscriptionAmount(userId);
        if (subscriptionAmount < 3) {
            throw new Error('Insufficient credit');
        }
        await UserModel.updateUserProfileWithPayment(userId, -2);
    } catch (error) {
        throw error;
    }
}

// POST route for downloading project files
router.post('/download', verifyToken, async (req, res) => {
    try {
        const { projectId } = req.body;
        const userId = req.user.id;
        
        // Check subscription amount before proceeding with download
        await checkSubscriptionAmount(userId);

        // If checkSubscriptionAmount doesn't throw an error, proceed with download
        await s3FileManager.downloadProject(res, projectId);
    } catch (error) {
        if (error.message === 'Insufficient credit') {
            return res.status(400).json({ message: 'You don\'t have enough credit to download the project files.' });
        }
        logger.error('Error processing download request:', error);
        if (!res.headersSent) {
            res.status(500).json({ message: 'Error processing the download request. Please try again later.' });
        }
    }
});

async function addNewProject(userId, projectName, id, appName) {
    try {
        const user = await UserModel.findById(userId);
        if (!user) {
            logger.info('User not found');
        }

        const newProject = {
            id: id,
            name: projectName,
            createdAt: new Date().toISOString(),
            isProcessing: false,
            taskList: [],
            appPath: null,
            logs: [],
            sketches: [],
            appName: appName,
            isCompleted: false,
        };

        await UserModel.addProject(userId, newProject);
    } catch (error) {
        logger.info('Error adding new project:', error);
    }
}

router.post('/create-project', verifyToken, async (req, res) => {
    try {
        const { projectName, projectId } = req.body;
        if (!projectName || !projectId) {
            return res
                .status(400)
                .json({ error: 'Project name and ID are required.' });
        }

        const userId = req.user.id;
        const appName = projectName.toLowerCase().replace(/\s+/g, '-');

        await addNewProject(userId, projectName, projectId, appName);

        res.status(201).json({ message: 'Project created successfully.' });
    } catch (error) {
        logger.info('Failed to create project:', error);
        const statusCode = error.isClientError ? 400 : 500;
        res.status(statusCode).json({ error: error.message });
    }
});

router.delete('/project', verifyToken, async (req, res) => {
    const userId = req.user.id;
    const projectId = req.body.projectId;

    try {
        await UserModel.deleteProject(userId, projectId);
        await s3FileManager.deleteFolder(projectId);
        res.status(200).json({ message: 'Project deleted successfully' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

module.exports = router;
