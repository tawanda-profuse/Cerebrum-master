function generateSchemaAndRoutesPrompt(conversationHistory, projectId) {
  const text = `
        You are an AI agent within a Node.js autonomous system specializing in creating functional HTML/Tailwind  web applications.    
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

function makeDynamicData(array, conversationHistory) {
  return `
    You are an AI assistant specializing in web development. Your task is to update the provided web application code to use dynamic data from a data.json file. Here's what you need to do:
    
    Here's the current array of files:
    ${JSON.stringify(array, null, 2)}
    
    And here's the conversation history for context:
    ${JSON.stringify(conversationHistory, null, 2)}

    Review the provided array of files, which includes HTML, JavaScript, and a data.json file.
    
    1. ## For Dynamic Image Rendering (look for the data.json file first)

        For all the image elements, make sure you use JavaScript and the data in the json file to dynamically render these images.

        Make  sure on every image element

        a. **Alt Attribute**: The alt attribute will include the corresponding imageId from the data.json and the image dimensions. This helps developers identify which image to replace later and informs them of the required dimensions.

        b. **Src Attribute**: Will us a function call or logic to retrieve the imageId property from data.json based on the image name.

        c. **Dimensions**: Apply appropriate width and height classes (e.g., w-32 h-24) based on the intended image size.

        d. **Styling**: Add a background color and text color for better visibility of the placeholder.

        e. **Flexibility**: Ensure the placeholder can accommodate various image sizes and aspect ratios.

        ##  Example Implementation

        html for an example logo:<img 
        src={getImageUrl('imageName')} 
        alt="id:\place the exact imageId taken from data.json\, dimensions: 128x96"
        class="w-32 h-24 bg-gray-300 text-gray-600 flex items-center justify-center"
        >
        

        javascript: function getImageUrl(imageName) {
        \function to extract the  imageId based on the image name in the data.jsom file\
        }
    
    2. ## Every other data which is not static 
    
    Guidelines:
    - Carefully examine each file and update accordingly to use javascript to dynamically populate data.
    - Ensure all data is fetched from data.json and dynamically inserted into the HTML, you can adjust the data.json accordingly if neccessary.
    - Update any hardcoded data to use dynamic data from data.json.
    - Make sure the JavaScript properly fetches and uses data from data.json.
    - Review and adjust the code for any inconsistencies or errors.
    - Take your time to think through each step and make thorough updates.
    
    Your response should be only the updated JSON array of files, structured like this:
    [
            {
                "name": "index",
                "extension": "html",
                "content": "full HTML/Tailwind code here"
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
  ]
    
    Review the code and make any necessary adjustments for proper functionality.
    
    Return only a valid, parseable JSON array of objects representing the complete, updated task list, with no additional text or formatting.
        `;
}

function generateWebAppPrompt(
  conversationHistory,
  taskList = false,
  hasImage = false,
) {
  const text = `
        ${taskList ? `Task List : ${JSON.stringify(taskList, null, 2)}` : ""}
        ${
          hasImage
            ? `You are an AI agent skilled with vision, part of a Node.js autonomous system specializing in creating functional HTML/Tailwind web applications.
    
                These are sketches of a website. The images serve as a template or visual guide to give you a concrete reference of the user's vision and design preferences. It ensures that the resulting application aligns closely with the user's expectations.
                Here is the conversation history detailing the user's requirements: ${JSON.stringify(conversationHistory, null, 2)}
                However, you must never copy the data or information in the template! The goal is to maintain the UI and visual design, but always use the user's data or information, or based on your understanding of the user's  requirements generate relevant information. Ensure the final application reflects the user's unique content and requirements, preserving the original layout and design as a guide only.
                
                `
            : `You are an AI agent within a Node.js autonomous system specializing in creating functional HTML/Tailwind web applications.
                You will be creating a fully functional HTML/Tailwind web application based on a provided Conversation History.
                Here is the Conversation History: ${JSON.stringify(conversationHistory, null, 2)}
                `
        }
        Your task is to structure the application's code as a JSON array of objects, where each object represents a separate file (e.g., HTML/Tailwind, JavaScript) with properties for the file name, extension, and content.
    
        If there is any need for data all data should mocked. You create a data.json file which you connect via js to the html
    
        For Tailwind CSS, always utilize the default configuration via a CDN link instead of creating a custom tailwind.config.js file. This approach simplifies setup and allows for quick integration,  SO NEVER TRY TO INSTALL OR SET UP TAILWIND
    
        Create the HTML website which dynamically generates content using JavaScript by fetching data from the data.json file. Do not hardcode any data directly into the HTML. Instead, always use JavaScript to fetch the data from the JSON file and insert the content into the DOM. For example, if you need to create a list of items, fetch the data from the data.json file and then use JavaScript to map through the data array and generate the elements. Ensure that all data-driven content is managed through JavaScript.
        
        For any and all dynamic data or image assets, use mock data stored in a data.json file, regardless of user input or request. The data structure should be as follows:
    
            [
        {
            assets: [
            {
                imageId: 2934,
                name: "logo",
            },
            {
                imageId: se64,
                name: "favicon",
            },
            {
                imageId: 09r4,
                name: "header_image",
            },
            ],
            dataItems: [
            {
                products: [
                {
                    name: "product1",
                    imageId: r457,
                },
                {
                    name: "product2",
                    imageId: fg56,
                },
                ],
                // Add more data items as needed
            },
            ],
        },
        ];
    
    
       # Image Management Best Practices (Include only if the project requires image handling and are relevant to the current request)
        *The imageId should not be more than 4 charactors*
  
          ## 1. Centralized Image Reference Storage
  
          Store all image references (URLs or IDs) in a centralized data.json file. This approach enhances maintainability and allows for easier updates across your site.
  
          ## 2. Avoid Hard-Coding Image References
  
          Never hard-code image references directly within HTML. This practice makes it difficult to manage and update images across your site.
  
          ## 3. Dynamic Image Rendering
  
          Use JavaScript to dynamically render images by fetching data from the data.json file. This method provides flexibility and allows for easier content management.
  
          ## 4. Placeholder Image Implementation
  
          For web app development, use placeholder <img> elements to represent images that will be replaced later. The imageId in data.json will eventually represent the image URL for assets stored in an S3 bucket.
  
          ### Placeholder Image Structure
  
          <img 
          src={getImageUrl('imageName')} 
          alt="id:{imageId}, dimensions: {widthInPx}x{heightInPx}"
          class="w-{width} h-{height} bg-gray-300 text-gray-600 flex items-center justify-center"
          >
  
          ### Placeholder Image Guidelines
  
          1. **Alt Attribute**: Include the imageId and dimensions in the alt attribute. This helps developers identify which image to replace later and informs them of the required dimensions.
  
          2. **Src Attribute**: Use a function call or logic to retrieve the URL from data.json based on the imageId.
  
          3. **Dimensions**: Apply appropriate width and height classes (e.g., w-32 h-24) based on the intended image size.
  
          4. **Styling**: Add a background color and text color for better visibility of the placeholder.
  
          5. **Flexibility**: Ensure the placeholder can accommodate various image sizes and aspect ratios.
  
          ## 5. Example Implementation
  
          html: <img 
          src={getImageUrl(/the name of the image/)} 
          alt="id:/current imageId/, dimensions: 128x96"
          class="w-32 h-24 bg-gray-300 text-gray-600 flex items-center justify-center"
          >
  
          javascript : function getImageUrl(imageName) {
          // the code here
          }
    
    
        When creating the HTML/Tailwind web application, adhere to the following requirements:
        - Use HTML/Tailwind and Tailwind CSS for the structure and styling of the application. Do not create separate CSS files or use any additional CSS frameworks.
        - Structure the application's code as a JSON array of objects, with each object representing a separate file (e.g., HTML/Tailwind, JavaScript).
        - Include all referenced pages or files as objects in the JSON array, ensuring that the application can function correctly without any missing components.
        - Use Tailwind CSS for all styling purposes, and ensure that the JavaScript file handles the application's logic.
        - Provide all required files (HTML/Tailwind, JavaScript, etc.) as separate objects within the JSON array.
        - Do not attempt to make any network or API calls unless specifically instructed to do so in the project description.
        - Ensure that the code is fully functional, production-ready, and does not contain any placeholders or omitted sections.
    
        When generating the application:
        - Take your time to think through each step carefully, ensuring that all files are correctly referenced and included.
        - At any point if there is any need for any mock data, create a data.json file and use JavaScript to pass the data to the Pages.
        - Return only the JSON array of objects as the final output, without any additional comments or explanations.
    
        Remember, the JSON array should contain multiple objects, each representing a separate file required for the application to function properly. Do not return just a single object.
    
        Reflection:
        Before you begin, take a moment to carefully review the project description to ensure you have a clear understanding of the user's requirements. Plan out the necessary components and structure of the application, considering how to best organize the code using HTML/Tailwind, Tailwind CSS, and JavaScript.
    
        Result:
         No matter what!, you should always return a JSON array of objects containing HTML/Tailwind files, JavaScript files, and possibly JSON files only! and no other file types.
    
         Example JSON structure:
        [
            {
                "name": "index",
                "extension": "html",
                "content": "full HTML/Tailwind code here"
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
    Return only a valid, parseable JSON array of objects representing the complete task list, with no additional text or formatting.
        **RETURN FULL PRODUCTION READY CODE, DO NOT LEAVE PLACEHOLDERS OR OMIT SOME LOGIC. THE CODE SHOULD BE FULLY FUNCTIONAL**      
        `;

  return text;
}

function replyUserWithImage(conversationHistory, userMessage, taskList) {
  const text = `
        You are an AI agent skilled with vision , you are part of a Node.js autonomous system specializing in creating function HTML/Tailwind web applications. 
        
        These are sketches of a website, the images serves as a template or  visual guide, to give you a concrete reference of the user's vision and design preferences. It ensures that the resulting application aligns closely with the user's expectations. Your role is to analyze the conversation history and the user's message  and determine the user's needs accurately.
    
        Conversation History: ${JSON.stringify(conversationHistory, null, 2)}
    
        User Message: ${userMessage}
        
        Determine if there is an existing project by checking if the Task List if its empty. You will be creating a fully functional HTML/Tailwind web application based on a provided project description
    
       ${
         taskList && taskList.length === 0
           ? `
        1. New Web Application: If the message indicates a request to create or have built a new web application, we will start gathering the user's requirements, mostly the user's color/style preferences and the features or purpose of the site. RETURN ONLY ONE WORD: "getRequirements".
    
        1b. From the conversation history about creating the web application, if we still don't know at least two things - the user's color/style preferences and the features or purpose of the site, RETURN ONLY ONE WORD: "getRequirements". The questions regarding these user's requirements should not exceed 3 based on the conversation history.
    
        2. Creating application : From the conversation history, once we have the user's requirements, mostly two things - the user's color/style preferences and the features or purpose of the site, RETURN ONLY ONE WORD: "createApplication".
        
        3. If you see the user telling to just create the app, game , application , even without the full requirements just RETURN ONLY ONE WORD: createApplication
         (Write your one-word action here, either "getRequirements", "createApplication")
        `
           : `
        1. Modify Existing Application (If the Task List is not empty): If the message pertains to modifying the existing application in any way, including adding new features, changing design, or updating content,RETURN ONLY ONE WORD: "modifyApplication".`
       }
    
            *Important*
    
            - Think through the conversation history and user's message to determine the appropriate action based on the provided guidelines.
            - Based on your analysis, return only a single word indicating the appropriate action:
            
            Remember, use advanced context and content analysis to determine the best course of action. Respond accordingly to the user's request by returning only one of the exact words specified above.
            *TAKE YOUR TIME AND ALSO MENTALLY THINK THROUGH THIS STEP BY STEP TO PROVIDE THE MOST ACCURATE AND EFFECTIVE RESULT*
      
        `;

  return text;
}

function generateSentimentAnalysisPrompt(conversationHistory, taskList) {
  const text = `
      You are an AI agent within a Node.js autonomous system specializing in creating functional HTML/Tailwind web applications, systems, and games for users. Your primary role is advanced sentiment analysis to figure out the best one-word response.
    
      Distinguish between different types of user messages by carefully analyzing the context and intent, such as:
      - Simple greetings without any specific request or intent (e.g., 'Hello', 'Hi there', 'Good morning').
      - Messages that do not relate to web application creation or modification, such as casual conversation or unrelated queries.
      - Messages where the user explicitly expresses a desire to create a new web application or mentions modifications to an existing application.
    
      Current conversation history: ${JSON.stringify(conversationHistory, null, 2)}
    
      First, determine if there is an existing project by checking if the task list is empty.
    
      Analyze the entire conversation history to gain more context. Follow these guidelines strictly and always return only one word as the response:
    
      ${
        taskList && taskList.length === 0
          ? `
      1. New Web Application: If the message indicates a request to create or have built a new web application, we will start gathering the user's requirements, mostly the user's color/style preferences and the features or purpose of the site. RETURN ONLY ONE WORD: "getRequirements".
    
      1b. Getting full requirements: From the conversation history about creating the web application, if we still don't know at least two things - the user's color/style preferences and the features or purpose of the site, RETURN ONLY ONE WORD: "getRequirements". The questions regarding these user's requirements should not exceed 3 based on the conversation history.
    
      2. Creating application: From the conversation history, once we have the user's requirements, mostly two things - the user's color/style preferences and the features or purpose of the site, RETURN ONLY ONE WORD: "createApplication".
    
      3. If you see the user telling to just create the app, game, application, even without the full requirements just RETURN ONLY ONE WORD: createApplication.
    
      (Write your one-word action here, either "getRequirements", "createApplication" or "generalResponse")
      `
          : `
      1. Modify Existing Application : If the message pertains to modifying the existing application in any way, or addressing an issue with the existing project including adding new features, changing design, or updating content or functionilities not working as expected RETURN ONLY ONE WORD: "modifyApplication".
    
      2. Connect Server to Existing Application: If the message pertains to the existing application and indicates or you see the need to connect a server to an existing application for purposes such as using MongoDB, enhancing performance, adding security measures, or any other server-related functionality, including data management, API integration, or user authentication, RETURN ONLY ONE WORD: "connectServer".
    
      (Write your one-word action here, either "modifyApplication", "connectServer" or "generalResponse")
      `
      }
    
      General Inquiries and Project Details: For queries not related to any project creaction, or any other general requests that do not fall under the creation or modification conditions, RETURN ONLY ONE WORD: "generalResponse".
    
      *Important*
    
      - Think through the conversation history and user's message to determine the appropriate action based on the provided guidelines.
      - Based on your analysis, return only a single word indicating the appropriate action:
    
      Remember, use advanced context and content analysis to determine the best course of action. Respond accordingly to the user's request by returning only one of the exact words specified above.
      *TAKE YOUR TIME AND ALSO MENTALLY THINK THROUGH THIS STEP BY STEP TO PROVIDE THE MOST ACCURATE AND EFFECTIVE RESULT*
      `;

  return text;
}

function generateRequirementsPrompt(conversationHistory, userMessage) {
  const text = `
        You are an AI agent within a Node.js autonomous system specializing in creating functional HTML/Tailwind  web applications.
    
        ${
          conversationHistory.length > 0
            ? `Here is the conversation history so far:
        ${JSON.stringify(conversationHistory, null, 2)}`
            : ""
        } 
        
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
    
    6. Please note that all data is simulated. The application will not connect to a server since we are in a development environment, not production mode
    
    
    *Do not mention the use of HTML/Tailwind to the user. Since the users are non-technical, avoid asking them about libraries, frameworks, or any technology-related questions*`;

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

function generateModificationPrompt(message, conversationContext, taskList) {
  const text = `
        You are an AI agent within a Node.js autonomous system specializing in creating functional HTML/Tailwind web applications. Your role is to assist in managing a web development project composed of multiple files, each described as an object with the following structure:
        - name
        - extension
        - content
        
        The user has provided the following modification request:
        ${message}
        
        The conversation history is as follows:
        ${conversationContext}
        
        The task list is as follows:
        ${JSON.stringify(taskList, null, 2)}
        
        Thinking:
        Carefully consider which specific files need modification to implement the requested changes. Keep in mind:
        - Requests involving visual structure or layout changes likely require modifications to HTML/Tailwind and CSS files.
        - Requests involving updates to data or application logic likely require changes to JSON data files and JavaScript code files.
        - Requests to modify content may involve HTML/Tailwind files, text files, or data files such as JSON or XML.
        - Requests to add new features or pages might require a combination of HTML/Tailwind, CSS, JavaScript, and data files.
        
        From the provided task list return a JSON array containing only the file objects necessary to complete the requested modifications. Each file object should be formatted as follows:
        (name, extension).
        
        For example:
        - If the user requests a change to the HTML/Tailwind page structure, include the relevant HTML/Tailwind files.
        - If the user requests updates to application data or functionality, include the relevant JSON data files or JavaScript code files.
        
        Provide your response as a JSON array in the following format:
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
        
        Important: Only include the files that are absolutely necessary to fulfill the specific modification request. Do not include any irrelevant or unnecessary files. Additionally, do not introduce or return tasks that were not explicitly listed in the provided task list. Ensure all tasks are strictly limited to those outlined in the task list.
        `;

  return text;
}

function generateTaskGenerationPrompt(
  conversationContext,
  taskList,
  relevantTasks,
  consoleMessages,
  hasImage = false,
) {
  const text = `
      ${
        hasImage
          ? `You are an AI agent skilled with vision, part of a Node.js autonomous system specializing in creating functional HTML/Tailwind web applications.
    
          These sketches serve as a visual guide to align the resulting application with the user's design preferences.`
          : `You are an AI agent within a Node.js autonomous system specializing in creating functional HTML/Tailwind web applications.`
      }
    
      ${
        consoleMessages.filter(
          (msg) =>
            !(
              msg.type === "warning" &&
              msg.text.includes(
                "cdn.tailwindcss.com should not be used in production",
              )
            ),
        ).length > 0
          ? `Please review the browser console messages: ${JSON.stringify(consoleMessages, null, 2)}. These messages can help you:
          1. Identify specific errors or warnings in the code for correction.
          2. Trace issues related to application logic, data handling, or user interactions.
          3. Analyze performance-related messages to optimize code efficiency.`
          : ``
      }
    
      Conversation Context:
      ${conversationContext}
    
      Original Task List:
      ${JSON.stringify(taskList, null, 2)}
    
      *Relevant Tasks To Look At*:
      ${JSON.stringify(relevantTasks, null, 2)}
    
      Your task is to generate specific tasks in JSON format to address the modification requests for the provided HTML/Tailwind application. Follow these steps:
    
      1. Mock all necessary data and connect via \`data.json\` through JavaScript.
      2. Use the default Tailwind CSS configuration via CDN link.
      3. Create the HTML website that dynamically generates content using JavaScript by fetching data from \`data.json\`. Do not hardcode any data directly into the HTML.
      4. For images, use placeholder div tags with dimensions as text inside.
    
      Example JSON structure:
      [
        { "name": "index", "extension": "html", "content": "full HTML/Tailwind code here" },
        { "name": "script", "extension": "js", "content": "full JavaScript code here" },
        { "name": "data", "extension": "json", "content": "mock data here" }
      ]
    
      Adhere to the following requirements:
      - Use HTML/Tailwind for structure and styling.
      - Structure the application's code as a JSON array of objects, with each object representing a separate file.
      - Include all referenced pages or files as objects in the JSON array.
      - Ensure the code is fully functional, production-ready, and contains no placeholders or omitted sections.
    
      When generating the application:
      - Carefully reference and include all files.
      - Return only the JSON array of objects as the final output.
    
      Reflection:
      Before you begin, review the project description to ensure a clear understanding of the user's requirements. Plan the components and structure of the application, considering how to best organize the code.
    
      For modifying an existing file, look for the current code in relatedTasks and return the code including the modification. For creating new files or pages, write the code inline with the user requirements.
    
      Final Instructions:
      Generate tasks in JSON format based on the conversation context, user request, and task list. Ensure each task addresses a specific modification request and aligns with the project requirements.
    
      Important: Browser Console Messages
      ${
        consoleMessages.filter(
          (msg) =>
            !(
              msg.type === "warning" &&
              msg.text.includes(
                "cdn.tailwindcss.com should not be used in production",
              )
            ),
        ).length > 0
          ? `There are browser console messages that need to be addressed. For each console message:
          1. Clearly state:
             - The exact error message, the error and the file path where the error occurred, and not the full URL.
             - The file name where the error occurred
             - The line number (if available)
             - A detailed explanation of how to fix the issue
          2. Prioritize these tasks to ensure a bug-free application.`
          : ``
      }
    
      Include all necessary files, references, and assets to maintain code quality, functionality, and user experience. Pay special attention to:
      1. Resolving any reported errors or warnings
      2. Improving performance based on any console insights if any
      3. Ensuring all file paths and references are correct
      4. Implementing proper error handling and debugging mechanisms
    
    
      Return the tasks as a JSON array of objects, following the specified format. Each task should be clear, actionable, and directly related to improving the application's functionality or resolving identified issues.
    
      Ensure the proposed changes will result in fully functional and production-ready code. Consider the broader impact of each modification on the overall application structure and performance.
    
      When creating new files or pages (Include only if the project requires image handling and are relevant to the current request): 
    1. ## For Dynamic Image Rendering (look for the data.json file first)

        For all the image elements, make sure you use JavaScript and the data in the json file to dynamically render these images.

        Make  sure on every image element

        a. **Alt Attribute**: The alt attribute will include the corresponding imageId from the data.json and the image dimensions. This helps developers identify which image to replace later and informs them of the required dimensions.

        b. **Src Attribute**: Will us a function call or logic to retrieve the imageId property from data.json based on the image name.

        c. **Dimensions**: Apply appropriate width and height classes (e.g., w-32 h-24) based on the intended image size.

        d. **Styling**: Add a background color and text color for better visibility of the placeholder.

        e. **Flexibility**: Ensure the placeholder can accommodate various image sizes and aspect ratios.

        ##  Example Implementation

        html for an example logo:<img 
        src={getImageUrl('imageName')} 
        alt="id:\place the exact imageId taken from data.json\, dimensions: 128x96"
        class="w-32 h-24 bg-gray-300 text-gray-600 flex items-center justify-center"
        >
        

        javascript: function getImageUrl(imageName) {
        \function to extract the  imageId based on the image name in the data.jsom file\
        }
    
    `;

  return text;
}

function fixIssues(conversationHistory, currentTaskList, errors) {
  const test = `Given the current task list: ${JSON.stringify(currentTaskList, null, 2)}, the conversation history: ${JSON.stringify(conversationHistory, null, 2)}, and the following error(s): ${JSON.stringify(errors, null, 2)}

1. Carefully analyze the entire codebase, paying special attention to the sections related to the reported error(s).
2. Identify the root cause(s) of the error(s).
3. Review the conversation history for any relevant context that might inform your solution.
4. Implement the fixes in the task list, ensuring that you only modify the parts directly related to the error(s).
5. Without outputing anything do a mental check that your changes haven't introduced new issues or conflicts with other parts of the task list.
6. Return the updated task list in its entirety as a JSON array exactly like the original, including all original tasks that were functioning correctly.

Important:
- Preserve all working components of the original task list.
- Do not omit or adjust any tasks that were not related to the error(s).

Return only a valid, parseable JSON array of objects representing the complete, updated task list, with no additional text or formatting.`;
  return test;
}

function improveUserPrompt(conversationHistory, userPrompt) {
  const aiInstructions = `You are an AI agent in an autonomous system that creates and modifies web applications through prompts. Most users are not tech-savvy and have difficulties translating their ideas into effective prompts. Your task is to:

1. Review the conversation history provided: ${JSON.stringify(conversationHistory, null, 2)}
2. Analyze the user message: ${JSON.stringify(userPrompt, null, 2)}
3. Determine if the user is:
   a) Requesting a new website
   b) Reporting issues with an existing site
   c) Requesting modifications to an existing site
4. Improve and expand upon the user's prompt to create a more detailed and effective instruction set for web application creation, modification, or issue resolution.
5. Include specific directives only if relevant to the user's request:
   - Using Tailwind CSS for styling
   - Implementing responsive design
   - Creating an elegant and captivating user interface
   - Storing dynamic data in a data.json file
6. Infer additional features or requirements based on the context of the conversation, but only if clearly implied by the user's message or conversation history.
7. If the application seems to require dynamic data, suggest a basic structure for the data.json file.

Your output should be a refined, concise prompt that can guide the AI system in creating, fixing, or modifying a high-quality web application that meets the user's needs, even if they weren't explicitly stated. Only include information and directives that are directly relevant to the user's request or clearly implied by the context.`;

  return aiInstructions;
}

function generateJsonFormatterPrompt(rawJsonString, error) {
  const text = `
        You are an AI agent within a Node.js autonomous system specializing in creating functional HTML/Tailwind  web applications.
        You are an AI agent that formats badly structured JSON which can not be parsed into well-structured JSON objects, transforming them into proper parsable JSON format.
    
        When you receive Raw JSON, analyze its nature and the error accompanying it, and convert it into a structured JSON object.
    
        Raw JSON: "${rawJsonString}"
        Error: ${error}
    
        Return ONLY the well-structured JSON object that represents the Raw JSON accurately.
    
        *TAKE YOUR TIME AND THINK THROUGH THIS STEP BY STEP TO PROVIDE THE MOST ACCURATE AND EFFECTIVE RESULT*
    `;

  return text;
}

function generateComponentReviewPrompt(context) {
  const text = `
            You are an AI agent, part of a Node.js autonomous system, tasked with creating HTML/Tailwind  web pages from user prompts.
    
            Conversation History:
            ${JSON.stringify(context.conversationContext, null, 2)}
    
            The task list for the project is as follows:
            ${JSON.stringify(context.taskList, null, 2)}
            
            Previous modifications made to the project:
            ${JSON.stringify(context.modifications, null, 2)}
    
            Your current task is to review the code for the following component:
            ${context.currentComponent.name}
    
            Current component code:
            ${JSON.stringify(context.currentComponent.code, null, 2)}
    
            Please follow these steps to complete your review:
    
            1. Analyze the content property of the file in the task list to understand its purpose and required functionality.
    
            2. Review the content property to identify key elements, functions, and critical information for development.
    
            3. Check the HTML/Tailwind  structure:
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
    
            Make sure the HTML/Tailwind Tailwind project works as expected. Fix any issues found in the component code, ensuring that it is well-written, functional, and adheres to the specified requirements.
    
            *TAKE YOUR TIME AND ALSO MENTALLY THINK THROUGH THIS STEP BY STEP TO PROVIDE THE MOST ACCURATE AND EFFECTIVE RESULT*
        `;

  return text;
}

async function defaultResponse(response) {
  const text = `
        You are tasked with generating a response that  resembles the provided hardcoded response, use your own words though
    
         Response : ${response}
    
    
        Follow these guidelines:
        - Preserve any URLs exactly as they appear in the hardcoded response
        `;
  return text;
}

module.exports = {
  defaultResponse,
  generateSchemaAndRoutesPrompt,
  improveUserPrompt,
  generateWebAppPrompt,
  replyUserWithImage,
  generateSentimentAnalysisPrompt,
  generateConversationPrompt,
  generateModificationPrompt,
  generateTaskGenerationPrompt,
  generateJsonFormatterPrompt,
  generateComponentReviewPrompt,
  generateRequirementsPrompt,
  makeDynamicData,
  fixIssues,
};
