const fs = require('fs');
const path = require('path');
// File path for the users data
const usersFilePath = path.join(__dirname, './usersfile.json');
const countAITokens = require('./tokenCounter');
const crypto = require('crypto');

function generateHash(content) {
    return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
}

function writeUsersData(users) {
    fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
}

// Function to read users data from file
function readUsersData() {
    if (!fs.existsSync(usersFilePath)) {
        fs.writeFileSync(usersFilePath, JSON.stringify([]));
    }
    const data = fs.readFileSync(usersFilePath);
    return JSON.parse(data);
}

// User model
const User = {
    users: readUsersData(),
    findOne: function (email) {
        return this.users.find((user) => user.email === email);
    },
    findById: function (id) {
        return this.users.find((user) => user.id === id);
    },
    addUser: function (userData) {
        this.users.push({
            ...userData,
            messages: [],
            projects: [],
            createdAt: new Date().toISOString(),
        });
        writeUsersData(this.users);
    },
    getSubscriptionAmount: function (userId) {
        const user = this.findById(userId);
        if (user && user.subscriptions && user.subscriptions.length > 0) {
            const subscription = user.subscriptions[0]; // Assuming the first subscription
            return subscription.amount;
        }
        return null; // Return null if no subscriptions found or user not found
    },    
    addTokenCountToUserSubscription: async function (userId, text,where='') {
        const user = User.findById(userId);
        if (user) {
            if (user.subscriptions && user.subscriptions.length > 0) {
                const subscription = user.subscriptions[0]; // Assuming the first subscription
                const additionalTokens = await countAITokens(text);
                const amountRate = 80; // Amount in USD
                const tokenRate = 1000000; // Amount of tokens per amount in USD
                const cost = (additionalTokens / tokenRate) * amountRate; // Calculate the cost for the additional tokens
                const formattedCost = parseFloat(cost.toFixed(2)); // Convert the cost to 2 decimal places
            
                // Update the token count and amount
                subscription.tokenCount += additionalTokens;
                subscription.amount -= formattedCost;
                subscription.updatedAt = new Date().toISOString(); // Update the timestamp
            
                writeUsersData(this.users); // Save the changes
            } else {
                console.log('No subscriptions found for user');
            }
        } else {
            console.log(`User not found1, ${where}`);
        }
    },
    updateUser: function (updatedUser) {
        const index = this.users.findIndex(
            (user) => user.id === updatedUser.id
        );
        if (index !== -1) {
            this.users[index] = {
                ...this.users[index],
                ...updatedUser,
                updatedAt: new Date().toISOString(),
            };
            writeUsersData(this.users);
            return true;
        }
        return false;
    },
    addMessage: function (userId, messages, projectId,imageUrl = null) {
        const user = this.findById(userId);
        if (user) {
            // Check if messages is an array
            if (Array.isArray(messages)) {
                // If it's an array, handle each message individually
                messages.forEach((message) => {
                    user.messages.push({
                        messageId: `${Math.random()
                            .toString(36)
                            .substr(2, 5)}-message-${Math.random()
                            .toString(36)
                            .substr(2, 10)}`,
                        ...message,
                        projectId: projectId,
                        imageUrl: imageUrl,
                        timestamp: new Date().toISOString(),
                    });
                });
            } else {
                // If it's a single message, handle it directly
                user.messages.push({
                    messageId: `${Math.random()
                        .toString(36)
                        .substr(
                            2,
                            5
                        )}-message-${Math.random().toString(36).substr(2, 10)}`,
                    ...messages,
                    projectId: projectId,
                    timestamp: new Date().toISOString(),
                });
            }
            writeUsersData(this.users);
        }
    },
    getUserMessages: function (userId, projectId) {
        const user = this.findById(userId);
        if (user) {
            // Filter messages by projectId if provided
            return projectId
                ? user.messages.filter(
                      (message) => message.projectId === projectId
                  )
                : user.messages;
        } else {
            return [];
        }
    },
    addProject: function (userId, projectData) {
        const user = this.findById(userId);
    if (user) {
        const existingProjectIndex = user.projects.findIndex(
            (p) => p.id === projectData.id
        );
        if (existingProjectIndex !== -1) {
            // Update the existing project
            user.projects[existingProjectIndex] = {
                ...user.projects[existingProjectIndex],
                ...projectData,
                updatedAt: new Date().toISOString(), // Optional: to track when it was updated
            };
        } else {
            // Add a new project
            const newProject = {
                id: projectData.id || Date.now().toString(), // Use provided ID or generate a new one
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(), // Optional
                ...projectData,
                sketches: [], // Initialize sketches array if not present
            };
            user.projects.push(newProject);
        }

        writeUsersData(this.users);
    }
    },
    getProjectLogs: function (userId, projectId, where = '') {
        const user = this.findById(userId);
        if (!user) {
            console.log(`User not found2, ${where}`);
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
    
        return project.logs.map(log => ({
            message: log.message,
            timestamp: log.timestamp,
        }));
    },
    addSystemLogToProject: function (userId, projectId, logMessage) {
        const user = this.findById(userId);
        if (!user) {
            console.log('User not found3');
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
            timestamp: new Date().toISOString(),
        };
    
        project.logs.push(newLog);
    
        // Persist changes
        writeUsersData(this.users);
    },
    deleteProject: function (userId, projectId) {
        const user = this.findById(userId);
        if (!user) {
            console.log('User not found4');
        }

        const projectIndex = user.projects.findIndex((p) => p.id === projectId);
        if (projectIndex === -1) {
            console.log('Project not found');
        }

        user.projects.splice(projectIndex, 1);
        // Loop through the messages array in reverse order to safely remove elements
        for (let i = user.messages.length - 1; i >= 0; i--) {
            if (user.messages[i].projectId === projectId) {
                user.messages.splice(i, 1);
            }
        }
        writeUsersData(this.users);
    },
    removeLastSystemMessages: function (userId, numMessages) {
        const user = this.findById(userId);
        if (user) {
            // Filter out non-system messages
            const nonSystemMessages = user.messages.filter(
                (msg) => msg.role !== 'system'
            );
            // Keep all but the last 'numMessages' system messages
            const systemMessages = user.messages.filter(
                (msg) => msg.role === 'system'
            );
            user.messages = nonSystemMessages.concat(
                systemMessages.slice(0, -numMessages)
            );

            // Save the updated users data
            writeUsersData(this.users);
        }
    },
    getUserProjects: function (userId) {
        const user = this.findById(userId);
        return user ? user.projects : [];
    },
    getUserProject: function (userId, projectId) {
        const user = this.findById(userId);
        if (user) {
            const project = user.projects.find((p) => p.id === projectId);
            return project ? [project] : [];
        } else {
            return [];
        }
    },
    addTaskToProject: function (userId, projectId, task) {
        const user = this.findById(userId);
        if (!user) {
            console.log('User not found5');
            return;
        }

        const project = user.projects.find((p) => p.id === projectId);
        if (!project) {
            console.log('Project not found');
            return;
        }

        if (!project.taskList) {
            project.taskList = [];
        }

        // Find if the task already exists
        const existingTaskIndex = project.taskList.findIndex(
            (t) => t.name === task.name && t.extension === task.extension
        );

        if (existingTaskIndex !== -1) {
            // Update the existing task
            project.taskList[existingTaskIndex] = task;
        } else {
            // Add new task
            project.taskList.push(task);
        }

        // Persist changes
        writeUsersData(this.users);
    },
};

module.exports = User;