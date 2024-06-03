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
    addSateConfigarationToComponents,
    updateStore,
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

        // Step 5: Outline the Easy Peasy store configurations
        if (lastCompletedStep < 5) {
            await getEasyPeasyConfigurationsResponse();
            autoMode.saveLastSummaryCompletedStep(5);
            lastCompletedStep = 5; // Update the last completed step
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

        // Removing 'projectId' and 'time' properties from each object
        let conversationHistory = conversations.map(({ role, content }) => {
            return { role, content };
        });
        try {
            const conversationContext = conversationHistory
                .map(({ role, content }) => `${role}: ${content}`)
                .join('\n');

            const response = await openai.chat.completions.create({
                model: 'gpt-4o',
                messages: [
                    {
                        role: 'system',
                        content: `Conversation History:\n${conversationContext}`,
                    },
                    { role: 'user', content: taskContent },
                ],
            });

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

        // Removing 'projectId' and 'time' properties from each object
        let conversationHistory = conversations.map(({ role, content }) => {
            return { role, content };
        });
        try {
            const conversationContext = conversationHistory
                .map(({ role, content }) => `${role}: ${content}`)
                .join('\n');

            const response = await openai.chat.completions.create({
                model: 'gpt-4o',
                messages: [
                    {
                        role: 'system',
                        content: `Conversation History:\n${conversationContext}`,
                    },
                    { role: 'user', content: taskContent },
                ],
            });

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
                case 'easyPeasyConfigurations':
                    systemResponse = `Easy Peasy Configurations:\n${response.choices[0].message.content}`;
                    imageDetails =
                        retrieveFromPersistentStorage('imageDetails');
                    await saveMessage(systemResponse);
                    await updateStore(
                        systemResponse,
                        imageDetails,
                        appName,
                        userId,
                        projectId
                    );
                    await addSateConfigarationToComponents(
                        systemResponse,
                        userId
                    );
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
        const detailedPrompt =
            'You are an Ai agent part of a node js autonomous system that creates beautiful and elegant React web applications  from user prompts. Your role is to provide a comprehensive and concise summary of the project requirements. Include specific details on CSS properties such as colors, dimensions, layout styles, typography, and any other relevant visual and functional features that should be considered in the design and development.';

        await makeOpenAiApiCall(detailedPrompt, 'projectDescription');

        const projectDescription = await getProjectDescription(detailedPrompt);

        globalState.setProjectOverView(userId, projectDescription);

        selectedProject.projectOverView = projectDescription;
        User.addProject(userId, selectedProject);
    }

    async function getComponentArchitectureResponse() {
        await makeOpenAiApiCall(
            `
    You are an AI agent within a Node.js autonomous system designed to create elegant React web applications from user prompts. Your task is to develop a detailed site map and component architecture. Focus on minimal components, modularity, and scalability. Adhere to these guidelines to ensure efficient and error-resistant applications:

    1. Minimal Components: If there are too many components within the React app, it becomes prone to errors. To address this, I want you to opt for the minimum number of components necessary to create the app. If the app can be made with one component (file), it should use one component so Use the minimum number of components necessary. If all code fits within 400 lines, use one component. Create additional components only if the code exceeds this limit or if an additional component or  components are needed for the application to function correctly

    2. Asset Management: Store all images and videos in the ./assets folder. For example: import image from './assets/image.png.

    3. Image Naming: Use descriptive names for images that match their corresponding components.

    4. Component Identification: List all potential components based on the user requirements. Briefly describe their purpose.

    5. Component Relationships: Describe how components interact, noting dependencies and shared functionalities.

    6. Hierarchy Definition: Define parent-child relationships and interconnections within the project.

    7. Primary Component: Identify the core component that integrates or coordinates all other components.

    8. Component Explanation: Explain each component's role and functionality, providing concise code suggestions.

    9. Modularity and Scalability: Ensure easy maintenance and future scalability with a modular design for flexibility.

    10. Integration with User Requirements: Align the architecture with user needs from the conversation history.

    11. Styling Guidelines: Use Tailwind CSS for all styling, with no separate CSS files. Tailwind is pre-configured for consistent design.

    12. Site Map Creation: Create a detailed site map outlining the structure and navigation flow of the application.

    13. Presentation: Present the site map and component architecture in a structured, clear, and comprehensive format to guide development.

    Deliverables:

    Site Map: A visual representation of the application's structure and navigation.
    Component Architecture: A detailed breakdown of components, their relationships, and code suggestions.
    Integration Plan: How the architecture aligns with user requirements and supports modularity and scalability.
    Be as concise as possible while ensuring completeness and clarity.
    
    *TAKE YOUR TIME AND ALSO MENTALLY THINK THROUGH THIS STEP BY STEP TO PROVIDE THE MOST ACCURATE AND EFFECTIVE RESULT*
    `,
            'componentArchitecture'
        );
    }

    async function getTailwindPropertiesResponse() {
        await makeOpenAiApiCall(
            `You are an Ai agent part of a node js autonomous system that creates beautiful and elegant React web applications  from user prompts . From your understanding of the current project and from your understanding of user interfaces of similar applications, Your role is to perform a detailed analysis of the requirements for developing the React & Tailwind application with a focus on aesthetics, functionality, and user experience.
 
    Your task is to create a comprehensive and concise list of all visual elements in the application, specifying their position, layout, dimensions, typography, color scheme, interactive elements, images, icons, spacing, borders, separators, responsive behavior, special effects, and accessibility features.
     
    Ensure the analysis is exhaustive, leaving no element or property to assumption

    Understand the user's design style, color palette, layout preferences, and specific element requirements, including images and set dimensions. Consider any implied or explicit needs for image sizes or specific dimensions for other elements.
    
    
    For all the components mentioned your analysis include :
    
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
    
    Incorporate Tailwind CSS properties that align with these design aesthetics, with an emphasis on grid and flexbox for layout design. Dynamically generate image and element dimensions based on user requirements and insights from similar projects. Ensure your choices maintain consistency, aesthetics, scalability, and align with the user's vision. Compile a structured list of Tailwind CSS properties and dynamic dimensions for each component,
    This document will guide the development team to efficiently and accurately implement the design, ensuring that the layout and element dimensions meet user expectations and industry standards
    
    *TAKE YOUR TIME AND ALSO MENTALLY THINK THROUGH THIS STEP BY STEP TO PROVIDE THE MOST ACCURATE AND EFFECTIVE RESULT*`,
            'tailwindProperties'
        );
    }

    // async function getImageToCSSResponse() {
    //   await makeVisionApiCall(
    //     `You are a top senior developer in an autonomous system that creates React web applications perform a detailed concise analysis of the web application sketch provided. Your output should include a comprehensive list of all visual elements as they appear from top to bottom and left to right. For each element, provide the following details:

    //   Position and Layout: Specify the exact position on the page, including distance from the top, bottom, left, and right edges, and its relation to other elements. Describe the layout structure using grid or flexbox systems.
    //   Dimension Properties: Measure width, height, and depth for each element in pixels or relative units.
    //   Typography: Identify all text elements, their font properties (size, weight, style, family), color, line-height, and text alignment.
    //   Color Scheme: List the color codes for background, text, borders, and other decorative elements.
    //   Interactive Elements: For buttons, form fields, and navigational links, describe size, color, hover states, and on-click effects.
    //   Images and Icons: Provide the size, resolution, and placement of images and icons. Describe any overlay text or effects applied.
    //   Spacing: Detail the padding, margin, and space between elements in consistent units.
    //   Borders and Separators: Describe the thickness, style, and color of any borders or section dividers.
    //   Responsive Behavior: Include media query breakpoints and how each element should adjust or reflow on different screen sizes.
    //   Special Effects: Note any shadows, gradients, or animations present and their respective properties.
    //   Accessibility Features: Mention any alt text for images, ARIA labels, or keyboard navigation instructions.
    //   Ensure the analysis is exhaustive, leaving no element or property to assumption, allowing for the precise replication of the sketch in React and Tailwind CSS code`,
    //     "imageToCSS",
    //   );
    // }

    async function getEasyPeasyConfigurationsResponse() {
        await makeOpenAiApiCall(
            `You are an Ai agent part of a node js autonomous system that creates beautiful and elegant React web applications  from user prompts, Utilize the conversation history along with the data object (if given) and component architecture to tailor Easy Peasy store configurations for the project. Your role is to develop a clear efficient, and concise state management strategy that aligns with the project's specific requirements, data (if given), and component structure.
  
      
          Guidelines for Easy Peasy Store Configurations:
          1. Data Relationship Analysis: Identify the types of data each component will handle based on the data object (if given) and component architecture. Define clear data relationships and dependencies among components.
      
          2. Structuring State Management:
             - State Variables: List all state variables required by the project, considering the data object (if given) and component needs.
             - Actions: Define actions for state manipulation relevant to the data object (if given) and component interactions.
             - Thunks: Outline thunks for asynchronous actions or side-effects, ensuring alignment with external APIs or complex logic requirements.
      
          3. Component-Specific Configurations: Specify Easy Peasy configurations for each component, including state slices, actions, and thunks, as per the component architecture.
      
          4. Scalability and Maintenance: Ensure the configuration supports scalability and easy maintenance, allowing for future project evolution.
      
          5. Alignment with Project Goals: Tailor the Easy Peasy configurations to support the overarching goals and user requirements as discussed in the conversation history, data object (if given), and component architecture.
      
          Provide a detailed and structured outline of the Easy Peasy store configurations, making it actionable for developers. Take your time while thinking this through step by step
          
          *TAKE YOUR TIME AND ALSO MENTALLY THINK THROUGH THIS STEP BY STEP TO PROVIDE THE MOST ACCURATE AND EFFECTIVE RESULT*`,
            'easyPeasyConfigurations'
        );
    }

    async function getImagesDetailsResponse() {
        await makeOpenAiApiCall(
            `You are an AI agent, part of a Node.js autonomous system that creates beautiful and elegant React web applications from user prompts. Your role is to create a detailed yet concise list of the images required for the project, including their types, quantities, specific names, dimensions, and their association with different components of the UI. This list should be based on the project's component architecture and design requirements as detailed in the conversation history. Only generate this list if the user has indicated the need for images related to the project. If the user has not mentioned or alluded to needing images, simply respond with "No images needed."

            Guidelines for Detailing Image Requirements:
            Image Imports: All images should be imported from the ./assets folder. Example: import image from './assets/image.png.
            
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
        await projectCoordinator.generateTaskList(tasks, userId);
    }
}

module.exports = {
    summarizeUserResponse,
};
