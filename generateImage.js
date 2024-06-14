const { generateImageWithDallE, downloadImage } = require('./imageGeneration');
const path = require('path');
const {
    generateImagePrompt,
    generateDataTransformationPrompt,
} = require('./promptUtils');

const createDirectory = () => {
    const dirPath = path.join(views, 'assets');
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
    return dirPath;
};

const directory = createDirectory();
const ensureDirectoryExists = (directory) => {
    if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
    }
};

ensureDirectoryExists(directory);

async function addImagesToFolder(
    data,
    conversationHistory,
    projectId,
    appName,
    userId
) {
    const projectCoordinator = new ProjectCoordinator(this.openai, projectId);
    try {
        const prompt = generateImagePrompt(data, conversationHistory);

        const response = await this.openai.chat.completions.create({
            model: 'gpt-4o',
            temperature: 0,
            response_format: { type: 'json_object' },
            messages: [
                {
                    role: 'system',
                    content: prompt,
                },
            ],
        });

        const res = response.choices[0].message.content;
        let arr = JSON.parse(res);
        const getImageResponse = await this.findFirstArray(arr);

        const dynamicName = appName;
        const workspaceDir = path.join(__dirname, 'workspace');
        const views = path.join(workspaceDir, projectId);

        const createDirectory = (dynamicName) => {
            const dirPath = path.join(views, 'assets');
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true });
            }
            return dirPath;
        };

        const directory = createDirectory(dynamicName);
        const ensureDirectoryExists = (directory) => {
            if (!fs.existsSync(directory)) {
                fs.mkdirSync(directory, { recursive: true });
            }
        };

        ensureDirectoryExists(directory);

        if (getImageResponse && getImageResponse.length > 0) {
            const rawData = await this.changeImageName(
                data,
                getImageResponse,
                userId
            );
            newData = await rawData;

            await projectCoordinator.logStep(
                'I have added data to the store.js file'
            );

            User.addMessage(
                userId,
                [
                    {
                        role: 'assistant',
                        content: `With this, I will get the images for your data: ${JSON.stringify(
                            getImageResponse,
                            null,
                            2
                        )}`,
                    },
                ],
                projectId
            );

            await generateAndDownloadImages(getImageResponse, directory);
        } else {
            console.log('No search prompts extracted from the response.');
        }
    } catch (error) {
        console.error('Error in OpenAI API call:', error);
        console.log(error);
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
                console.error(`Error processing prompt "${prompt}":`, error);
            }
        }
    }
}

async function changeImageName(data, dataResponse, userId) {
    try {
        const systemMessage = generateDataTransformationPrompt(
            data,
            dataResponse
        );

        const messages = [{ role: 'system', content: systemMessage }];

        const response = await this.openai.chat.completions.create({
            model: 'gpt-4o',
            response_format: { type: 'json_object' },
            temperature: 0,
            messages: messages,
        });
        const res = response.choices[0].message.content.trim();
        let arr = JSON.parse(res);
        const resp = await this.findFirstArray(arr);

        return resp;
    } catch (error) {
        console.error('Error in generating follow-up question:', error);
        console.log(error);
    }
}
