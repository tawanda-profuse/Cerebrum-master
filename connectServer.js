require('dotenv').config();
const ProjectCoordinator = require('./projectCoordinator');
const User = require('./User.schema');
const OpenAI = require('openai');
const { generateSchemaAndRoutesPrompt } = require('./promptUtils');
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

async function connectServer(projectId, userId) {
    let conversations = await User.getUserMessages(userId, projectId);
    const projectCoordinator = new ProjectCoordinator(openai, projectId);

    // Removing 'projectId' and 'time' properties from each object
    let conversationHistory = conversations.map(({ role, content }) => {
        return { role, content };
    });

    const prompt = generateSchemaAndRoutesPrompt(
        conversationHistory,
        projectId
    );

    const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
            {
                role: 'system',
                content: prompt,
            },
        ],
    });

    const rawArray = response.choices[0].message.content;
    try {
        const parsedArray =
            await projectCoordinator.extractAndParseJson(rawArray);

        const schemasAndRoutes = [];
        parsedArray.forEach(async (file) => {
            const filePath = path.join(
                __dirname,
                `workspace/modelsAndRoutes/${projectId}`,
                `${file.name}.${file.extension}`
            );

            const dir = path.dirname(filePath);

            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            fs.writeFileSync(filePath, file.content);
        });
        // Update the routes configuration file
        await updateRoutesConfig(projectId);

        // Call the main server to reload routes
        await axios.post('http://localhost:5001/reload-routes');
        return schemasAndRoutes;
    } catch (error) {
        console.error('Error parsing JSON:', error);
    }

    async function updateRoutesConfig(projectId) {
        const routesConfigPath = path.join(
            __dirname,
            'workspace/routesConfig.json'
        );
        let routesConfig = [];

        if (fs.existsSync(routesConfigPath)) {
            routesConfig = JSON.parse(
                fs.readFileSync(routesConfigPath, 'utf8')
            );
        }

        const newRoute = {
            endpoint: `/api/${projectId}`,
            filePath: `workspace/modelsAndRoutes/${projectId}/${projectId}Routes.js`,
        };

        // Check if the route already exists
        if (
            !routesConfig.some((route) => route.endpoint === newRoute.endpoint)
        ) {
            routesConfig.push(newRoute);
            fs.writeFileSync(
                routesConfigPath,
                JSON.stringify(routesConfig, null, 2),
                'utf8'
            );
            console.log('Routes configuration updated.');
        } else {
            console.log('Route already exists.');
        }
    }
}

module.exports = { connectServer };
