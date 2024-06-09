const fs = require('fs');
const path = require('path');

class GlobalState {
    constructor() {
        this.sessionsFile = path.join(__dirname, 'sessions.json'); // Define the path to the JSON file
        this.sessions = this.loadSessions();
    }

    loadSessions() {
        try {
            if (!fs.existsSync(this.sessionsFile)) {
                fs.writeFileSync(this.sessionsFile, '{}', 'utf8');
            }
            const data = fs.readFileSync(this.sessionsFile, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error('Error handling sessions file:', error);
            return {};
        }
    }

    saveSessions() {
        try {
            const data = JSON.stringify(this.sessions, null, 2);
            fs.writeFileSync(this.sessionsFile, data, 'utf8');
        } catch (error) {
            console.error('Error writing sessions to file:', error);
        }
    }

    initializeSession(userId) {
        if (!this.sessions[userId]) {
            this.sessions[userId] = {
                projectOverView: '',
                awaitingRequirements: false,
                awaitingProjectName: false,
                userId: userId,
            };
            this.saveSessions();
        }
    }

    setAwaitingProjectName(userId, enabled) {
        if (this.sessions[userId]) {
            this.sessions[userId].awaitingProjectName = enabled;
            this.saveSessions();
        }
    }

    getAwaitingProjectName(userId) {
        return this.sessions[userId]
            ? this.sessions[userId].awaitingProjectName
            : false;
    }

    setAwaitingRequirements(userId, enabled) {
        if (this.sessions[userId]) {
            this.sessions[userId].awaitingRequirements = enabled;
            this.saveSessions();
        }
    }

    getAwaitingRequirements(userId) {
        return this.sessions[userId]
            ? this.sessions[userId].awaitingRequirements
            : false;
    }

    setProjectOverView(userId, description) {
        if (this.sessions[userId]) {
            this.sessions[userId].projectOverView = description;
            this.saveSessions();
        }
    }

    getProjectOverView(userId) {
        return this.sessions[userId]
            ? this.sessions[userId].projectOverView
            : '';
    }

    setSessionId(userId, id) {
        if (this.sessions[userId]) {
            this.sessions[userId].userId = id;
            this.saveSessions();
        }
    }

    getSessionId(userId) {
        return this.sessions[userId] ? this.sessions[userId].userId : '';
    }
}

const globalState = new GlobalState();

module.exports = globalState;
