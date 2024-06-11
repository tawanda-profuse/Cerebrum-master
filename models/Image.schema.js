const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
    _id: { type: Number, required: true, unique: true },
    classification: { type: String, required: true },
    description: { type: String, required: true },
    url: { type: String, required: true },
});

const Image = mongoose.model('images', imageSchema);

module.exports = Image;
