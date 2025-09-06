const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { authMiddleware } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    // Find user
    const user = await User.findOne({ username, isActive: true });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'your-fallback-secret-key',
      { expiresIn: '8h' }
    );

    // Log the login
    await AuditLog.create({
      action: 'user_login',
      userId: user._id,
      username: user.username,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    logger.info(`User ${username} logged in`);

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        permissions: user.permissions
      }
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get current user
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      id: user._id,
      username: user.username,
      role: user.role,
      permissions: user.permissions
    });
  } catch (error) {
    logger.error('Get current user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Logout
router.post('/logout', authMiddleware, async (req, res) => {
  try {
    // Log the logout
    await AuditLog.create({
      action: 'user_logout',
      userId: req.user.userId,
      username: req.user.username,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    logger.info(`User ${req.user.username} logged out`);
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;