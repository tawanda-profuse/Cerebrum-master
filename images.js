require('dotenv').config();
const mongoose = require('mongoose');
const Image = require('./models/Image.schema');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

async function fetchImages() {
    // Connect to MongoDB
    const uri = process.env.MONGO_URI;
    if (!uri) {
        console.error('MONGO_URI is not defined in the environment variables');
        process.exit(1);
    }

    try {
        await mongoose.connect(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('Connected to MongoDB');

        // Retrieve image documents
        const images = await Image.find().lean(); // Use lean() to get plain JavaScript objects
        return images;
    } catch (err) {
        console.error('Failed to connect to MongoDB or retrieve images', err);
        throw err;
    } finally {
        // Optionally close the connection if you don't need to keep it open
        await mongoose.disconnect();
    }
}

function uploadFiles(req, res, project_Id) {
    const UPLOAD_DIR = path.join(
        __dirname,
        `workspace/${project_Id}/src/static_files`
    );

    // Create the upload directory if it doesn't exist
    if (!fs.existsSync(UPLOAD_DIR)) {
        fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }

    // Configure multer for file upload
    const storage = multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, UPLOAD_DIR);
        },
        filename: (req, file, cb) => {
            cb(null, file.originalname);
        },
    });

    const upload = multer({
        storage: storage,
        limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
        fileFilter: (req, file, cb) => {
            const filetypes = /jpeg|jpg|png|webp|pdf/;
            const mimetype = filetypes.test(file.mimetype);
            const extname = filetypes.test(
                path.extname(file.originalname).toLowerCase()
            );

            if (mimetype && extname) {
                return cb(null, true);
            } else {
                cb(new Error('Only images and PDF files are allowed!'));
            }
        },
    }).array('files', 5);

    // Check the number of files in the upload directory
    fs.readdir(UPLOAD_DIR, (err, files) => {
        if (err) {
            return res.status(500).send('Error reading upload directory');
        }

        if (files.length >= 5) {
            return res.status(400).send('Upload limit reached!');
        }

        upload(req, res, (err) => {
            if (err instanceof multer.MulterError) {
                return res.status(400).send(err.message);
            } else if (err) {
                return res.status(400).send(err.message);
            }

            const userInput = req.body.userInput || 'No description provided';
            const uploadedFiles = req.files.map((file) => file.originalname);

            res.status(200).json({
                message: 'Files uploaded successfully',
                userInput: userInput,
                uploadedFiles: uploadedFiles,
            });
        });
    });
}

module.exports = { fetchImages, uploadFiles };
