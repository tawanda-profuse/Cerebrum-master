// Import necessary modules and initialize environment variables
require('dotenv').config();
const { generateImageWithDallE, downloadImage } = require('./imageGeneration');
const path = require('path');
const fs = require('fs');
const fsPromises = require('fs').promises;
const { summarizeUserResponse } = require('./summarizeUserResponse');
const ProjectCoordinator = require('./projectCoordinator');
const User = require('./User.schema');
const AutoMode = require('./autoMode');

class Requirements {
    constructor(openaiInstance) {
        this.openai = openaiInstance;
        this.MAX_MAIN_QUESTIONS = 4;
        this.initialQuestions = [
            'Hi there! Im here to collect information about the application you want to build 😊.  Could you kick things off by sharing what your app is all about and what features would you like to have in your app?',
            'Have you thought about the colors and styles for the site?',
            "Do you have any specific images or logos you'd like to use in the app? If not, no worries at all! Just let me know the type of visuals you're imagining, like product photos for a store or thematic backdrops, and we'll make it happen.",
            `When creating your application, consider the type of data it requires. Please choose one of the following options regarding data provision:
    
      1. "Generate" - If you would like me to generate specific data for you, such as user profiles, product details, or content for blogs or news sites.
      2. "I have" - If you already possess the necessary data and will provide it yourself.
      3. "No data needed" - Select this option if your application does not require any additional data.
      
      Please respond with the appropriate option from the list above.
      `,
        ];

        this.systemMessage = `
        Task: Develop an Advanced Autonomous System for HTML/Tailwind CSS Projects

        Objective: As an AI assistant, your mission is to compile a comprehensive project overview for HTML/Tailwind CSS applications, focusing on user inputs and strict adherence to specified technologies and methodologies.
        
        Instructions:
        
        Strict Technology Adherence:
        Utilize exclusively HTML, Tailwind CSS, vanilla JavaScript, and custom JavaScript libraries. Firmly avoid the use of any other frameworks, libraries, or external API endpoints. All data should be internally generated and managed.
        
        Project Overview and Goals:
        Create a clear, concise task description for the HTML application, based on user inputs. Define the overarching goals of the project, aligning them with the user's vision and requirements.
        
        Element Analysis and Hierarchy:
        Autonomously identify and detail all necessary HTML elements, their hierarchy, and interrelationships, based on project needs. This process should be AI-driven, requiring no technical input from the user.
        
        Primary Section Identification:
        Independently determine the primary HTML section for integration into the main HTML file, based on logical deductions from the project overview.
        
        HTML Structure Design:
        Outline the HTML structure, focusing on modularity and scalability. Emphasize future adaptability and ease of maintenance in the design.
        
        Tailwind CSS Properties Listing:
        List all applicable Tailwind CSS properties, ensuring they match the project's design aesthetics as defined in the user's vision.
        
        Framework and Library Enumeration:
        Specify the use of the outlined libraries and frameworks, ensuring they fit the project's technical requirements.
        
        JavaScript State Management Configurations:
        Detail the configurations for state management, including global variables and actions. Align these configurations with the project's functionality and user requirements.
        
        User-Centric Methodology:
        Employ a methodical, user-centric approach to extract precise requirements from non-technical users. Adapt queries based on user responses, ensuring all project aspects are thoroughly and accurately addressed.
        
        Deliverable:
        A detailed project overview for an HTML/Tailwind CSS application, constructed autonomously. This overview should align with user requirements and the specified technological framework, emphasizing the exclusive use of internal data and the avoidance of external API endpoints. The final product should serve as a clear, user-friendly blueprint for application development.
    `;
    }

