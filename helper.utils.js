function extractJsonArray(rawArray) {
    const startIndex = rawArray.indexOf('[');
    const endIndex = rawArray.lastIndexOf(']') + 1;

    if (startIndex === -1 || endIndex === -1) {
        throw new Error('No JSON array found in the response.');
    }

    let jsonArrayString = rawArray.substring(startIndex, endIndex);
    jsonArrayString = jsonArrayString.replace(/\\"/g, '"');

    return jsonArrayString;
}

module.exports = {
    extractJsonArray,
};
