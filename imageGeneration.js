require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Function to generate images using DALL-E
const generateImageWithDallE = async (prompt) => {
    console.log('prompt', prompt);
    try {
        const response = await openai.images.generate({
            model: 'dall-e-3',
            prompt: prompt,
        });
        // Adjusted to directly access the URL within the response structure shown in your logs
        if (
            response.data &&
            Array.isArray(response.data) &&
            response.data[0] &&
            response.data[0].url
        ) {
            console.log('Image URL:', response.data[0].url);
            return response.data[0].url; // Correctly access the URL from the response
        } else {
            console.error('Unexpected response structure:', response);
            return null; // Return null to indicate that no URL was found
        }
    } catch (error) {
        console.error('Error in generateImageWithDallE:', error);
        return null; // Return null in case of error
    }
};

// Function to download and save the image
const downloadImage = async (url, directory, imageName) => {
    try {
        const imagePath = path.join(directory, imageName);
        const response = await axios.get(url, { responseType: 'stream' });
        response.data.pipe(fs.createWriteStream(imagePath));
        console.log(`Image saved to ${imagePath}`);
        return imagePath;
    } catch (error) {
        console.error('Error in downloadImage:', error);
        return null;
    }
};

module.exports = {
    generateImageWithDallE,
    downloadImage,
};