    async getWebsiteRequirements(projectId, appName, userId) {
        const autoMode = new AutoMode('./autoModeRequirements.json', projectId);
        let lastAskedQuestionIndex = autoMode.getLastAskedQuestionIndex() || 0;
        let lastCompletedStep = autoMode.getLastCompletedStep() || 0;

        // Step 1: Iterate through initial questions
        if (lastCompletedStep < 1) {
            for (
                let i = lastAskedQuestionIndex;
                i < this.MAX_MAIN_QUESTIONS;
                i++
            ) {
                const question = this.initialQuestions[i];
                await this.getUserResponse(question, userId, projectId);
                autoMode.saveLastAskedQuestionIndex(i + 1);
            }
            autoMode.saveLastCompletedStep(1);
            lastCompletedStep = 1; // Update the last completed step
        }

        // The logic for checking and handling if data is needed
        if (lastCompletedStep < 2) {
            const isDataNeeded = await this.doesUserWantToProvideData(
                userId,
                projectId
            );

            if (isDataNeeded) {
                const hasData = await this.doesUserHaveData(projectId, userId);
                if (hasData) {
                    await this.getDataFromUser(projectId, appName, userId);
                } else {
                    setTimeout(async () => {
                        User.addMessage(
                            userId,
                            [
                                {
                                    role: 'assistant',
                                    content: 'I will generate the data for you',
                                },
                            ],
                            projectId
                        );
                    }, 5000);

                    await this.generateData(projectId, appName, userId);
                }
                setTimeout(async () => {
                    // Save the message to the database instead of emitting it via Socket.IO
                    User.addMessage(
                        userId,
                        [
                            {
                                role: 'assistant',
                                content:
                                    'Awesome! I have all the data I need. Now we will start building your application. This will take a while, feel free to reach out in the meantime...',
                            },
                        ],
                        projectId
                    );
                }, 4000);
            } else {
                const dynamicName = appName;
                const workspaceDir = path.join(__dirname, 'workspace');
                const projectDir = path.join(workspaceDir, projectId);

                const createDirectory = (dynamicName) => {
                    const dirPath = path.join(
                        projectDir,
                        dynamicName,
                        'assets'
                    );
                    if (!fs.existsSync(dirPath)) {
                        fs.mkdirSync(dirPath, { recursive: true });
                        console.log(`Created directory: ${dirPath}`);
                    }
                    return dirPath;
                };

                const directory = createDirectory(dynamicName);
                const ensureDirectoryExists = (directory) => {
                    if (!fs.existsSync(directory)) {
                        fs.mkdirSync(directory, { recursive: true });
                        console.log(`Created directory: ${directory}`);
                    }
                };

                ensureDirectoryExists(directory);

                await this.carryOn(userId, projectId);
                setTimeout(async () => {
                    // Save the message to the database instead of emitting it via Socket.IO
                    User.addMessage(
                        userId,
                        [
                            {
                                role: 'assistant',
                                content:
                                    'Awesome! I have everything I need. Now we will start building your application. This will take a while, feel free to reach out in the meantime...',
                            },
                        ],
                        projectId
                    );
                }, 3000);
            }

            autoMode.saveLastCompletedStep(2);
            lastCompletedStep = 2; // Update the last completed step
        }

        // Final step: Create the project overview
        if (lastCompletedStep < 3) {
            await this.createProjectOverview(projectId, appName, userId);
        }
    }

    async carryOn(userId, projectId) {
        User.addMessage(
            userId,
            [
                {
                    role: 'system',
                    content: `For this type of application, the user does not need to provide any data.`,
                },
            ],
            projectId
        );
    }

    async findFirstArray(data) {
        if (Array.isArray(data)) {
            return data;
        }

        // If data is an object, find the first array property
        if (typeof data === 'object' && data !== null) {
            const firstArray = Object.values(data).find((value) =>
                Array.isArray(value)
            );
            if (firstArray) {
                return firstArray;
            }
        }

        // If no array is found, return the data wrapped in an array
        return [data];
    }

