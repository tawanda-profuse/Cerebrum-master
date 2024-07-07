const { readFile, writeFile } = require('../s3FileManager');
const logger = require('../logger');

async function updateImageInDataJson(projectId, identifier, imageUrl) {
    const fileName = 'data.json';

    try {
        // Read the data.json file
        const fileContent = await readFile(projectId, fileName);

        if (!fileContent) {
            return 'An unexpected error occurred. Please try again or contact support if the issue persists.';
        }

        let data;
        try {
            data = JSON.parse(fileContent);
        } catch (error) {
            logger.info('Error parsing data.json:', error);
            return 'An unexpected error occurred. Please try again or contact support if the issue persists.';
        }

        let found = false;

        // Helper function to recursively search and replace the imageId or name
        function searchAndReplace(obj) {
            if (Array.isArray(obj)) {
                obj.forEach(item => searchAndReplace(item));
            } else if (typeof obj === 'object' && obj !== null) {
                if ((obj.imageId === identifier) || (obj.name === identifier)) {
                    obj.imageUrl = imageUrl;
                    found = true;
                } else {
                    for (const key in obj) {
                        if (typeof obj[key] === 'object' && obj[key] !== null) {
                            searchAndReplace(obj[key]);
                        }
                    }
                }
            }
        }

        // Search through the entire data structure
        if (Array.isArray(data)) {
            data.forEach(item => searchAndReplace(item));
        } else if (typeof data === 'object' && data !== null) {
            searchAndReplace(data);
        } else {
            return 'Invalid data structure in data.json';
        }

        if (!found) {
            return `Image reference: ${identifier} not found. Make sure you copied the exact image id or name as shown on the image you want to replace.`;
        }

        // Write the updated data back to the file
        await writeFile(projectId, fileName, JSON.stringify(data, null, 2));

        return 'Image update successful. Please refresh your browser to see the changes.';
    } catch (error) {
        logger.info('Error updating image in data.json:', error);
        throw error;
    }
}

module.exports = { updateImageInDataJson };