const { promisify } = require('util');
const exec = promisify(require('child_process').exec);

function executeCommand(command, workingDirectory = process.cwd()) {
    return new Promise((resolve, reject) => {
        exec(command, { cwd: workingDirectory }, (error, stdout, stderr) => {
            if (error) {
                reject(`Error: ${error.message}`);
                return;
            }
            if (stderr) {
                reject(`Stderr: ${stderr}`);
                return;
            }
            resolve(stdout);
        });
    });
}

module.exports = executeCommand;