    async doesUserHaveData(projectId, userId) {
        let conversations = await User.getUserMessages(userId, projectId);

        // Removing 'projectId' and 'time' properties from each object
        let conversationHistory = conversations.map(({ role, content }) => {
            return { role, content };
        });
        while (true) {
            // Use a loop to repeatedly ask for input until valid input is received
            try {
                // Validate the conversation history
                if (
                    !Array.isArray(conversationHistory) ||
                    conversationHistory.length === 0
                ) {
                    throw new Error('Invalid or empty conversation history');
                }

                // Find the last user message
                const lastUserMessage = conversationHistory
                    .slice()
                    .reverse()
                    .find((msg) => msg.role === 'user').content;

                if (!lastUserMessage) {
                    throw new Error(
                        'No user message found in conversation history'
                    );
                }

                // Use regex to check for user's response
                const regex = /\b(i have|generate)\b/i;
                const match = regex.exec(lastUserMessage);

                if (match) {
                    switch (match[0].toLowerCase()) {
                        case 'i have':
                            return true; // User has their own data
                        case 'generate':
                            return false; // User indicates no external data is needed
                    }
                } else {
                    // Prompt for correct input
                    const promptMessage = `Please respond with either:
            1. "Generate" - If you would like me to generate specific data for you.
            2. "I have" - If you already possess the necessary data and will provide it yourself.`;
                    setTimeout(async () => {
                        // Save the prompt message to the database instead of emitting it via Socket.IO
                        User.addMessage(
                            userId,
                            [
                                {
                                    role: 'assistant',
                                    content: promptMessage,
                                },
                            ],
                            projectId
                        );
                    }, 5000);

                    await this.getUserResponse(
                        promptMessage,
                        userId,
                        projectId
                    );

                    // Continue the loop to process the new response
                    continue;
                }
            } catch (error) {
                console.error('Error in analyzing user response:', error);
                throw error; // Handle errors appropriately
            }
        }
    }

    async doesUserWantToProvideData(userId, projectId) {
        let conversations = await User.getUserMessages(userId, projectId);

        // Removing 'projectId' and 'time' properties from each object
        let conversationHistory = conversations.map(({ role, content }) => {
            return { role, content };
        });
        while (true) {
            // Use a loop to repeatedly ask for input
            try {
                // Validate the conversation history
                if (
                    !Array.isArray(conversationHistory) ||
                    conversationHistory.length === 0
                ) {
                    throw new Error('Invalid or empty conversation history');
                }

                // Find the last user message
                const lastUserMessage = conversationHistory
                    .slice()
                    .reverse()
                    .find((msg) => msg.role === 'user').content;

                if (!lastUserMessage) {
                    throw new Error(
                        'No user message found in conversation history'
                    );
                }

                // Use regex to check for user's response
                const regex = /\b(generate|i have|no data needed)\b/i;
                const match = regex.exec(lastUserMessage);

                if (match) {
                    switch (match[0].toLowerCase()) {
                        case 'generate':
                        case 'i have':
                            return true; // User wants AI to generate data or has their own data
                        case 'no data needed':
                            return false; // User indicates no external data is needed
                    }
                } else {
                    // Prompt for correct input
                    const promptMessage = `Please respond with either:
            1. "Generate" - If you would like me to generate specific data for you.
            2. "I have" - If you already possess the necessary data and will provide it yourself.
            3. "No data needed" - Select this option if your application does not require any additional data.`;
                    await this.getUserResponse(
                        promptMessage,
                        userId,
                        projectId
                    );

                    // Continue the loop to process the new response
                    continue;
                }
            } catch (error) {
                console.error('Error in analyzing user response:', error);
                throw error; // Handle errors appropriately
            }
        }
    }

    async formatInputToJSONUsingAI(input, conversationHistory, userId) {
        // Validate and preprocess input
        if (!input || input.trim() === '{') {
            console.error(
                'Invalid or incomplete input. Please provide detailed and structured data.'
            );
            return; // Exit the function early if the input is invalid or incomplete
        }
        try {
            // Construct a detailed instruction message for the AI
            const systemMessage = `You are an Ai agent part of a node js autonomous system that creates beautiful and elegant HTML web applications  from user prompts your role is  to format diverse user inputs into well-structured JSON objects. Process inputs such as user profiles, product information, transaction records, portfolio items, blog posts, or news articles, transforming them into JSON format.
  
      For structured data like user profiles or product details, create JSON objects with relevant fields. Each product should have fields like 'id', 'name', 'price', 'quantity', 'description', and a placeholder for an 'image'. For unstructured data like blog posts or articles, encapsulate them in a JSON object with fields like 'title', 'content', 'author', and 'timestamp'.
      
      When you receive user input, analyze its nature and convert it into a structured JSON object. Ensure that for products, each item is represented as a separate object within an array, maintaining a consistent structure across all entries.
      
      Here's an example of the expected output for a list of products:
  
      [
        {
          "products": [
            {
              "id": 1,
              "name": "Product Name",
              "price": "Price",
              "quantity": Quantity,
              "description": "Description",
              "image": "Placeholder_for_image"
            },
            // Additional product objects follow the same structure
          ]
        }
      ]
      
  
      Conversation History: ${JSON.stringify(conversationHistory)}
  
      User Input: "${input}"
      
      Please get full context, then return a well-structured JSON object that represents the input accurately.

      *TAKE YOUR TIME AND ALSO MENTALLY THINK THROUGH THIS STEP BY STEP TO PROVIDE THE MOST ACCURATE AND EFFECTIVE RESULT*
      `;

            const messages = [{ role: 'system', content: systemMessage }];

            // Call the AI model
            const response = await this.openai.chat.completions.create({
                model: 'gpt-4o',
                messages: messages,
                response_format: { type: 'json_object' },
                temperature: 0,
            });

            // Retrieve the AI's interpretation of the JSON from the response
            const res = response.choices[0].message.content;
            let arr = JSON.parse(res);
            const aiResponse = await this.findFirstArray(arr);

            return aiResponse;
        } catch (e) {
            // Handle errors (e.g., parsing error, invalid AI response)
            console.error('Error in formatting input to JSON:', e);
            throw e;
        }
    }

