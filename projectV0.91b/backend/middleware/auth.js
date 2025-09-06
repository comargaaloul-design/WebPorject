const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-fallback-secret-key');
    
    const user = await User.findById(decoded.userId).select('-password');
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Token is not valid' });
    }

    req.user = {
      userId: user._id,
      username: user.username,
      role: user.role,
      permissions: user.permissions
    };
    
    next();
  } catch (error) {
    logger.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

const permissionMiddleware = (requiredPermission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Admin has all permissions
    if (req.user.role === 'admin') {
      return next();
    }

    // Check if user has the required permission
    if (!req.user.permissions.includes(requiredPermission)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    next();
  };
};

const adminMiddleware = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }

  next();
};

module.exports = {
  authMiddleware,
  permissionMiddleware,
  adminMiddleware
};