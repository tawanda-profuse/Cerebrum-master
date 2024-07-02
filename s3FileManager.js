const S3Utility = require('./classes/s3Utility');
const path = require('path');

function getContentType(fileName) {
    const extension = path.extname(fileName).toLowerCase();
    const contentTypes = {
        '.html': 'text/html',
        '.js': 'application/javascript',
        '.ejs': 'text/html',
        '.css': 'text/css',
        '.json': 'application/json',
        '.txt': 'text/plain',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
    };

    return contentTypes[extension] || 'application/octet-stream';
}

async function writeFile(projectId, fileName, content) {
    const s3Utility = new S3Utility();
    const key = `workspace/${projectId}/${fileName}`;
    const contentType = getContentType(fileName);

    try {
        const result = await s3Utility.uploadFile(key, content, contentType);
        return result;
    } catch (error) {
        console.error('Failed to write file:', error);
    }
}

async function readFile(projectId, fileName) {
    const s3Utility = new S3Utility();
    const key = `workspace/${projectId}/${fileName}`;

    try {
        const fileExists = await s3Utility.fileExists(key);

        if (!fileExists) {
            console.log(`File ${key} does not exist in the bucket.`);
            return;
        }
        const fileContent = await s3Utility.getFile(key);
        return fileContent;
    } catch (error) {
        console.error(`Error reading file ${key}:`, error);
    }
}

async function deleteFolder(projectId) {
    const s3Utility = new S3Utility();
    const prefix = `workspace/${projectId}/`;

    try {
        // Check if the "folder" exists
        const objects = await s3Utility.listObjects(prefix);

        if (objects.length === 0) {
            console.log(`Folder ${prefix} does not exist or is already empty.`);
            return;
        }
        for (const object of objects) {
            await s3Utility.deleteFile(object.Key);
        }

        console.log(`Successfully deleted all contents from ${prefix}`);
    } catch (error) {
        console.error(
            `Error during folder deletion process for ${prefix}:`,
            error
        );
    }
}

async function renameFile(projectId, oldFileName, newFileName) {
    const s3Utility = new S3Utility();
    const oldKey = `workspace/${projectId}/${oldFileName}`;
    const newKey = `workspace/${projectId}/${newFileName}`;

    try {
        await s3Utility.copyFile(oldKey, newKey);
        await s3Utility.deleteFile(oldKey);
    } catch (error) {
        console.error(
            `Error renaming file from ${oldFileName} to ${newFileName}:`,
            error
        );
        throw error;
    }
}

async function deleteFile(projectId, fileName) {
    const s3Utility = new S3Utility();
    const key = `workspace/${projectId}/${fileName}`;

    try {
        await s3Utility.deleteFile(key);
        console.log(`Successfully deleted file ${fileName}`);
    } catch (error) {
        console.error(`Error deleting file ${fileName}:`, error);
        throw error;
    }
}

module.exports = { readFile, writeFile, deleteFolder, deleteFile, renameFile };
