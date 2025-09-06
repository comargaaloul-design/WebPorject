const mongoose = require('mongoose');

const serverSchema = new mongoose.Schema({
  hostname: {
    type: String,
    required: true,
    unique: true
  },
  ip: {
    type: String,
    required: true
  },
  port: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  group: {
    type: String,
    required: true,
    enum: ['web', 'database', 'api', 'auth', 'proxy']
  },
  isActive: {
    type: Boolean,
    default: true
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

serverSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Server', serverSchema);