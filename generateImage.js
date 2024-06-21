require('dotenv').config();
const OpenAI = require('openai');
const path = require('path');
const fs = require('fs');
const { generateImageWithDallE, downloadImage } = require('./imageGeneration');
const ProjectCoordinator = require('./classes/projectCoordinator');
const UserModel = require('./User.schema');
const { generateImagePrompt } = require('./utilities/promptUtils');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Utility function for OpenAI API calls
async function openAiChatCompletion(
    systemPrompt,
    userMessage = '',
    options = {}
) {
    try {
        const messages = [{ role: 'system', content: systemPrompt }];
        if (userMessage) {
            messages.push({ role: 'user', content: userMessage });
        }

        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            ...options,
            messages,
        });

        return response.choices[0].message.content.trim();
    } catch (error) {
        console.error('OpenAI API Error:', error);
        throw error;
    }
}

// Centralized error handling
function handleError(error, context) {
    console.error(`Error in ${context}:`, error);
    return 'error';
}

// Function to ensure directory exists
function ensureDirectoryExists(directory) {
    if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
    }
}

// Ensure the base directory exists
const workspaceDir = path.join(__dirname, 'workspace');
ensureDirectoryExists(workspaceDir);

async function addImagesToFolder(
    data,
    conversationHistory,
    projectId,
    appName,
    userId
) {
    const projectCoordinator = new ProjectCoordinator(userId, projectId);

    try {
        const prompt = generateImagePrompt(data, conversationHistory);
        const res = await openAiChatCompletion(prompt, '', { temperature: 0 });
        const arr = JSON.parse(res);
        const getImageResponse = await findFirstArray(arr);

        const views = path.join(workspaceDir, projectId);
        const directory = path.join(views, 'assets');
        ensureDirectoryExists(directory);

        if (getImageResponse && getImageResponse.length > 0) {
            await generateAndDownloadImages(getImageResponse, directory);
        } else {
            console.log('No search prompts extracted from the response.');
        }
    } catch (error) {
        handleError(error, 'addImagesToFolder');
    }

    async function generateAndDownloadImages(dataResponse, directory) {
        for (const { prompt, imageName } of dataResponse) {
            try {
                const imageUrl = await generateImageWithDallE(prompt);
                if (imageUrl) {
                    await downloadImage(imageUrl, directory, imageName);
                } else {
                    console.log(`No image URL returned for prompt: ${prompt}`);
                }
            } catch (error) {
                handleError(
                    error,
                    `generateAndDownloadImages for prompt "${prompt}"`
                );
            }
        }
    }
}

async function findFirstArray(data) {
    if (Array.isArray(data)) return data;

    if (typeof data === 'object' && data !== null) {
        return Object.values(data).find(Array.isArray) || [data];
    }

    return [data];
}

module.exports = {
    addImagesToFolder,
};
