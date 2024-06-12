require('dotenv').config();
const ProjectCoordinator = require('./projectCoordinator');
const User = require('./User.schema');
const OpenAI = require('openai');
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});


async function connectServer(projectId, userId) {
        let conversations = await User.getUserMessages(userId, projectId);
        const projectCoordinator = new ProjectCoordinator(
            openai,
            projectId
        );

        // Removing 'projectId' and 'time' properties from each object
        let conversationHistory = conversations.map(({ role, content }) => {
            return { role, content };
        });

        const prompt = `
        Based on the following Conversation History, generate a JSON array of two objects containing the MongoDB schema with nested objects and the Express API routes js file. The schema should be defined using Mongoose and the routes js file should include CRUD operations. Use the projectId as the collection name. Ensure that all necessary data is within one schema as nested objects.

        Conversation History: ${JSON.stringify(conversationHistory)}

        ProjectId = ${projectId}

        Example JSON structure with example schema and routes js file:
        [
                {
                "name": "${projectId}Schema",
                "extension": "js",
                "content": "const mongoose = require('mongoose');\nconst ${projectId}Schema = new mongoose.Schema({\n  user: {\n    username: { type: String, required: true },\n    email: { type: String, required: true },\n    password: { type: String, required: true },\n    createdAt: { type: Date, default: Date.now }\n  },\n  products: [{\n    name: { type: String, required: true },\n    price: { type: Number, required: true },\n    description: { type: String, required: true },\n    category: { type: String, required: true },\n    stock: { type: Number, required: true },\n    createdAt: { type: Date, default: Date.now }\n  }],\n  payments: [{\n    amount: { type: Number, required: true },\n    date: { type: Date, required: true },\n    method: { type: String, required: true }\n  }]\n});\nmodule.exports = mongoose.model('${projectId}', ${projectId}Schema);"
            },
            {
                "name": "${projectId}Routes",
                "extension": "js",
                "content": "const express = require('express');\nconst router = express.Router();\nconst ${projectId} = require('./models/${projectId}');\nrouter.post('/${projectId}', async (req, res) => {\n  const newData = new ${projectId}(req.body);\n  await newData.save();\n  res.status(201).send(newData);\n});\nrouter.get('/${projectId}', async (req, res) => {\n  const data = await ${projectId}.find();\n  res.status(200).send(data);\n});\nrouter.get('/${projectId}/:id', async (req, res) => {\n  const data = await ${projectId}.findById(req.params.id);\n  if (!data) return res.status(404).send();\n  res.status(200).send(data);\n});\nrouter.patch('/${projectId}/:id', async (req, res) => {\n  const data = await ${projectId}.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });\n  if (!data) return res.status(404).send();\n  res.status(200).send(data);\n});\nrouter.delete('/${projectId}/:id', async (req, res) => {\n  const data = await ${projectId}.findByIdAndDelete(req.params.id);\n  if (!data) return res.status(404).send();\n  res.status(200).send(data);\n});\nmodule.exports = router;"
            }

        ]

        Instructions:
        1. Generate a MongoDB schema with nested objects for each required entity. The schema should include necessary fields for example users, products, payments, or other relevant data points as applicable.
        2. Generate Express route files with CRUD operations (Create, Read, Update, Delete) for the schema.
        3. Ensure the generated code is in JavaScript.
        4. Use the projectId as the collection name.
        5. Return only the JSON array of objects as the final output and nothing else.

        Important:
        - Take your time to think through each step carefully.
        - Ensure the schema includes nested objects and covers all necessary data points.
        - Ensure the routes cover all CRUD operations and are correctly referenced.
        - Ensure the code is fully functional and production-ready.
        - Ensure the JSON array contains the schema and the accompanying routes js file. Do not return just one object.

        **RETURN A COMPLETE AND PROPER JSON RESPONSE, TAKE YOUR TIME**
        `;

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
