// Global object to store session-specific states
const sessionStates = {};

// Initialize session state
function initializeSessionState(sessionId) {
    if (!sessionStates[sessionId]) {
        sessionStates[sessionId] = {
            projectOverview: null,
            taskList: null,
            appPath: null,
            appName: 'my-app',
            stage: null,
            conversationHistory: [],
        };
    }
}

// Access session state
function getSessionState(sessionId) {
    return sessionStates[sessionId];
}

module.exports = {
    initializeSessionState,
    getSessionState,
};
