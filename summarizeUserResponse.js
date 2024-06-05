// Import necessary modules and initialize environment variables
require('dotenv').config();
const OpenAI = require('openai');
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});
const ProjectCoordinator = require('./projectCoordinator');
const globalState = require('./globalState');
const User = require('./User.schema');
const AutoMode = require('./autoMode');
const {
    createComponentFiles,
    addTailwindPropertiesToComponents,
    saveToPersistentStorage,
    retrieveFromPersistentStorage,
} = require('./summary.utils');

async function summarizeUserResponse(projectId, appName, userId) {
    const projectCoordinator = new ProjectCoordinator(openai, projectId);
    const autoMode = new AutoMode('./autoModeSummaryState.json', projectId);
    let lastCompletedStep = autoMode.getLastSummaryCompletedStep() || 0;

    try {
        // Step 1: Summarize the project description
        if (lastCompletedStep < 1) {
            await getDescriptionResponse();
            autoMode.saveLastSummaryCompletedStep(1);
            lastCompletedStep = 1; // Update the last completed step
        }

        // Step 2: Describe the component architecture
        if (lastCompletedStep < 2) {
            await getComponentArchitectureResponse();
            autoMode.saveLastSummaryCompletedStep(2);
            lastCompletedStep = 2; // Update the last completed step
        }

        // Step 3: List all relevant Tailwind CSS properties
        if (lastCompletedStep < 3) {
            await getTailwindPropertiesResponse();
            autoMode.saveLastSummaryCompletedStep(3);
            lastCompletedStep = 3; // Update the last completed step
        }

        // Step 4: Generate colored divs for UI placeholders
        if (lastCompletedStep < 4) {
            await getImagesDetailsResponse();
            autoMode.saveLastSummaryCompletedStep(4);
            lastCompletedStep = 4; // Update the last completed step
        }

       

        // Step 6: Consolidate all the responses into a document
        if (lastCompletedStep < 6) {
            await consolidateResponses();
            autoMode.saveLastSummaryCompletedStep(6);
        }
    } catch (error) {
        console.error('Error generating project overview:', error);
        return null;
    }

    async function getProjectDescription(taskContent) {
        let conversations = await User.getUserMessages(userId, projectId);
        const selectedProject = User.getUserProject(userId, projectId)[0];
        const imageArray = await projectCoordinator.fetchImages();
        let { imageId } = selectedProject;
        const selectedImage = imageId
            ? imageArray.find((image) => image.id === imageId)
            : null;

        // Removing 'projectId' and 'time' properties from each object
        let conversationHistory = conversations.map(({ role, content }) => {
            return { role, content };
        });
        try {
            const conversationContext = conversationHistory
                .map(({ role, content }) => `${role}: ${content}`)
                .join('\n');
            let response;
            if (selectedImage) {
                response = await openai.chat.completions.create({
                    model: 'gpt-4o',
                    messages: [
                        {
                            role: 'user',
                            content: [
                                {
                                    type: 'text',
                                    text: `Conversation History:\n${conversationContext}\n\n${taskContent}`,
                                },
                                {
                                    type: 'image_url',
                                    image_url: {
                                        url: `${selectedImage.url}`,
                                    },
                                },
                            ],
                        },
                    ],
                });
            } else {
                response = await openai.chat.completions.create({
                    model: 'gpt-4o',
                    messages: [
                        {
                            role: 'system',
                            content: `Conversation History:\n${conversationContext}`,
                        },
                        { role: 'user', content: taskContent },
                    ],
                });
            }

            const systemResponse = response.choices[0].message.content;
            return systemResponse;
        } catch (error) {
            console.error('Error generating project description:', error);
            return null;
        }
    }

    // Generic function to make OpenAI API calls
    async function makeOpenAiApiCall(taskContent, action) {
        let conversations = await User.getUserMessages(userId, projectId);

        const selectedProject = User.getUserProject(userId, projectId)[0];

        // Removing 'projectId' and 'time' properties from each object
        let conversationHistory = conversations.map(({ role, content }) => {
            return { role, content };
        });
        try {
            const conversationContext = conversationHistory
                .map(({ role, content }) => `${role}: ${content}`)
                .join('\n');

            const imageArray = await projectCoordinator.fetchImages();
            let { imageId } = selectedProject;
            const selectedImage = imageId
                ? imageArray.find((image) => image.id === imageId)
                : null;

            let response;
            if (selectedImage) {
                response = await openai.chat.completions.create({
                    model: 'gpt-4o',
                    messages: [
                        {
                            role: 'user',
                            content: [
                                {
                                    type: 'text',
                                    text: `Conversation History:\n${conversationContext}\n\n${taskContent}`,
                                },
                                {
                                    type: 'image_url',
                                    image_url: {
                                        url: `${selectedImage.url}`,
                                    },
                                },
                            ],
                        },
                    ],
                });
            } else {
                response = await openai.chat.completions.create({
                    model: 'gpt-4o',
                    messages: [
                        {
                            role: 'system',
                            content: `Conversation History:\n${conversationContext}`,
                        },
                        { role: 'user', content: taskContent },
                    ],
                });
            }

            let systemResponse, projectDes, imageDetails;

            switch (action) {
                case 'projectDescription':
                    systemResponse = `Project Description:\n${response.choices[0].message.content}`;
                    await saveMessage(systemResponse);
                    saveToPersistentStorage(
                        'projectDescription',
                        systemResponse
                    );
                    break;
                case 'componentArchitecture':
                    systemResponse = `Component Architecture:\n${response.choices[0].message.content}`;
                    await saveMessage(systemResponse);
                    projectDes =
                        retrieveFromPersistentStorage('projectDescription');
                    await createComponentFiles(
                        systemResponse,
                        projectDes,
                        appName,
                        projectId
                    );
                    break;
                case 'tailwindProperties':
                    systemResponse = `Tailwind CSS Properties:\n${response.choices[0].message.content}`;
                    await saveMessage(systemResponse);
                    await addTailwindPropertiesToComponents(systemResponse);
                    break;
                case 'imageToCSS':
                    systemResponse = `Provided image sketch analysis:\n${response.choices[0].message.content}`;
                    await saveMessage(systemResponse);
                    break;
                case 'imagesDetails':
                    systemResponse = `Image Details:\n${response.choices[0].message.content}`;
                    await saveMessage(systemResponse);
                    saveToPersistentStorage('imageDetails', systemResponse);
                    break;
                default:
                    break;
            }

            async function saveMessage(systemResponse) {
                User.addMessage(
                    userId,
                    [
                        {
                            role: 'system',
                            content: systemResponse,
                        },
                    ],
                    projectId
                );
            }
        } catch (apiError) {
            console.error('Error in OpenAI API call:', apiError);
            throw apiError;
        }
    }

    // Specific functions updated to use the generic API call function
    async function getDescriptionResponse() {
        const selectedProject = User.getUserProject(userId, projectId)[0];
    
        const detailedPrompt = `You are an AI agent, part of a Node.js autonomous system that creates beautiful and elegant HTML/Tailwind web applications from user prompts. The image/s if provided serves as a template or visual guide, to give you a concrete reference of the user's vision and design preferences. It ensures that the resulting application aligns closely with the user's expectations. Your role is to provide a comprehensive and concise summary of the project requirements. Include specific details on CSS properties such as colors, dimensions, layout styles, typography, and any other relevant visual and functional features that should be considered in the design and development.`;
    
        await makeOpenAiApiCall(detailedPrompt, 'projectDescription');
    
        const projectDescription = await getProjectDescription(detailedPrompt);
    
        globalState.setProjectOverView(userId, projectDescription);
    
        selectedProject.projectOverView = projectDescription;
        User.addProject(userId, selectedProject);
    }

    async function getComponentArchitectureResponse() {
        await makeOpenAiApiCall(
            `You are an AI agent within a Node.js autonomous system designed to create elegant HTML/Tailwind web applications from user prompts. The image/s if provided serves as a template or visual guide, to give you a concrete reference of the user's vision and design preferences. It ensures that the resulting application aligns closely with the user's expectations. Your task is to develop a detailed site map and HTML structure based on the image sketch if provided. Focus on creating a close variation of the sketch while emphasizing minimal components, modularity, and scalability. These principles are crucial to ensure that the applications are efficient, maintainable, and easy to extend.
    
    1. Minimal Components: Use the minimum number of HTML elements necessary. Avoid excessive nesting and use semantic HTML tags appropriately.
    
    2. Asset Management: Store all images and videos in the ./assets folder.
    
    3. Image Naming: Use descriptive names for images that match their corresponding components.
    
    4. HTML Structure: List all potential sections and elements based on the user requirements. Briefly describe their purpose.
    
    5. Element Relationships: Describe how elements interact, noting dependencies and shared functionalities.
    
    6. Hierarchy Definition: Define parent-child relationships and interconnections within the project.
    
    7. Primary Section: Identify the core section that integrates or coordinates all other sections.
    
    8. Element Explanation: Explain each element's role and functionality, providing concise HTML snippets.
    
    9. Modularity and Scalability: Ensure easy maintenance and future scalability with a modular design for flexibility.
    
    10. Integration with User Requirements: Align the architecture with user needs from the conversation history.
    
    11. Styling Guidelines: Use Tailwind CSS for all styling, with no separate CSS files.
    
    12. Site Map Creation: Create a detailed site map outlining the structure and navigation flow of the application.
    
    13. Presentation: Present the site map and HTML structure in a structured, clear, and comprehensive format to guide development.
    
    Deliverables:
    
    Site Map: A visual representation of the application's structure and navigation.
    HTML Structure: A detailed breakdown of elements, their relationships, and HTML snippets.
    Integration Plan: How the structure aligns with user requirements and supports modularity and scalability.
    
    Be as concise as possible while ensuring completeness and clarity.
    
    *TAKE YOUR TIME AND ALSO MENTALLY THINK THROUGH THIS STEP BY STEP TO PROVIDE THE MOST ACCURATE AND EFFECTIVE RESULT*
    `,
            'componentArchitecture'
        );
    }

    async function getTailwindPropertiesResponse() {
        await makeOpenAiApiCall(
            `You are an AI agent, part of a Node.js autonomous system that creates beautiful and elegant HTML/Tailwind web applications from user prompts. The image/s if provided serves as a template or visual guide, to give you a concrete reference of the user's vision and design preferences. Your role is to perform a detailed analysis of the requirements for developing the HTML & Tailwind application with a focus on aesthetics, functionality, and user experience.
    
    Your task is to create a comprehensive and concise list of all visual elements in the application, specifying their position, layout, dimensions, typography, color scheme, interactive elements, images, icons, spacing, borders, separators, responsive behavior, special effects, and accessibility features.
    
    Ensure the analysis is exhaustive, leaving no element or property to assumption.
    
    Understand the user's design style, color palette, layout preferences, and specific element requirements, including images and set dimensions. Consider any implied or explicit needs for image sizes or specific dimensions for other elements.
    
    For all the components mentioned your analysis include:
    
    - Position and Layout: Define each element's position on the page, including its distance from the edges and relation to other elements. Use grid or flexbox systems to describe the layout structure.
    
    - Dimension Properties: Measure each element in pixels or relative units, including width, height, and depth.
    
    - Typography: Detail all text elements, specifying font size, weight, style, family, color, line-height, and text alignment.
    
    - For images use your understanding of the image relative to the project to suggest dimensions that will not cause misalignment within the application.
    
    - Color Scheme: List color codes for the background, text, borders, and other decorative elements.
    
    - Interactive Elements: Describe buttons, form fields, and links, focusing on size, color, hover states, and on-click effects.
    
    - Images and Icons: Provide size, resolution, and placement details. Include any overlay text or effects.
    
    - Spacing: Detail padding, margin, and space between elements.
    
    - Borders and Separators: Describe thickness, style, and color.
    
    - Responsive Behavior: Include media query breakpoints and adjustments for different screen sizes.
    
    - Special Effects: Note shadows, gradients, animations, and their properties.
    
    - Accessibility Features: Mention alt text, ARIA labels, and keyboard navigation.
    
    Incorporate Tailwind CSS properties that align with these design aesthetics, with an emphasis on grid and flexbox for layout design. Dynamically generate image and element dimensions based on user requirements and insights from similar projects. Ensure your choices maintain consistency, aesthetics, scalability, and align with the user's vision. Compile a structured list of Tailwind CSS properties and dynamic dimensions for each component.
    
    This document will guide the development team to efficiently and accurately implement the design, ensuring that the layout and element dimensions meet user expectations and industry standards.
    
    *TAKE YOUR TIME AND ALSO MENTALLY THINK THROUGH THIS STEP BY STEP TO PROVIDE THE MOST ACCURATE AND EFFECTIVE RESULT*`,
            'tailwindProperties'
        );
    }


    async function getImagesDetailsResponse() {
        await makeOpenAiApiCall(
            `You are an AI agent, part of a Node.js autonomous system that creates beautiful and elegant HTML/Tailwind web applications from user prompts. The image/s if provided serves as a template or visual guide, to give you a concrete reference of the user's vision and design preferences. Your role is to create a detailed yet concise list of the images required for the project, including their types, quantities, specific names, dimensions, and their association with different components of the UI. This list should be based on the project's component architecture and design requirements as detailed in the conversation history. Only generate this list if the user has indicated the need for images related to the project. If the user has not mentioned or alluded to needing images, simply respond with "No images needed."
    
    Guidelines for Detailing Image Requirements:
    
    Image Imports: All images should be stored in the ./assets folder.
    
    Image Naming: All image names should align with the component or data (if given) they are associated with.
    
    Image Analysis: Identify and list the types of images needed for each component in the architecture, such as headers, footers, or content sections.
    
    Image Naming and Quantities: Specify the names and quantities of images required for each component, aligning with the project's content and functional needs.
    
    Dimension Specifications: Detail the specific dimensions for each image to ensure they fit seamlessly into the UI components.
    
    Component Association: Clearly indicate which images are required for each component within the UI architecture, facilitating accurate placement and integration.
    
    Design and Styling Considerations: Include any relevant information regarding the style or aesthetic of the images, ensuring alignment with the overall design and frameworks like Tailwind CSS.
    
    Dimensions: Specify the corresponding width and height of each image in pixels.
    
    Present this information in a format that clearly outlines the image requirements, aiding in the streamlined development and accurate realization of the project's UI design as per the component architecture and conversation history.
    
    *TAKE YOUR TIME AND ALSO MENTALLY THINK THROUGH THIS STEP BY STEP TO PROVIDE THE MOST ACCURATE AND EFFECTIVE RESULT*`,
            'imagesDetails'
        );
    }

    async function consolidateResponses() {
        let conversations = await User.getUserMessages(userId, projectId);

        // Remove the last 'n' system messages, where 'n' is a dynamic number
        User.removeLastSystemMessages(userId, 5);

        // Retrieve the conversations again to see the changes
        conversations = await User.getUserMessages(userId, projectId);

        const tasks = retrieveFromPersistentStorage('tasks');
        console.log('tasks', tasks)
        await projectCoordinator.generateTaskList(tasks, userId);
    }
}

module.exports = {
    summarizeUserResponse,
};
