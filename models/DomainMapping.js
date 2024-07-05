const mongoose = require('mongoose');

const domainMappingSchema = new mongoose.Schema({
  domain: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  projectId: {
    type: String,
    required: true
  },
  sslCertPath: {
    type: String,
    required: true
  },
  sslKeyPath: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('DomainMapping', domainMappingSchema);