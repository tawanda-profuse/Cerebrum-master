const mongoose = require('mongoose');
const User = require('./models/User');
const countAITokens = require('./tokenCounter');
const mongoURI = process.env.MONGO_URI;

mongoose.connect(mongoURI);

mongoose.connection.on('connected', () => {
    console.log('Connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
    console.log('Error connecting to MongoDB', err);
});

const UserModel = {
    getAllUsers: async function () {
        return await User.find({});
    },
    findOne: async function (email) {
        return await User.findOne({ email });
    },
    findById: async function (id) {
        return await User.findById(id);
    },
    addUser: async function (userData) {
        const newUser = new User({
            ...userData,
            messages: [],
            projects: [],
        });
        await newUser.save();
    },
    getSubscriptionAmount: async function (userId) {
        const user = await User.findById(userId);
        if (user && user.subscriptions && user.subscriptions.length > 0) {
            const subscription = user.subscriptions[0];
            return subscription.amount;
        }
        return null;
    },
    addTokenCountToUserSubscription: async function (userId, text) {
        const user = await User.findById(userId);
        if (user) {
            if (user.subscriptions && user.subscriptions.length > 0) {
                const subscription = user.subscriptions[0];
                const additionalTokens = await countAITokens(text);
                const amountRate = 80;
                const tokenRate = 1000000;
                const cost = (additionalTokens / tokenRate) * amountRate;
                const formattedCost = parseFloat(cost.toFixed(2));

                subscription.tokenCount += additionalTokens;
                subscription.amount -= formattedCost;
                subscription.updatedAt = new Date();

                await user.save();
            } else {
                console.log('No subscriptions found for user');
            }
        } else {
            console.log(`User not found`);
        }
    },
    updateUser: async function (updatedUser) {
        const user = await User.findById(updatedUser._id);
        if (user) {
            Object.assign(user, updatedUser, { updatedAt: new Date() });
            await user.save();
            return true;
        }
        return false;
    },
    addMessage: async function (userId, messages, projectId) {
        const user = await User.findById(userId);
        if (user) {
            if (Array.isArray(messages)) {
                messages.forEach((message) => {
                    user.messages.push({
                        messageId: `${Math.random().toString(36).substr(2, 5)}-message-${Math.random().toString(36).substr(2, 10)}`,
                        ...message,
                        projectId: projectId,
                        timestamp: new Date(),
                    });
                });
            } else {
                user.messages.push({
                    messageId: `${Math.random().toString(36).substr(2, 5)}-message-${Math.random().toString(36).substr(2, 10)}`,
                    ...messages,
                    projectId: projectId,
                    imageUrl: imageUrl,
                    timestamp: new Date(),
                });
            }
            await user.save();
        }
    },
    getUserMessages: async function (userId, projectId) {
        const user = await User.findById(userId);
        if (user) {
            return projectId
                ? user.messages.filter(
                      (message) => message.projectId === projectId
                  )
                : user.messages;
        } else {
            return [];
        }
    },
    clearSketchesFromProject: async function (userId, projectId) {
        try {
            const user = await User.findById(userId);
            if (!user) {
                console.log('User not found');
                return;
            }

            const project = user.projects.find((p) => p.id === projectId);
            if (!project) {
                console.log('Project not found');
                return;
            }

            project.sketches = [];
            project.updatedAt = new Date().toISOString();

            await user.save();
            console.log('Sketches cleared successfully.');
        } catch (error) {
            console.error('Error in clearSketchesFromProject:', error);
            throw error;
        }
    },
    addSketchToProject: async function (userId, projectId, sketch) {
        try {
            const user = await User.findById(userId);
            if (!user) {
                console.log('User not found');
                return;
            }

            const project = user.projects.find((p) => p.id === projectId);
            if (!project) {
                console.log('Project not found');
                return;
            }

            if (!project.sketches) {
                project.sketches = [];
            }

            project.sketches.push(sketch);
            project.updatedAt = new Date().toISOString();

            await user.save();
            console.log('Sketch added successfully.');
        } catch (error) {
            console.error('Error in addSketchToProject:', error);
            throw error;
        }
    },
    addProject: async function (userId, projectData) {
        const user = await User.findById(userId);
        if (user) {
            const existingProjectIndex = user.projects.findIndex(
                (p) => p.id === projectData.id
            );
            if (existingProjectIndex !== -1) {
                Object.assign(
                    user.projects[existingProjectIndex],
                    projectData,
                    { updatedAt: new Date() }
                );
            } else {
                const newProject = {
                    id: projectData.id || `proj_${new Date().getTime()}`, // Generate a unique id if not provided
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    ...projectData,
                    sketches: projectData.sketches || [],
                };
                user.projects.push(newProject);
            }
            await user.save();
        }
    },
    getProjectLogs: async function (userId, projectId) {
        const user = await User.findById(userId);

        if (!user) {
            console.log(`User not found, ${where}`);
            return [];
        }

        const project = user.projects.find((p) => p.id === projectId);
        if (!project) {
            console.log('Project not found');
            return [];
        }

        if (!project.logs) {
            return [];
        }

        return project.logs.map((log) => ({
            message: log.logMessage,
            timestamp: log.timestamp,
        }));
    },
    addSystemLogToProject: async function (userId, projectId, logMessage) {
        const user = await User.findById(userId);
        if (!user) {
            console.log('User not found');
            return;
        }

        const project = user.projects.find((p) => p.id === projectId);
        if (!project) {
            console.log('Project not found');
            return;
        }

        if (!project.logs) {
            project.logs = [];
        }

        const newLog = {
            logId: `${Math.random().toString(36).substr(2, 9)}-log`,
            logMessage,
            timestamp: new Date(),
        };

        project.logs.push(newLog);

        await user.save();
    },
    addProjectOverview: async function (userId, projectId, projectOverview) {
        try {
            const user = await User.findById(userId);
            if (!user) {
                console.log('User not found');
                return;
            }

            const project = user.projects.find((p) => p.id === projectId);
            if (!project) {
                console.log('Project not found');
                return;
            }

            project.projectOverView = projectOverview;
            project.updatedAt = new Date().toISOString();

            await user.save();
            console.log('Project overview updated successfully.');
        } catch (error) {
            console.error('Error in addProjectOverview:', error);
            throw error;
        }
    },
    deleteProject: async function (userId, projectId) {
        const user = await User.findById(userId);
        if (!user) {
            console.log('User not found');
            return;
        }

        const projectIndex = user.projects.findIndex((p) => p.id === projectId);
        if (projectIndex === -1) {
            console.log('Project not found');
            return;
        }

        user.projects.splice(projectIndex, 1);
        user.messages = user.messages.filter(
            (msg) => msg.projectId !== projectId
        );
        await user.save();
    },
    removeLastSystemMessages: async function (userId, numMessages) {
        const user = await User.findById(userId);
        if (user) {
            const nonSystemMessages = user.messages.filter(
                (msg) => msg.role !== 'system'
            );
            const systemMessages = user.messages.filter(
                (msg) => msg.role === 'system'
            );
            user.messages = nonSystemMessages.concat(
                systemMessages.slice(0, -numMessages)
            );

            await user.save();
        }
    },
    getUserProjects: async function (userId) {
        const user = await User.findById(userId);
        return user ? user.projects : [];
    },
    getUserProject: async function (userId, projectId) {
        const user = await User.findById(userId);
        if (user) {
            const project = user.projects.find((p) => p.id === projectId);
            return project ? project : [];
        } else {
            return [];
        }
    },
    addTaskToProject: async function (userId, projectId, task) {
        try {
            const user = await User.findById(userId);
            if (!user) {
                console.log('User not found');
                return;
            }

            const project = user.projects.find((p) => p.id === projectId);

            if (!project) {
                console.log('Project not found');
                return;
            }

            const taskIndex = project.taskList.findIndex(
                (t) => t.name === task.name && t.extension === task.extension
            );

            if (taskIndex !== -1) {
                project.taskList[taskIndex] = task;
            } else {
                project.taskList.push(task);
            }

            await user.save();
        } catch (error) {
            console.error('Error saving user:', error);
        }
    },
};

module.exports = UserModel;
