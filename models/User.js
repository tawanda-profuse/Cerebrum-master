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
    content: String,
});

const TaskSchema = new Schema({
    id: String,
    name: String,
    extension: String,
    content: {
      type: Schema.Types.Mixed,
      validate: {
        validator: function(v) {
          return typeof v === 'string' || (typeof v === 'object' && v !== null);
        },
        message: props => `${props.value} is not a valid content type!`
      }
    }
  });

const ProjectSchema = new Schema({
    id: String,
    name: String,
    createdAt: String,
    updatedAt: String,
    messages: [MessageSchema],
    isProcessing: Boolean,
    taskList: [TaskSchema],
    appPath: String,
    logs: [
        {
            logId: String,
            logMessage: String,
            timestamp: String,
        },
    ],
    sketches: [String],
    isCompleted: Boolean,
    appName: String,
});

const SubscriptionSchema = new Schema({
    id: String,
    amount: Number,
    tokenCount: Number,
    createdAt: String,
    updatedAt: [String],
});

const UserSchema = new Schema({
    _id: {
        type: String,
        default: () => new mongoose.Types.ObjectId().toString(),
    },
    microsoftId: String,
    googleId: String,
    email: String,
    name: String,
    mobile: String,
    password: String,
    projects: [ProjectSchema],
    subscriptions: [SubscriptionSchema],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

const User = mongoose.model('User', UserSchema);

module.exports = User;
