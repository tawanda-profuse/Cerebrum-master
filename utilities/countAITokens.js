// Import the 'natural' library for natural language processing
const natural = require('natural');

// Function to calculate the number of tokens in a text
function countAITokens(text) {
    // Tokenizer for splitting text into words
    const tokenizer = new natural.WordTokenizer();
    // Tokenize the text
    const tokens = tokenizer.tokenize(text);
    // Return the number of tokens
    return tokens.length + 5;
}

module.exports = countAITokens;
