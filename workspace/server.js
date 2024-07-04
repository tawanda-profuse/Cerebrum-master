require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const app = express();
const path = require('path');
const S3Utility = require('./s3Utility');
const multer = require('multer');
const DomainMapping = require('./models/DomainMapping');
const upload = multer({ dest: 'uploads/' });
const mongoose = require('mongoose');
const mongoURI = process.env.MONGO_URI;
const NodeCache = require('node-cache');

// Set up caching
const cache = new NodeCache({ stdTTL: 3600, checkperiod: 120 });

mongoose.connect(mongoURI);

mongoose.connection.on('connected', () => {
    console.log('Connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
    console.log('Error connecting to MongoDB', err);
});

const s3Utility = new S3Utility();

app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'", "https:"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
  }));
app.use(cors());
app.use(compression());

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
});
app.use(limiter);

app.use(express.json());

function setContentType(res, fileName) {
    const ext = path.extname(fileName).toLowerCase();
    const contentTypes = {
        '.html': 'text/html',
        '.js': 'application/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg'
    };
    res.set('Content-Type', contentTypes[ext] || 'text/plain');
}

async function getFileWithCache(key, encoding = 'utf-8') {
    const cachedContent = cache.get(key);
    if (cachedContent) {
        return cachedContent;
    }

    const fileContent = await s3Utility.getFile(key, encoding);
    cache.set(key, fileContent);
    return fileContent;
}

async function getFileMetadata(key) {
    try {
        return await s3Utility.getFileMetadata(key);
    } catch (error) {
        console.error('Error getting file metadata:', error);
        return null;
    }
}

function generate404Page(message) {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>404 - Not Found</title>
        <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            h1 { color: #444; }
            p { color: #666; }
        </style>
    </head>
    <body>
        <h1>404 - Not Found</h1>
        <p>${message}</p>
    </body>
    </html>
    `;
}

app.post('/api/domain-mapping', upload.fields([
    { name: 'sslCert', maxCount: 1 },
    { name: 'sslKey', maxCount: 1 }
]), async (req, res) => {
    try {
        const { domain, projectId } = req.body;
        const sslCert = req.files['sslCert'][0];
        const sslKey = req.files['sslKey'][0];

        if (!domain || !projectId || !sslCert || !sslKey) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        const domainMapping = new DomainMapping({
            domain,
            projectId,
            sslCertPath: sslCert.path,
            sslKeyPath: sslKey.path
        });
        await domainMapping.save();

        const jenkinsUrl = process.env.JENKINS_URL;
        const params = new URLSearchParams({
            token: process.env.JENKINS_TOKEN,
            domain,
            projectId,
            sslCertPath: sslCert.path,
            sslKeyPath: sslKey.path
        });

        const response = await fetch(`${jenkinsUrl}?${params}`, { method: 'POST' });

        if (response.ok) {
            res.json({ success: true, message: 'Domain mapping process initiated' });
        } else {
            throw new Error('Failed to trigger Jenkins job');
        }
    } catch (error) {
        console.error('Error in domain mapping process:', error);
        res.status(500).json({ success: false, message: 'An error occurred in the domain mapping process' });
    }
});

app.use('/workspace', express.static('public'));

app.get('/workspace/:projectId/*', async (req, res) => {
    const projectId = req.params.projectId;
    const filePath = req.params[0] || 'index.html';
    const key = `workspace/${projectId}/${filePath}`;

    try {
        const metadata = await getFileMetadata(key);

        if (!metadata) {
            // File doesn't exist, try to serve index.html
            if (filePath !== 'index.html') {
                return res.redirect(`/workspace/${projectId}/index.html`);
            }
            return res.status(404).send(generate404Page("The requested resource does not exist."));
        }

        if (req.headers['if-none-match'] === metadata.ETag) {
            return res.status(304).end();
        }

        const fileContent = await getFileWithCache(key);

        setContentType(res, filePath);
        res.set('ETag', metadata.ETag);
        res.set('Cache-Control', 'public, max-age=3600');

        res.send(fileContent);
    } catch (error) {
        console.error('Error serving file:', error);
        res.status(500).send('An error occurred while serving the file');
    }
});

app.get('/workspace/:projectId', (req, res) => {
    const projectId = req.params.projectId;
    res.redirect(`/workspace/${projectId}/index.html`);
});

app.use('/workspace', (req, res) => {
    res.status(404).send(generate404Page("The requested resource does not exist."));
});

app.get('/', (req, res) => {
    res.send('Welcome to the YeduAI Workspace Server');
});

app.use((req, res) => {
    res.status(404).send(generate404Page("The requested resource does not exist."));
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});