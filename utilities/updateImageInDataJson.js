const { readFile, writeFile } = require('../s3FileManager');

async function updateImageInDataJson(projectId, imageId, imageUrl) {
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
            console.error('Error parsing data.json:', error);
            return 'An unexpected error occurred. Please try again or contact support if the issue persists.';
        }

        let found = false;

        // Helper function to recursively search and replace the imageId
        function searchAndReplace(obj) {
            for (const key in obj) {
                if (typeof obj[key] === 'object' && obj[key] !== null) {
                    searchAndReplace(obj[key]);
                } else if (obj[key] === imageId) {
                    obj[key] = imageUrl;
                    found = true;
                }
            }
        }

        // Search through the entire data structure
        data.forEach(item => searchAndReplace(item));

        if (!found) {
            return 'Image reference not found. Please verify the name and try again.';
        }

        // Write the updated data back to the file
        await writeFile(projectId, fileName, JSON.stringify(data, null, 2));

        return 'Image update successful. Please refresh your browser to see the changes.';
    } catch (error) {
        console.error('Error updating image in data.json:', error);
        throw error;
    }
}

module.exports = { updateImageInDataJson };