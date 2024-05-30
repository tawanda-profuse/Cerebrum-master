const fs = require('fs');

class AutoMode {
    constructor(filePath, projectId) {
        this.filePath = filePath;
        this.projectId = projectId;
        this.state = {};

        this._loadState();
    }

    saveLastAskedQuestionIndex(index) {
        this.saveState('lastAskedQuestionIndex', index);
    }

    getLastAskedQuestionIndex() {
        return this.getState('lastAskedQuestionIndex');
    }

    saveLastCompletedStep(step) {
        this.saveState('lastCompletedStep', step);
    }

    saveLastSummaryCompletedStep(step) {
        this.saveState('lastSummaryCompletedStep', step);
    }

    getLastSummaryCompletedStep() {
        return this.getState('lastSummaryCompletedStep');
    }

    getLastCompletedStep() {
        return this.getState('lastCompletedStep');
    }

    _loadState() {
        if (fs.existsSync(this.filePath)) {
            const savedState = fs.readFileSync(this.filePath, 'utf8');
            this.state = JSON.parse(savedState) || {};
        }
        if (!this.state[this.projectId]) {
            this.state[this.projectId] = {}; // Initialize state for this projectId if not exists
        }
    }

    saveSessionId(projectId) {
        this.projectId = projectId;
        if (!this.state[projectId]) {
            this.state[projectId] = {};
        }
        fs.writeFileSync(this.filePath, JSON.stringify(this.state), 'utf8');
    }

    getSessionId() {
        return this.projectId;
    }

    saveState(key, value) {
        if (!this.state[this.projectId]) {
            this.state[this.projectId] = {};
        }
        this.state[this.projectId][key] = value;
        fs.writeFileSync(this.filePath, JSON.stringify(this.state), 'utf8');
    }

    getState(key) {
        if (
            this.state[this.projectId] &&
            this.state[this.projectId][key] !== undefined
        ) {
            return this.state[this.projectId][key];
        }
        return null; // Return null if the key doesn't exist
    }

    resetState() {
        this.state[this.projectId] = {};
        fs.writeFileSync(this.filePath, JSON.stringify(this.state), 'utf8');
    }

    // Method to delete the state for a specific projectId
    deleteProjectState(projectId) {
        if (this.state[projectId]) {
            delete this.state[projectId];
            fs.writeFileSync(this.filePath, JSON.stringify(this.state), 'utf8');
            console.log(`State for project ${projectId} deleted successfully.`);
        } else {
            console.log(`No state found for project ${projectId}.`);
        }
    }
}

module.exports = AutoMode;
