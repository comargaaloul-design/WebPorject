const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'operator', 'viewer'],
    default: 'viewer'
  },
  permissions: [{
    type: String,
    enum: ['dashboard', 'servers', 'restart', 'audit', 'users', 'settings']
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
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

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Set default permissions based on role
userSchema.pre('save', function(next) {
  if (this.isModified('role') || this.isNew) {
    switch (this.role) {
      case 'admin':
        this.permissions = ['dashboard', 'servers', 'restart', 'audit', 'users', 'settings'];
        break;
      case 'operator':
        this.permissions = ['dashboard', 'servers', 'restart', 'audit'];
        break;
      case 'viewer':
        this.permissions = ['dashboard', 'audit'];
        break;
    }
  }
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('User', userSchema);