const User = require('./User.schema');

    function createPrompt(taskDetails, promptToCodeWriterAi) {
        const text = `
            You will be acting as an AI that takes user prompts and generates web application code. I will provide you with the full project task list, a task details JSON object, and instructions for generating the code. Your goal is to carefully review this information and generate a JSON array containing objects representing the code for each necessary file, following the instructions exactly.
    
            Here is the task details JSON object:
            ${JSON.stringify(taskDetails, null, 2)}
    
            Here is the full project task list for full context:
            ${JSON.stringify(this.taskList, null, 2)}
    
            Here are the instructions for generating the code, which I will refer to as promptToCodeWriterAi:
            ${promptToCodeWriterAi}
    
            Please take some time to think through the steps to generate the code properly in the scratchpad below:
            Scratchpad:
            1. Identify all the pages and files that will be needed based on the task details and promptToCodeWriterAi instructions.
            2. For each identified page or file:
            a. Determine the appropriate name and file extension.
            b. Generate the complete code content, ensuring it is fully functional and follows all instructions, handling all necessary logic, and not omitting any required elements.
            c. Create a JSON object with "name", "extension", and "content" properties for this file.
            d. Add this JSON object to the final JSON array.
            3. Double check that the JSON array includes all necessary files for the application to function correctly, and that all code follows the provided instructions.
            4. Return only the JSON array as the final response, with no further explanation.
    
            Now, generate the JSON array containing objects for each file's code, following the promptToCodeWriterAi instructions carefully. Remember:
            - Include all referenced pages and files.
            - Ensure the JavaScript handles all application logic.
            - Provide complete, functional, production-ready code, with no placeholders or omissions.
            - Do not attempt any network or API calls unless specifically instructed.
            - Return only the JSON array, with no further explanation.
    
            RETURN ONLY THE JSON ARRAY WITH NO FURTHER EXPLANATION!!
        `;
        
        return text;
    }
    
    function createMoreContext(
        taskDetails,
        fileContent,
        promptToCodeWriterAi
    ) {
        const text = `
            Your task is to modify the given HTML, EJS or JS file based on the provided modification instructions. Ensure the updated code is complete, functional, and ready to use.
    
            Focus Areas:
            - Project Overview
            - Task List
            - Assets folder contents
    
            Here are the details of the modification task you need to perform:
    
            Modification task:
            ${JSON.stringify(taskDetails, null, 2)}
    
            Here is the existing code in the file you need to modify:
    
            Existing file content:
            ${JSON.stringify(fileContent, null, 2)}
    
            Here are the specific instructions for the modifications you need to make:
    
            Modification Instructions:
            ${promptToCodeWriterAi}
    
            Carefully review the modification task details, the existing file content, and the modification instructions provided above. 
    
            Scratchpad:
            Think through this task step-by-step:
            - Identify the specific parts of the existing code that need to be modified based on the instructions
            - Determine how to integrate the requested changes with the existing code
            - Make sure the modifications will result in complete, functional code that fully implements the instructions
            - Double check that the updated code doesn't have any placeholders or omissions and is ready to use as-is
    
            Now provide the complete, updated code with the requested modifications fully integrated and implemented:
    
            Return the complete, updated code for the file.
    
            *TAKE YOUR TIME AND ALSO MENTALLY THINK THROUGH THIS STEP BY STEP TO PROVIDE THE MOST ACCURATE AND EFFECTIVE RESULT*
        `;
        
        return text;
    }
    
    function generateSchemaAndRoutesPrompt(conversationHistory, projectId) {
        const text = `
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
        
        return text;
    }
    
    function generateDetailedPrompt() {
        const text = `
            You are an AI agent within a Node.js autonomous system specializing in creating elegant and functional HTML web applications using Tailwind CSS. Your task is to interpret user prompts, to deliver high-quality HTML-Tailwind web applications that align with the user's vision and design preferences.
    
            Your role is to provide a comprehensive and concise summary of the user's requirements, ensuring clarity and precision. Improve and refine the user request to ensure it accurately reflects the desired outcome and can be translated into a functional and aesthetically pleasing web application. At any point if there is any need for any mock data mention the creation of a data.json file.
        `;
        
        return text;
    }
    
    function generateWebAppPrompt(projectOverView) {
        const text = `
        You will be creating a fully functional HTML-Tailwind web application based on a provided project description. Your task is to structure the application's code as a JSON array of objects, where each object represents a separate file (e.g., HTML, JavaScript) with properties for the file name, extension, and content.
    
        Here is the project description: ${projectOverView}
    
        Example JSON structure:
        [
            {
                "name": "index",
                "extension": "html",
                "content": "full HTML code here"
            },
            {
                "name": "script",
                "extension": "js",
                "content": "full JavaScript code here"
            },
            {
                "name": "data",
                "extension": "json",
                "content": "mock data here"
            }
            // Add other files as needed
        ]
    
        When creating the HTML-Tailwind web application, adhere to the following requirements:
        - Use HTML and Tailwind CSS for the structure and styling of the application. Do not create separate CSS files or use any additional CSS frameworks.
        - Structure the application's code as a JSON array of objects, with each object representing a separate file (e.g., HTML, JavaScript).
        - Include all referenced pages or files as objects in the JSON array, ensuring that the application can function correctly without any missing components.
        - Use Tailwind CSS for all styling purposes, and ensure that the JavaScript file handles the application's logic.
        - Provide all required files (HTML, JavaScript, etc.) as separate objects within the JSON array.
        - Do not attempt to make any network or API calls unless specifically instructed to do so in the project description.
        - Ensure that the code is fully functional, production-ready, and does not contain any placeholders or omitted sections.
    
        When generating the application:
        - Take your time to think through each step carefully, ensuring that all files are correctly referenced and included.
        - At any point if there is any need for any mock data, create a data.json file and use JavaScript to pass the data to the Pages.
        - Return only the JSON array of objects as the final output, without any additional comments or explanations.
    
        Remember, the JSON array should contain multiple objects, each representing a separate file required for the application to function properly. Do not return just a single object.
    
        Reflection:
        Before you begin, take a moment to carefully review the project description to ensure you have a clear understanding of the user's requirements. Plan out the necessary components and structure of the application, considering how to best organize the code using HTML, Tailwind CSS, and JavaScript.
    
        Result:
        Return the fully functional web application as a JSON array of objects, adhering to the specified requirements and ensuring that all necessary files and components are included. The application should be production-ready and align with the user's expectations based on the provided project description.
    `;
        
        return text;
    }
    
    function generateImagePrompt(data, conversationHistory) {
        const text = `
            You are an AI agent part of a Node.js autonomous system that creates beautiful and elegant HTML web applications. Your role involves using 'Data' and 'Conversation History' to generate essential images for the project using DALL-E.
    
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
    
            ALWAYS RETURN A JSON OBJECT WITH THOSE TWO PROPERTIES LIKE THE EXAMPLE BELOW:
    
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
            }. it should always be an array.
    
            *TAKE YOUR TIME AND ALSO MENTALLY THINK THROUGH THIS STEP BY STEP TO PROVIDE THE MOST ACCURATE AND EFFECTIVE RESULT*
        `;
        
        return text;
    }
    
    function generateDataTransformationPrompt(data, dataResponse) {
        const text = `
        You are an AI agent part of a Node.js autonomous system that creates beautiful and elegant HTML web applications from user prompts. Your role is tasked with a specific data transformation job. You are to modify the 'image' property values in Original Data to match with the 'imageName' values provided in dataResponse. Each object in your dataset contains various properties, including an 'image' property that currently holds an old image name. You are also provided with the 'dataResponse', which is an array of objects. Each object in this array contains two properties: 
        
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
        
        *TAKE YOUR TIME AND ALSO MENTALLY THINK THROUGH THIS STEP BY STEP TO PROVIDE THE MOST ACCURATE AND EFFECTIVE RESULT*
    `;
        
        return text;
    }
    
    function generateSentimentAnalysisPrompt(
        conversationHistory,
        projectOverView
    ) {
        const text = `
            You are an AI agent from Yedu AI, part of a Node.js autonomous system that creates web applications, sytems and games for users. Your primary role is advanced sentiment to figure out the best one word response.
            For this properly distinguish between different types of user messages by carefully analyzing the context and intent, like simple greetings without any specific request or intent (e.g., 'Hello', 'Hi there', 'Good morning'), or messages that do not relate to web application creation or modification, such as casual conversation or unrelated queries and user explicitly expresses a desire to create a new web application where the user mentions modifications to an existing application.
            
            Current conversation history: ${JSON.stringify(conversationHistory, null, 2)},
           
            Project Overview: ${JSON.stringify(projectOverView, null, 2)}
    
            First, determine if there is an existing project by checking if the project overview is provided or null.
    
            Analyze the entire conversation history to gain more context. Follow these guidelines strictly and always return only one word as the response:
    
    
            1. New Web Application: If the message indicates a request to create or have built a new web application, we will start gathering the user's requirements, mostly the user's color/style preferences and the features or purpose of the site. RETURN ONLY ONE WORD: "getRequirements".
    
            1b. From the conversation history about creating the web application, if we still don't know at least two things - the user's color/style preferences and the features or purpose of the site, RETURN ONLY ONE WORD: "getRequirements". The questions regarding these user's requirements should not exceed 3 based on the conversation history.
    
            2. From the conversation history, once we have the user's requirements, mostly two things - the user's color/style preferences and the features or purpose of the site, RETURN ONLY ONE WORD: "createApplication".
    
            3. Modify Existing Application: If Project Overview is not null and the message pertains to modifying the existing application in any way, including adding new features, changing design, or updating content, begin the modification process and RETURN ONLY ONE WORD: "modifyApplication".
    
            4. General Inquiries and Project Details: For queries related to general inquiries, or any other requests that do not fall under the creation or modification conditions, RETURN ONLY ONE WORD: "generalResponse".
    
            5. Connect Server to Existing Application: If Project Overview is not null and the message pertains to the existing application and indicates or you see the need to connect a server to an existing application for purposes such as using MongoDB, enhancing performance, adding security measures, or any other server-related functionality, including data management, API integration, or user authentication, begin the server integration process and RETURN ONLY ONE WORD: "connectServer".
    
            6. If you see the user telling to just create the app, game , application , even without the full requirements just RETURN ONLY ONE WORD: createApplication
    
            *Important*
    
            - Think through the conversation history and user's message to determine the appropriate action based on the provided guidelines.
            - Based on your analysis, return only a single word indicating the appropriate action:
            - (Write your one-word action here, either "getRequirements", "createApplication", "modifyApplication", "connectServer", or "generalResponse")
    
            Remember, use advanced context and content analysis to determine the best course of action. Respond accordingly to the user's request by returning only one of the exact words specified above.
            *TAKE YOUR TIME AND ALSO MENTALLY THINK THROUGH THIS STEP BY STEP TO PROVIDE THE MOST ACCURATE AND EFFECTIVE RESULT*
        `;
        
        return text;
    }
    
    function generateRequirementsPrompt(conversationHistory, userMessage) {
        const text = `
        Here is the conversation history so far:
    ${JSON.stringify(conversationHistory, null, 2)}
    
    And here is the user's latest message:
    "${userMessage}"
    
    Your task is to gather the necessary requirements from the user to build their desired web application. To do this, follow these steps:
    
    1. Carefully analyze the entire conversation history to identify any previously gathered requirements, such as the user's color and style preferences and the features or purpose of the site.
    
    2. Based on your analysis, determine if the conversation history provides at least two specific requirements (colors-styles preferences and features or purpose of the site).
    
       - If the necessary requirements are not met, ask the user for the missing details. Your questions should be clear and concise, focusing on the information needed to proceed with creating the web application.
    
       - If the conversation history already includes the necessary requirements (at least two specific requirements), acknowledge the gathered details and confirm them with the user.
    
    3. Use advanced context and content analysis techniques to determine the most appropriate questions to ask based on the conversation history. Consider the user's previous responses and tailor your questions accordingly.
    
    4. Respond to the user's latest message in a way that effectively gathers all the necessary requirements. If the user has provided new information, incorporate it into your response and ask follow-up questions if needed.
    
    5. Ensure that your response is clear, concise, and well-structured. This will help the user understand what information is needed and make it easier for them to provide the required details.
    
    `;
        
        return text;
    }
    
    function generateConversationPrompt(conversationHistory, userMessage) {
        const text = `
            You are an AI assistant created by Yedu AI which is a platform that creates web applications for users, Here is the conversation history so far:
    
            Conversation History: ${JSON.stringify(conversationHistory, null, 2)}
    
            The user has just sent the following message: ${userMessage}
    
            Carefully review the conversation history to understand the full context. Then, compose a concise response to the user's latest message. If the user asks where you are from, state that you are an AI from Yedu AI, a company created for the African community by Africans.
        `;
        
        return text;
    }
    
    function generateModificationPrompt(
        message,
        conversationContext,
        taskList
    ) {
        const text = `
            You are a smart assistant helping to manage a web development project. The project consists of multiple files, each described as an object with the following structure: 
            name, extension, content
    
            The user has provided the following message describing their modification request:
            ${message}
    
            The conversation history is as follows:
            ${conversationContext}
    
            The task list is as follows:
            ${JSON.stringify(taskList, null, 2)}
    
            Please carefully review the user's message, the conversation history, and the provided task list. Based on this information, determine which project files are relevant to the requested modification task. 
    
            Thinking:
            Think through which specific files would need to be modified to implement the requested changes. Consider:
            - If the request involves changing the visual structure or layout, HTML and CSS files are likely relevant
            - If the request involves updating data or application logic, JSON data files and JavaScript code files are likely relevant
            - Requests to modify content may involve HTML files, text files, or data files like JSON or XML
            - Requests to add new features or pages could require a mix of HTML, CSS, JavaScript, and data files
    
            Return a JSON array containing only the file objects that are relevant and necessary to complete the requested modifications. The file objects should be in the format as shown here => (name, extension). 
    
            For example:
            - If the user asks to change the HTML page structure, include the relevant HTML files
            - If the user asks to update application data or functionality, include the relevant JSON data files or JavaScript code files
    
            Provide your response as a JSON array.
            Expected Result Structure:
            [
                {
                    "name": "example",
                    "extension": "html"
                },
                {
                    "name": "example",
                    "extension": "js"
                },
                {
                    "name": "data",
                    "extension": "json"
                }
            ]
    
            Important: Only include the files that are absolutely necessary to fulfill the specific modification request. Do not include any irrelevant or unnecessary files in your response. Additionally, never introduce or return tasks that were not explicitly listed in the provided task list. Ensure that all tasks are strictly limited to those outlined in the task list.
        `;
        
        return text;
    }
    
    function generateTaskGenerationPrompt(
        projectOverView,
        conversationContext,
        taskList,
        assets,
        relaventTasks
    ) {
        const text = `
            Project Overview:
            ${projectOverView}
    
            Conversation Context:
            ${conversationContext}
    
            Task List:
            ${JSON.stringify(taskList, null, 2)}
    
            Current Assets in the Project's Assets Folder:
            ${JSON.stringify(assets, null, 2)}
    
            *Please pay close attention to the following tasks and their corresponding code, which are relevant to the user's request*:
            ${JSON.stringify(relaventTasks, null, 2)}
    
            Your task is to generate specific tasks in JSON format to address the modification requests for the provided HTML or EJS application. Follow these steps:
    
            1. Carefully analyze the Project Overview, Conversation Context, user request, and Task List to understand the required components and functionalities. Pay close attention to the content property in the Task List, which provides an overview of the code. Identify dependencies to ensure all necessary pages and files are accounted for.
    
            2. Generate tasks in JSON format based on the project requirements. Tasks may involve modifying existing components or files, generating missing images, or creating new HTML, EJS, or JS pages and files. Ensure each task is actionable, clear, and directly related to the project's requirements.
    
            3. When creating a new file or page, ensure that the corresponding parent file or page is updated accordingly, including creating a modification task for the parent to reflect the changes. Ensure the output is always an array of objects, even if only one task is generated.
    
            4. Only create 'Modify' tasks for pages or files that are explicitly listed in the Task List. Never modify files that are not mentioned in the task list. Align tasks with the project's original specifications and user intentions.
    
            5. For modifications, ensure the name field contains the exact name of a single file listed in the Task List.
    
            6. Create tasks that align with the Project Overview, Conversation Context, user request, and Task List to address the issues.
    
            7. Handle missing or misspelled assets by creating tasks to locate or correct them. For example, if an image asset is missing, create a task to either generate the image based on the import name.
    
            8. If the user wants an image generated, create a task to describe the image in detail and generate it using an image generation API.
    
            9. When creating a new HTML, EJS, or JS file:
            - Create a 'Create' task for the new file with a detailed prompt.
            - Create a 'Modify' task for the parent file to include references to the new file.
            - Ensure the new file and parent file are both listed in the Task List.
    
            10. Use the following JSON structure for tasks:
            [
                {
                    "taskType": "Create",
                    "promptToCodeWriterAi": "Create a new HTML page for the contact section with a form for users to submit inquiries. Include input fields for name, email, subject, and message. Add appropriate labels and placeholders for each input field. Use CSS to style the form with a visually appealing layout, including proper spacing, font styles, and colors. Adjust the following CSS properties: margin, padding, font-family, font-size, color, and background-color.",
                    "name": "contact",
                    "extension": "html"
                },
                {
                    "taskType": "Modify",
                    "promptToCodeWriterAi": "Update the 'navigation.html' file to include a link to the newly created 'contact.html' page. Ensure the link is properly placed within the navigation menu and has a consistent style with other navigation links. Adjust the following CSS properties for the navigation link: color, font-weight, text-decoration, and hover effects.",
                    "name": "navigation",
                    "extension": "html"
                },
                {
                    "taskType": "Modify",
                    "promptToCodeWriterAi": "Update the structure and content of 'about.html' to improve layout and readability. Use appropriate heading tags (h1, h2, etc.) to create a hierarchical structure. Add relevant images and format the text into paragraphs. Use CSS to adjust the following properties: line-height, text-align, margin, padding, and max-width for optimal readability.",
                    "name": "about",
                    "extension": "html"
                },
                {
                    "taskType": "Modify",
                    "promptToCodeWriterAi": "Correct the path and name of the missing 'logo.png' asset in the 'index.html' file. Ensure the file extension and path are accurate. If the logo is not available, consider creating a placeholder logo using CSS. Adjust the following CSS properties for the logo: width, height, background-color, and text styles.",
                    "name": "index",
                    "extension": "html"
                },
                {
                    "taskType": "Modify",
                    "promptToCodeWriterAi": "Update 'script.js' to include the code for handling form submissions from the new 'contact.html' page. Implement the following logic: \n1. Retrieve the form data entered by the user.\n2. Validate the form fields to ensure they are not empty and the email is in a valid format.\n3. If the form data is valid, send an AJAX request to the server to submit the form data.\n4. Display a success message to the user upon successful form submission.\n5. If the form data is invalid or the submission fails, display appropriate error messages to the user.\n6. Clear the form fields after successful submission.",
                    "name": "script",
                    "extension": "js"
                }
            ]
    
            11. Take your time to think through each step carefully. All pages and files are in the same directory, with images in the './assets' folder. Ensure the HTML or EJS and JavaScript files are included and correctly referenced. Ensure the code is fully functional and production-ready.
    
            12. Return only the JSON array of objects as the final output and nothing else!
    
            13. At any point if there is any need for any mock data, make sure the data.json file is there and it uses JavaScript to pass the data to the Pages.
    
            ThinkingProcess:
            Before generating the tasks, take a moment to carefully consider the following:
            1. Analyze the project overview, conversation context, user request, and task list to gain a comprehensive understanding of the project requirements and dependencies.
            2. Identify the specific components, files, or assets that need to be modified, generated, or created based on the provided information.
            3. Determine the most effective approach to address each modification request, whether it involves modifying existing code, generating new files, or handling missing assets.
            4. Ensure that the generated tasks are clear, actionable, and aligned with the project's original specifications and user intentions.
    
            TaskFormat:
            taskType: Type of task ('Modify', 'Create').
            promptToCodeWriterAi: Explanation of the code to be written, be as detailed as possible
            name: The name of the file to be modified or where the new component is to be created.
            extension: The file extension (e.g., 'html', 'css', 'js', ejs).
    
            Final Instructions:
            Generate the tasks in JSON format based on the provided project overview, conversation context, user request, and task list. Ensure that each task addresses a specific modification request and aligns with the project requirements. Include all necessary files, references, and assets to maintain code quality, functionality, and user experience. Return the tasks as a JSON array of objects, following the specified format. Take your time to think through each step carefully and ensure the code is fully functional and production-ready.
        `;
        
        return text;
    }
    
    function generateJsonFormatterPrompt(rawJsonString, error) {
        const text = `
        You are an AI agent that formats badly structured JSON which can not be parsed into well-structured JSON objects, transforming them into proper parsable JSON format.
    
        When you receive Raw JSON, analyze its nature and the error accompanying it, and convert it into a structured JSON object.
    
        Raw JSON: "${rawJsonString}"
        Error: ${error}
    
        Return ONLY the well-structured JSON object that represents the Raw JSON accurately.
    
        *TAKE YOUR TIME AND THINK THROUGH THIS STEP BY STEP TO PROVIDE THE MOST ACCURATE AND EFFECTIVE RESULT*
    `;
        
        return text;
    }
    
    function generateImagePrompt(data, projectOverView) {
        const text = `
            You are an AI agent part of a Node.js autonomous system that creates beautiful and elegant HTML web applications. Your role involves using 'Data' and 'Conversation History' to generate essential images for the project using DALL-E.
            
            Data: ${JSON.stringify(data, null, 2)},
            Project OverView: ${JSON.stringify(projectOverView)}
    
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
    
            ALWAYS RETURN A JSON OBJECT WITH THOSE TWO PROPERTIES LIKE THE EXAMPLE BELOW:
    
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
            }. it should always be an array.
    
            *TAKE YOUR TIME AND ALSO MENTALLY THINK THROUGH THIS STEP BY STEP TO PROVIDE THE MOST ACCURATE AND EFFECTIVE RESULT*
        `;
        
        return text;
    }
    
    function generateImageSelectionPrompt(conversationHistory, imageArray) {
        const text = `
            Conversation History: ${conversationHistory}
    
            Curated list of images: ${JSON.stringify(imageArray, null, 2)}
    
            You are an AI agent, part of a Node.js autonomous system that creates HTML web applications from user prompts. Your role is to analyze the conversation history thoroughly to understand the user's requirements and preferences for the web application.
    
            Instructions:
            1. Review Conversation History: Carefully review the entire conversation history to extract key details about the user's needs, including desired layout, features, styles, and any specific elements mentioned.
            2. Compare with Curated List: Compare these requirements with the curated list of images in the imageArray. Each image is a sketch of a potential website layout accompanied by a detailed description.
            3. Select the Best Match: Select the single most relevant sketch that closely matches the user's specifications based on layout, features, and style.
            4. Provide JSON Object: Provide a JSON object with the id of the selected image.
            
            Note:
            Ensure that the selected sketch aligns as closely as possible with the user's stated requirements.
            Return only the id of the object that best fits the user's needs from the curated list of images.
            If the requirements do not match any object in the list, return a JSON object with "id": null.
    
            Example list of images:
            [
                {
                    "id": "1xchhr6",
                    "classification": "example_classification_1",
                    "description": "This is the first example description"
                },
                {
                    "id": "2fkfkkg889",
                    "classification": "example_classification_2",
                    "description": "This is the second example description"
                }
            ]
            
            If image falls under example_classification_2 then Example Response:
            [
                {
                    "id": "2fkfkkg889"
                }
            ]
    
            If the requirements are not within or closely related to any object in the list:
            [
                {
                    "id": null
                }
            ]
    
            *TAKE YOUR TIME AND ALSO MENTALLY THINK THROUGH THIS STEP BY STEP TO PROVIDE THE MOST ACCURATE AND EFFECTIVE RESULT*
        `;
        
        return text;
    }
    
    function generateCodeGenerationPrompt(
        projectOverView,
        taskList,
        assets
    ) {
        const text = `
            You are an AI agent, part of a Node.js autonomous system that creates web HTML applications from user prompts. Your role is to write and return the full, complete, production-ready code for the given task.
    
            Project Overview:
            ${projectOverView}
    
            Task List:
            ${JSON.stringify(taskList, null, 2)}
    
            Assets:
            ${JSON.stringify(assets, null, 2)}
    
            Key Instructions:
    
            1. **Analyze Thoroughly:** Before coding, carefully analyze the task and project overview to determine the most efficient and effective approach. Approach each coding task methodically.
    
            2. **Contextual Memory:** Maintain a contextual memory of all interactions, tasks provided, and discussions held. Use this information to build upon previous tasks, ensuring a cohesive and continuous development process.
    
            3. **Take your time:** Always take your time and aim to avoid any mistakes.
    
            4. **Styling with Tailwind CSS:** Apply Tailwind CSS for all styling. Ensure the interface is responsive and visually aligns with the overall application design.
    
            5. **Task Analysis:** Carefully examine the properties within the task list for each task. Ensure your code integrates seamlessly with established functionalities and design patterns, avoiding potential conflicts or redundancies.
    
            6. **Return Code Only:** Your response should only include the code block. Do not add any other text or comments in the response.
    
            7. **Image Handling:** Reference images from the './assets' folder. Do not import or create code to import images not found in this assets folder. If a specified image is not found, do not include any image imports for that task.
    
            8. **Robust Image Importing:** For components requiring images, implement a robust method to include images linked to data, for example:
    
            <img src="./assets/img.jpg" alt="Description of image">
    
            9. Unless specifically instructed to call an endpoint, do not attempt to make any network or API calls.
    
            10. Try to match the sketch image/s as best as you can.
    
            11. Always use Tailwind, never attempt to create separate CSS files.
    
            12. Never use placeholders or omit any code. Return fully functional, production-ready code.
    
            Template_instructions
            If a template image is provided:
            - Do not copy the information or data from the template or image, but use the information and data provided in the Project Overview.
            - The template is just a visual and styling guide; never use information or data from it.
            - If the user's information is not enough, generate the information based on your interpretation of the user's requirements.
    
            Scratchpad:
            Think through the task step by step to provide the most accurate and effective result.
    
            Code:
            Return ONLY! the complete, production-ready code for the task here.
    
            *TAKE YOUR TIME AND ALSO MENTALLY THINK THROUGH THIS STEP BY STEP TO PROVIDE THE MOST ACCURATE AND EFFECTIVE RESULT*
        `;
        
        return text;
    }
    
    function generateComponentReviewPrompt(context) {
        const text = `
            You are an AI agent, part of a Node.js autonomous system, tasked with creating HTML or EJS web pages from user prompts. Here is an overview of the project:
    
            Project Overview:
            ${context.projectOverView}
    
            Conversation History:
            ${JSON.stringify(context.conversationContext, null, 2)}
    
            The task list for the project is as follows:
            ${JSON.stringify(context.taskList, null, 2)}
    
            The assets folder contains the following:
            ${JSON.stringify(context.assets, null, 2)}
            
            Previous modifications made to the project:
            ${JSON.stringify(context.modifications, null, 2)}
    
            Your current task is to review the code for the following component:
            ${context.currentComponent.name}
    
            Current component code:
            ${JSON.stringify(context.currentComponent.code, null, 2)}
    
            Please follow these steps to complete your review:
    
            1. Analyze the content property of the file in the task list to understand its purpose and required functionality.
    
            2. Review the content property to identify key elements, functions, and critical information for development.
    
            3. Check the HTML or EJS structure:
            - Ensure it is semantic and well-formed.
            - Remove any unnecessary elements.
    
            4. Verify the code functionality:
            - Confirm it performs the required tasks.
            - Ensure it handles user interactions appropriately.
            - Check that it displays the expected UI elements.
    
            5. Check for context integration:
            - Verify that the file works seamlessly with other files as per the given context.
    
            6. Verify asset imports:
            - Ensure that all image or static file imports correspond to actual files in the assets folder.
            - Remove any imports that refer to non-existent files to prevent errors.
    
            7. Return a single JSON object with the following structure:
            - If the code is correct, return:
                [
                {
                    "component": "${context.currentComponent.name}",
                    "newCode": null
                }
                ]
            - If the code needs adjustments, return:
                [
                {
                    "component": "${context.currentComponent.name}",
                    "newCode": "updated code here"
                }
                ]
    
            Use a thorough, chain-of-thought approach in your review. Consider every aspect of the component code, including structure, styling, and integration with other components, assets, or files.
    
            Here are some example responses:
    
            1. Component with no issues:
            [
            {
                "component": "script.js",
                "newCode": null
            }
            ]
    
            2. Component requiring changes:
            [
            {
                "component": "Food.html",
                "newCode": "<!DOCTYPE html>
                <html lang='en'>
                <head>
                <meta charset='UTF-8'>
                <meta name='viewport' content='width=device-width, initial-scale=1.0'>
                <link href='https://cdn.jsdelivr.net/npm/tailwindcss@2.0.1/dist/tailwind.min.css' rel='stylesheet'>
                <title>Food Component</title>
                </head>
                <body>
                <div class='absolute bg-green-500' style='width: 20px; height: 20px; left: 20px; top: 20px;'></div>
                </body>
                </html>"
            }
            ]
    
            Make sure the HTML on Tailwind project works as expected. Fix any issues found in the component code, ensuring that it is well-written, functional, and adheres to the specified requirements.
    
            *TAKE YOUR TIME AND ALSO MENTALLY THINK THROUGH THIS STEP BY STEP TO PROVIDE THE MOST ACCURATE AND EFFECTIVE RESULT*
        `;
        
        return text;
    }
    
    function generateCodeOverviewPrompt(code) {
        const text = `
            You are an AI agent, part of a Node.js autonomous system that creates beautiful and elegant HTML on Tailwind web pages from user prompts. Your role is to analyze the following code and generate a comprehensive, concise, and well-structured overview of its functionality, elements, styling, and other relevant aspects. Your overview should:
    
            1. **Detailed Explanation:** Provide a thorough explanation of what the code does.
            2. **HTML Structure Analysis:** List and describe all HTML elements and their purposes.
            3. **CSS Classes Enumeration:** Enumerate all Tailwind CSS classes used and explain their styling effects.
            4. **Critical Development Information:** Highlight any critical information necessary for the development of new components that integrate with or extend this code.
            5. **Concise and Digestible:** Ensure the overview is concise, easily digestible, and focuses on essential information for developers.
    
            Include every aspect of the code, ensuring nothing is missed.
    
            *TAKE YOUR TIME AND ALSO MENTALLY THINK THROUGH THIS STEP BY STEP TO PROVIDE THE MOST ACCURATE AND EFFECTIVE RESULT*
    
            Code to analyze:
            ${code}
        `;
        
        return text;
    }
    
    function generateErrorAnalysisPrompt(error) {
        const text = `
        You are an AI agent in a Node.js autonomous system that generates elegant HTML web applications from user prompts. Analyze the following log message: "${error}". If it indicates a critical error that could stop the application from functioning correctly, respond only with "Critical Error Detected". Otherwise, respond only with "No Critical Error Detected". Provide no additional information or analysis.
        *TAKE YOUR TIME AND ALSO MENTALLY THINK THROUGH THIS STEP BY STEP TO PROVIDE THE MOST ACCURATE AND EFFECTIVE RESULT*
    `;
        
        return text;
    }



module.exports = {
    createPrompt,
    createMoreContext,
    generateSchemaAndRoutesPrompt,
    generateDetailedPrompt,
    generateWebAppPrompt,
    generateImagePrompt,
    generateDataTransformationPrompt,
    generateSentimentAnalysisPrompt,
    generateConversationPrompt,
    generateModificationPrompt,
    generateTaskGenerationPrompt,
    generateJsonFormatterPrompt,
    generateImagePrompt,
    generateImageSelectionPrompt,
    generateCodeGenerationPrompt,
    generateComponentReviewPrompt,
    generateCodeOverviewPrompt,
    generateErrorAnalysisPrompt,
    generateRequirementsPrompt
};
