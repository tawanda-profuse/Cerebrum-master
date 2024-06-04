require('dotenv').config();
const mongoose = require('mongoose');
const Image = require('./models/Image.schema');

async function fetchImages() {
  // Connect to MongoDB
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('MONGO_URI is not defined in the environment variables');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
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

module.exports = { fetchImages };
