const fs = require('fs');
const path = require('path');
// File path for the users data
const usersFilePath = path.join(__dirname, './usersfile.json');

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
    addMessage: function (userId, messages, projectId) {
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
                };
                user.projects.push(newProject);
            }
            writeUsersData(this.users);
        }
    },
    deleteProject: function (userId, projectId) {
        const user = this.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        const projectIndex = user.projects.findIndex((p) => p.id === projectId);
        if (projectIndex === -1) {
            throw new Error('Project not found');
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
            throw new Error('User not found');
        }

        const project = user.projects.find((p) => p.id === projectId);
        if (!project) {
            throw new Error('Project not found');
        }

        if (!project.taskList) {
            project.taskList = [];
        }

        // Find if the task already exists
        const existingTaskIndex = project.taskList.findIndex(
            (t) => t.taskName === task.taskName && t.fileName === task.fileName
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
