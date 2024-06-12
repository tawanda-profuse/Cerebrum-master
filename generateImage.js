const { generateImageWithDallE, downloadImage } = require('./imageGeneration');
const path = require('path');

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
        const prompt = `
        You are an Ai agent part of a node js autonomous system that creates beautiful and elegant HTML web applications. Your role involves using 'Data' and 'Conversation History' to generate essential images for the project using DALL-E.

        Data: ${JSON.stringify(data, null, 2)},
        Conversation History: ${JSON.stringify(conversationHistory)}

        Your task is as follows:

        1. If the 'Data' object is not null, identify the specific image requirements that will enhance the application's UI/UX based on this data.
        2. If the 'Data' object is null, analyze the 'Conversation History' to determine if any images are needed based on user discussions and requirements.
        3. For each required image, construct an object within an array that includes:
        a. A detailed DALL-E prompt for generating a single image. This prompt should specify the type of image needed, its purpose within the UI components, ideal dimensions for a perfect fit, and adaptability for various screen sizes and device types.
        b. A suggested filename for the image, which should be succinct, descriptive, and follow standard file naming conventions.
        4. Use your understanding of the image relative to the project to suggest dimensions that will not cause misalignment within the application.

        The output should always be a JSON array of objects, even if only one image is needed. Each object in the array must contain:
        - A 'prompt' field with a non-empty string describing the image generation prompt.
        - An 'imageName' field with a non-empty string providing the suggested filename for the image.

        ALWAYS RETURN A JSON OBJECT WITH THOSE TWO PROPERTIES LIKE THE EXAMPLE BELOWF:

        [
        {
            "prompt": "Generate a high-resolution image of a beautiful curly afro wig that gives a natural look. The wig should be displayed on a mannequin head with a neutral background. The image should be 800x800 pixels to fit perfectly within product catalog components and adaptable to different screen sizes and device types.",
            "imageName": "curly_afro_wig.jpg"
        }
        ]

        Ensure that both 'prompt' and 'imageName' fields are always present and non-empty. This structured approach ensures that we can dynamically generate specific image prompts for DALL-E, tailored to the precise requirements of the project based on the 'Data' object or 'Conversation History'.

        NEVER return just an object like this => {
        prompt: "Generate a high-resolution image of a beautiful curly afro wig that gives a natural look. The wig should be displayed on a mannequin head with a neutral background. The image should be 800x800 pixels to fit perfectly within product catalog components and adaptable to different screen sizes and device types.",
        imageName: "curly_afro_wig.jpg"
        }. it should alsways be an array.

        *TAKE YOUR TIME AND ALSO MENTALLY THINK THROUGH THIS STEP BY STEP TO PROVIDE THE MOST ACCURATE AND EFFECTIVE RESULT*
        `;

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
        const systemMessage = `You are an Ai agent part of a node js autonomous system that creates beautiful and elegant HTML web applications  from user prompts, your role is tasked with a specific data transformation job. You are to modify the 'image' property values in Original Data to match with the 'imageName' values provided in dataResponse. Each object in your dataset contains various properties, including an 'image' property that currently holds an old image name. You are also provided with the 'dataResponse', which is an array of objects. Each object in this array contains two properties: 
  
  1. 'prompt' - a description of the image.
  2. 'imageName' - the new name for the image.

    Original Data: ${JSON.stringify(data, null, 2)}

    dataResponse: ${JSON.stringify(dataResponse, null, 2)}

    Your task is to:

    1. Iterate through each object in the original dataset.
    2. For each object, find a corresponding object in 'dataResponse' where the description in the 'prompt' property closely matches the context or content of the original object.
    3. Replace the 'image' property value in the Original Data's object with the 'imageName' from the corresponding object in 'dataResponse'.
    4. If no matching description is found in 'dataResponse', leave the 'image' property value as is.
    5. The image value should just be the name of the image, not the full path. Ensure the updated 'image' property contains only the image name, excluding any directories or paths, to maintain consistency and simplicity in data handling.
    6. Return the modified dataset.

    Here is an example to illustrate:

    Original Data:
    [
    { ..., image: "" },
    { ..., image: "" }
    ]

    dataResponse:
    [
    { ..., imageName: "new_beach_sunset.jpg" },
    { ..., imageName: "new_mountain_hike.jpg" }
    ]

    Expected Output:
    [
    { ..., image: "new_beach_sunset.jpg" },
    { ..., image: "new_mountain_hike.jpg" }
    ]

    Please return the modified JSON object only!.
    
    *TAKE YOUR TIME AND ALSO MENTALLY THINK THROUGH THIS STEP BY STEP TO PROVIDE THE MOST ACCURATE AND EFFECTIVE RESULT*`;

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
