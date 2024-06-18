// s3Config.js
const multer = require('multer');
const multerS3 = require('multer-s3');
const AWS = require('aws-sdk');

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: 'Europe (Stockholm) eu-north-1'
});

const s3 = new AWS.S3();

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: 'my-sketches-bucket',
    acl: 'public-read',
    key: function (req, file, cb) {
      const projectId = req.params.projectId || req.body.projectId;
      cb(null, `sketches/${projectId}/${Date.now().toString()}-${file.originalname}`);
    }
  })
});

module.exports = upload;