    async generateData(projectId, appName, userId) {
        let conversations = await User.getUserMessages(userId, projectId);

        // Removing 'projectId' and 'time' properties from each object
        let conversationHistory = conversations.map(({ role, content }) => {
            return { role, content };
        });
        const systemMessage = `You are an Ai agent part of a node js autonomous system that creates beautiful and elegant HTML web applications  from user prompts, based on your understanding of the conversation history and the user's requirements.
  
  Your role is to generate the relevant data needed for the HTML application. This based on whats needed should be either structured data, like profiles, products etc.., or unstructured data, like blog posts, articles , about us, site info etc... Ensure that the data includes all necessary fields, and add unique placeholder names for images related to each item, encapsulate the content in a JSON object with appropriate fields.
  
  Conversation History: ${JSON.stringify(conversationHistory)}
  
  Please return a well-structured JSON array of objects that represents the data to be used in the HTML application, take your time and think this through.
  
    Example response format:
    
    [
      {
        "products": [
          {
            "id": 1,
            "name": "Product Name",
            "price": "Price",
            "quantity": Quantity,
            "description": "Description",
            "image": "Placeholder_for_image"
          },
          // Additional product objects follow the same structure
        ]
      }
    ]
  
    *TAKE YOUR TIME AND ALSO MENTALLY THINK THROUGH THIS STEP BY STEP TO PROVIDE THE MOST ACCURATE AND EFFECTIVE RESULT*
    `;
        const messages = [{ role: 'system', content: systemMessage }];

        // Call the AI model

        const response = await this.openai.chat.completions.create({
            model: 'gpt-4o',
            messages: messages,
            response_format: { type: 'json_object' },
            temperature: 0,
        });

        const res = response.choices[0].message.content;
        let arr = JSON.parse(res);
        const aiResponse = await this.findFirstArray(arr);

        await this.addImagesToFolder(
            aiResponse,
            conversationHistory,
            projectId,
            appName,
            userId
        );
    }

    async getDataFromUser(projectId, appName, userId) {
        let conversations = await User.getUserMessages(userId, projectId);

        // Removing 'projectId' and 'time' properties from each object
        let conversationHistory = conversations.map(({ role, content }) => {
            return { role, content };
        });
        let promptMessage = `Great, I have noted your requirements. For me to proceed, please provide the data needed for the application in the format of an array of objects below, for any data which requires images just write "image":"" and I will do the rest.
      For example: [{
        users: [
          { "id": 1, "name": "Alice", "age": 30, "image":"" },
          { "id": 2, "name": "Bob", "age": 25, "image":"" }
        ],
        products: [
          { "id": 101, "name": "Apple", "color": "Red", "image":"" },
          { "id": 102, "name": "Banana", "color": "Yellow", "image":"" }
        ],
        sales: [
          { "saleId": 201, "userId": 1, "productId": 101, "quantity": 5 },
          { "saleId": 202, "userId": 2, "productId": 102, "quantity": 10 }
        ]
      }]
    `;

        while (true) {
            let userInput;
            const rawData = await this.getUserResponse(
                promptMessage,
                userId,
                projectId
            );
            userInput = rawData.message;

            // User Input Validation
            if (!userInput || userInput.trim() === '') {
                console.error('Invalid input: Input is empty.');
                promptMessage =
                    "It seems you've entered an empty response. Please provide the necessary data in the format mentioned earlier: ";
                continue;
            }

            try {
                let data = await this.formatInputToJSONUsingAI(
                    userInput,
                    conversationHistory,
                    userId
                );
                // Check if the AI's response includes a valid JSON object
                if (!data) {
                    throw new Error('AI did not return a valid JSON object.');
                }

                await this.addImagesToFolder(
                    data,
                    conversationHistory,
                    projectId,
                    appName,
                    userId
                );

                break; // Break the loop if the data is valid
            } catch (e) {
                console.error('Error processing input:', e.message);
                promptMessage =
                    "There was an error processing your input. Please ensure it's in the correct format and try again: ";
            }
        }
    }

