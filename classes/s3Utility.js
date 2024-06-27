require('dotenv').config();
const {
    S3Client,
    PutObjectCommand,
    GetObjectCommand,
    DeleteObjectCommand,
    HeadObjectCommand,
    ListObjectsV2Command,
    CopyObjectCommand,
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

class S3Utility {
    constructor(
        bucketName = 'my-sketches-bucket',
        region = process.env.AWS_REGION
    ) {
        this.bucketName = bucketName;
        this.region = this.validateRegion(region);
        this.s3Client = new S3Client({ region: this.region });
    }

    validateRegion(region) {
        if (!region) {
            throw new Error(
                'AWS region is not set. Please set AWS_REGION in your environment or .env file, or pass it to the constructor.'
            );
        }
        const validRegions = [
            'us-east-2',
            'us-east-1',
            'us-west-1',
            'us-west-2',
            'af-south-1',
            'ap-east-1',
            'ap-south-2',
            'ap-southeast-3',
            'ap-southeast-4',
            'ap-south-1',
            'ap-northeast-3',
            'ap-northeast-2',
            'ap-southeast-1',
            'ap-southeast-2',
            'ap-northeast-1',
            'ca-central-1',
            'eu-central-1',
            'eu-west-1',
            'eu-west-2',
            'eu-south-1',
            'eu-west-3',
            'eu-south-2',
            'eu-north-1',
            'eu-central-2',
            'me-south-1',
            'me-central-1',
            'sa-east-1',
        ];
        if (!validRegions.includes(region)) {
            throw new Error(
                `Invalid AWS region: ${region}. Please provide a valid region.`
            );
        }
        return region;
    }

    async writeFile(key, body, contentType) {
        if (!key || !body) throw new Error('Key and body are required');

        const command = new PutObjectCommand({
            Bucket: this.bucketName,
            Key: key,
            Body: body,
            ContentType: contentType,
        });

        try {
            const data = await this.s3Client.send(command);
            return data;
        } catch (err) {
            console.error('Error writing to S3:', err);
            throw err;
        }
    }

    async copyFile(sourceKey, destinationKey) {
        const command = new CopyObjectCommand({
            Bucket: this.bucketName,
            CopySource: `/${this.bucketName}/${sourceKey}`,
            Key: destinationKey,
        });

        try {
            await this.s3Client.send(command);
        } catch (error) {
            console.error(
                `Error copying file from ${sourceKey} to ${destinationKey}:`,
                error
            );
            throw error;
        }
    }

    async uploadFile(key, body, contentType) {
        return this.writeFile(key, body, contentType);
    }

    async getFile(key, encoding = 'utf-8') {
        if (!key) throw new Error('Key is required');

        const command = new GetObjectCommand({
            Bucket: this.bucketName,
            Key: key,
        });

        try {
            const { Body } = await this.s3Client.send(command);
            const fileContent = await Body.transformToString(encoding);
            return fileContent;
        } catch (err) {
            console.error('Error reading from S3:', err);
            console.error(
                'Error details:',
                JSON.stringify(
                    {
                        code: err.code,
                        message: err.message,
                        statusCode: err.$metadata?.httpStatusCode,
                        requestId: err.$metadata?.requestId,
                    },
                    null,
                    2
                )
            );

            if (err.$metadata?.httpStatusCode === 403) {
                console.error(
                    'Access Denied. Check IAM permissions and bucket policies.'
                );
            } else if (err.$metadata?.httpStatusCode === 404) {
                console.error(
                    'File not found. Check if the file exists in the specified path.'
                );
            }

            throw err;
        }
    }

    async fileExists(key) {
        if (!key) throw new Error('Key is required');

        const command = new HeadObjectCommand({
            Bucket: this.bucketName,
            Key: key,
        });

        try {
            await this.s3Client.send(command);
            return true;
        } catch (err) {
            if (err.$metadata?.httpStatusCode === 404) {
                return false;
            }
            throw err;
        }
    }

    async uploadFileFromStream(key, fileStream, contentType) {
        if (!key || !fileStream)
            throw new Error('Key and fileStream are required');

        const command = new PutObjectCommand({
            Bucket: this.bucketName,
            Key: key,
            Body: fileStream,
            ContentType: contentType,
        });

        try {
            const data = await this.s3Client.send(command);
            return data;
        } catch (err) {
            console.error('Error uploading to S3:', err);
            throw err;
        }
    }

    async deleteFile(key) {
        if (!key) throw new Error('Key is required');

        const command = new DeleteObjectCommand({
            Bucket: this.bucketName,
            Key: key,
        });

        try {
            const data = await this.s3Client.send(command);
            return data;
        } catch (err) {
            if (err.$metadata?.httpStatusCode === 404) {
                return { deleted: true };
            }
            console.error('Error deleting from S3:', err);
            throw err;
        }
    }

    async listObjects(prefix = '', maxKeys = 1000) {
        const command = new ListObjectsV2Command({
            Bucket: this.bucketName,
            Prefix: prefix,
            MaxKeys: maxKeys,
        });

        try {
            const data = await this.s3Client.send(command);
            return data.Contents;
        } catch (err) {
            console.error('Error listing objects from S3:', err);
            throw err;
        }
    }

    async getSignedUrl(key, expires = 60) {
        if (!key) throw new Error('Key is required');

        const command = new GetObjectCommand({
            Bucket: this.bucketName,
            Key: key,
        });

        try {
            const url = await getSignedUrl(this.s3Client, command, {
                expiresIn: expires,
            });
            return url;
        } catch (err) {
            throw err;
        }
    }

    getTrueUrl(key) {
        if (!key) throw new Error('Key is required');
        return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;
    }
}

module.exports = S3Utility;
