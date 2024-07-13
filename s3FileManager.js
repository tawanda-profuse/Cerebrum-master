const S3Utility = require('./classes/s3Utility');
const path = require('path');
const os = require('os');
const fs = require('fs');
const archiver = require('archiver');
const logger = require('./logger');

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
        // If the content is an object and the file is JSON, stringify it
        if (typeof content === 'object' && fileName.endsWith('.json')) {
            content = JSON.stringify(content, null, 2);
        }

        // Ensure content is always a string
        if (typeof content !== 'string') {
            content = String(content);
        }

        const result = await s3Utility.uploadFile(key, content, contentType);
        return result;
    } catch (error) {
        logger.info('Failed to write file:', error);
    }
}

async function readFile(projectId, fileName) {
    const s3Utility = new S3Utility();
    const key = `workspace/${projectId}/${fileName}`;

    try {
        const fileExists = await s3Utility.fileExists(key);

        if (!fileExists) {
            logger.info(`File ${key} does not exist in the bucket.`);
            return;
        }
        const fileContent = await s3Utility.getFile(key);
        return fileContent;
    } catch (error) {
        logger.info(`Error reading file ${key}:`, error);
    }
}

async function deleteFolder(projectId) {
    const s3Utility = new S3Utility();
    const prefix = `workspace/${projectId}/`;

    try {
        // Check if the "folder" exists
        const objects = await s3Utility.listObjects(prefix);

        if (objects.length === 0) {
            logger.info(`Folder ${prefix} does not exist or is already empty.`);
            return;
        }
        for (const object of objects) {
            await s3Utility.deleteFile(object.Key);
        }

        logger.info(`Successfully deleted all contents from ${prefix}`);
    } catch (error) {
        logger.info(
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
        logger.info(
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
        logger.info(`Successfully deleted file ${fileName}`);
    } catch (error) {
        logger.info(`Error deleting file ${fileName}:`, error);
        throw error;
    }
}

async function downloadProject(res, projectId) {
    const s3Utility = new S3Utility();

    try {
        // Step 1: Retrieve the list of files associated with the projectId
        const objects = await s3Utility.listObjects(`workspace/${projectId}/`);

        if (objects.length === 0) {
            return res.status(404).json({ message: 'No files found for the project.' });
        }

        // Step 2: Create a ZIP archive
        const zipFileName = `${projectId}.zip`;
        const zipFilePath = path.join(os.tmpdir(), zipFileName);

        const archive = archiver('zip', { zlib: { level: 9 } });
        const output = fs.createWriteStream(zipFilePath);

        archive.on('error', (err) => {
            logger.error('Error creating ZIP archive:', err);
            throw new Error('Error creating the ZIP file.');
        });

        output.on('close', () => {
            logger.info(`${archive.pointer()} total bytes`);
            logger.info('archiver has been finalized and the output file descriptor has closed.');
            
            // Send the file after the archive is finalized
            res.download(zipFilePath, zipFileName, (err) => {
                if (err) {
                    logger.error('Error sending the ZIP file:', err);
                    return res.status(500).json({ message: 'Error downloading the project files.' });
                }

                // Clean up the temporary ZIP file
                fs.unlink(zipFilePath, (err) => {
                    if (err) {
                        logger.error('Error deleting the temporary ZIP file:', err);
                    }
                });
            });
        });

        archive.pipe(output);

        // Add the files to the ZIP archive
        for (const object of objects) {
            const fileContent = await s3Utility.getFile(object.Key);
            archive.append(fileContent, { name: path.basename(object.Key) });
        }

        // Finalize the archive
        await archive.finalize();

    } catch (error) {
        logger.error('Error downloading the project files:', error);
        res.status(500).json({ message: 'Error downloading the project files.' });
    }
}
  

module.exports = { readFile, writeFile, deleteFolder, deleteFile, renameFile, downloadProject };