    async addImagesToFolder(
        data,
        conversationHistory,
        projectId,
        appName,
        userId
    ) {
        let newData = [];
        const projectCoordinator = new ProjectCoordinator(
            this.openai,
            projectId
        );
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
            const projectDir = path.join(workspaceDir, projectId);

            const createDirectory = (dynamicName) => {
                const dirPath = path.join(
                    projectDir,
                    dynamicName,
                    'assets'
                );
                if (!fs.existsSync(dirPath)) {
                    fs.mkdirSync(dirPath, { recursive: true });
                    console.log(`Created directory: ${dirPath}`);
                }
                return dirPath;
            };

            const directory = createDirectory(dynamicName);
            const ensureDirectoryExists = (directory) => {
                if (!fs.existsSync(directory)) {
                    fs.mkdirSync(directory, { recursive: true });
                    console.log(`Created directory: ${directory}`);
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
            throw error;
        }

        async function generateAndDownloadImages(dataResponse, directory) {
            for (const { prompt, imageName } of dataResponse) {
                try {
                    const imageUrl = await generateImageWithDallE(prompt);

                    if (imageUrl) {
                        await downloadImage(imageUrl, directory, imageName);
                    } else {
                        console.log(
                            `No image URL returned for prompt: ${prompt}`
                        );
                    }
                } catch (error) {
                    console.error(
                        `Error processing prompt "${prompt}":`,
                        error
                    );
                }
            }
        }
    }

    async changeImageName(data, dataResponse, userId) {
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
            throw error;
        }
    }

    async createProjectOverview(projectId, appName, userId) {
        const projectCoordinator = new ProjectCoordinator(
            this.openai,
            projectId
        );
        let conversations = await User.getUserMessages(userId, projectId);

        // Removing 'projectId' and 'time' properties from each object
        let conversationHistory = conversations.map(({ role, content }) => {
            return { role, content };
        });
        const conversationContext = conversationHistory
            .map(({ role, content }) => `${role}: ${content}`)
            .join('\n');

        await projectCoordinator.imagePicker(conversationContext, userId);
        const summary = await summarizeUserResponse(projectId, appName, userId);
        // Construct the final project overview
        let overview = 'Project Overview:\n' + summary;
        return overview;
    }

    // Function to get response from user input
    async getUserResponse(question, userId, projectId) {
        // Save the assistant's message
        User.addMessage(
            userId,
            [{ role: 'assistant', content: question, awaitingResponse: true }],
            projectId
        );

        // Function to check for the user's response
        function checkForResponse() {
            return new Promise((resolve, reject) => {
                const checkInterval = setInterval(() => {
                    // Read the latest user data
                    const currentUser = User.findById(userId);
                    if (currentUser) {
                        // Assuming the last message from the user is the response
                        const lastMessage =
                            currentUser.messages[
                                currentUser.messages.length - 1
                            ];
                        // Check if the last message is a user's response after the assistant's question
                        if (lastMessage && lastMessage.role === 'user') {
                            clearInterval(checkInterval);
                            resolve(lastMessage);
                        }
                    }
                }, 1000); // Check every 1 second
            });
        }

        // Wait for the user's response
        try {
            const userResponse = await checkForResponse();
            return userResponse; // This is the user's response
        } catch (error) {
            console.error('Error waiting for user response:', error);
            throw error;
        }
    }
}

module.exports = Requirements;
