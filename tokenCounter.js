const User = require('./User.schema');

async function estimateTokens(string1) {
    // Combine the strings and split into words
    const combinedString = string1
    const words = combinedString.match(/\S+/g) || [];

    // Estimate the number of tokens
    // Assuming 750 words are approximately 1000 tokens
    const wordToTokenRatio = 1000 / 750;
    const estimatedTokens = words.length * wordToTokenRatio;

    return Math.round(estimatedTokens);
}

module.exports = estimateTokens;
