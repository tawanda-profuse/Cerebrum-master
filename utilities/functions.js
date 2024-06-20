require('dotenv').config();
const jwt = require('jsonwebtoken');
const UserModel = require('../User.schema');

async function extractJsonArray(rawArray) {
    const startIndex = rawArray.indexOf('[');
    const endIndex = rawArray.lastIndexOf(']') + 1;

    if (startIndex === -1 || endIndex === -1) {
        console.log('No JSON array found in the response.');
    }

    let jsonArrayString = rawArray.substring(startIndex, endIndex);
    jsonArrayString = jsonArrayString.replace(/\\"/g, '"');

    return jsonArrayString;
}

// JWT Verification Middleware
function verifyToken(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(403).send('A token is required for authentication');
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
    } catch (err) {
        return res.status(401).send('User is not authenticated');
    }

    return next();
}

function verifyWebSocketToken(token) {
    return new Promise((resolve, reject) => {
        if (!token) {
            return reject(new Error('A token is required for authentication'));
        }

        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) {
                return reject(new Error('User is not authenticated'));
            }
            resolve(decoded);
        });
    });
}

async function isSubscriptionAmountZero(userId) {
    const amount = await UserModel.getSubscriptionAmount(userId);

    return amount <= 0;
}

module.exports = {
    verifyToken,
    isSubscriptionAmountZero,
    extractJsonArray,
    verifyWebSocketToken,
};
