// models/User.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const MessageSchema = new Schema({
    messageId: String,
    text: String,
    imageUrl: String,
    projectId: String,
    timestamp: String,
    role: String,
});

const TaskSchema = new Schema({
    id: String,
    name: String,
    extension: String,
    content: String,
});

const ProjectSchema = new Schema({
    id: String,
    name: String,
    createdAt: String,
    updatedAt: String,
    projectOverView: String,
    taskList: [TaskSchema],
    appPath: String,
    logs: [
        {
            logId: String,
            logMessage: String,
            timestamp: String,
        },
    ],
    sketches: [String], // Assuming sketches are stored as an array of strings
    isCompleted: Boolean,
    appName: String,
    stage: Number,
});

const SubscriptionSchema = new Schema({
    id: String,
    amount: Number,
    tokenCount: Number,
    createdAt: String,
    updatedAt: String,
    // other subscription fields
});

const UserSchema = new Schema({
    id: String,
    microsoftId: String,
    email: String,
    name: String,
    messages: [MessageSchema],
    projects: [ProjectSchema],
    subscriptions: [SubscriptionSchema],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

const User = mongoose.model('User', UserSchema);

module.exports = User;
