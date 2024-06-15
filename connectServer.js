require('dotenv').config();
const fs = require('fs');
const path = require('path');
const ProjectCoordinator = require('./projectCoordinator');
const User = require('./User.schema');
const OpenAI = require('openai');
const { generateSchemaAndRoutesPrompt } = require('./promptUtils');
const executeCommand = require('./executeCommand');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

async function connectServer(projectId, userId) {
    const projectDir = path.join(
        __dirname,
        `workspace/microServers/${projectId}`
    );

    try {
        // Initialize npm project
        await executeCommand('npm init -y', projectDir);

        // Install essential packages
        await executeCommand(
            'npm install express cors morgan dotenv',
            projectDir
        );

        // Create an initial data.json file
        const dataFilePath = path.join(projectDir, 'data.json');
        if (!fs.existsSync(dataFilePath)) {
            fs.writeFileSync(dataFilePath, JSON.stringify([]));
        }

        // Setup server with essential middleware and routes
        const serverSetupCode = `
            const express = require('express');
            const cors = require('cors');
            const morgan = require('morgan');
            const fs = require('fs');
            const path = require('path');
            const app = express();
            const PORT = process.env.PORT || 3000;
            require('dotenv').config();

            app.use(express.json());
            app.use(cors());
            app.use(morgan('dev'));

            const dataFilePath = path.join(__dirname, 'data.json');

            app.get('/${projectId}', (req, res) => {
                fs.readFile(dataFilePath, 'utf8', (err, data) => {
                    if (err) {
                        res.status(500).send('Internal Server Error');
                        return;
                    }
                    res.json(JSON.parse(data));
                });
            });

            app.post('/${projectId}', (req, res) => {
                fs.readFile(dataFilePath, 'utf8', (err, data) => {
                    if (err) {
                        res.status(500).send('Internal Server Error');
                        return;
                    }
                    const jsonData = JSON.parse(data);
                    jsonData.push(req.body);
                    fs.writeFile(dataFilePath, JSON.stringify(jsonData, null, 2), (err) => {
                        if (err) {
                            res.status(500).send('Internal Server Error');
                            return;
                        }
                        res.status(201).send('Data added');
                    });
                });
            });

            app.get('/', (req, res) => {
                res.send('Server is running');
            });

            app.listen(PORT, () => {
                console.log('Server is running on port', PORT);
            });
        `;

        const serverFilePath = path.join(projectDir, 'server.js');
        fs.writeFileSync(serverFilePath, serverSetupCode);

        console.log('Server setup complete. Ready to start.');

        // Fetch user messages
        const conversations = await User.getUserMessages(userId, projectId);
        const projectCoordinator = new ProjectCoordinator(userId, projectId);

        // Removing 'projectId' and 'time' properties from each object
        const conversationHistory = conversations.map(({ role, content }) => ({
            role,
            content,
        }));

        // Include server setup code in the prompt
        const prompt = generateSchemaAndRoutesPrompt(
            conversationHistory,
            projectId,
            serverSetupCode
        );
        User.addTokenCountToUserSubscription(userId, prompt);

        const response = await openai.chat.completions.create({
            model: 'gpt-4',
            messages: [
                {
                    role: 'system',
                    content: prompt,
                },
            ],
        });

        const rawArray = response.choices[0].message.content;
        User.addTokenCountToUserSubscription(userId, rawArray );
        const taskList = await projectCoordinator.extractAndParseJson(rawArray);

        for (const task of taskList) {
            if (task.taskType === 'Create' || task.taskType === 'Modify') {
                const filePath = path.join(
                    projectDir,
                    `${task.file.name}.${task.file.extension}`
                );

                const dir = path.dirname(filePath);

                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir, { recursive: true });
                }

                fs.writeFileSync(filePath, task.file.content);
            } else if (task.taskType === 'Install') {
                await executeCommand(`npm install ${task.package}`, projectDir);
            }
        }
    } catch (error) {
        console.error('Error parsing JSON:', error);
    }
}

module.exports = { connectServer };
