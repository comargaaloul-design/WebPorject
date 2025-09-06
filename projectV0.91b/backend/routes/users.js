const express = require('express');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Get all users (admin only)
router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ username: 1 });
    res.json(users);
  } catch (error) {
    logger.error('Error fetching users:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create new user (admin only)
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();

    // Log the action
    await AuditLog.create({
      action: 'user_created',
      userId: req.user.userId,
      username: req.user.username,
      details: { newUserId: user._id, newUsername: user.username },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    logger.info(`User ${user.username} created by ${req.user.username}`);
    res.status(201).json(user);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Username or email already exists' });
    }
    logger.error('Error creating user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update user (admin only)
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { password, ...updateData } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // If password is provided, update it separately to trigger hashing
    if (password && password.trim()) {
      user.password = password;
      await user.save();
    }

    // Log the action
    await AuditLog.create({
      action: 'user_updated',
      userId: req.user.userId,
      username: req.user.username,
      details: { updatedUserId: user._id, updatedUsername: user.username },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    logger.info(`User ${user.username} updated by ${req.user.username}`);
    res.json(user);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Username or email already exists' });
    }
    logger.error('Error updating user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete user (admin only)
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Log the action
    await AuditLog.create({
      action: 'user_deleted',
      userId: req.user.userId,
      username: req.user.username,
      details: { deletedUserId: user._id, deletedUsername: user.username },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    logger.info(`User ${user.username} deleted by ${req.user.username}`);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    logger.error('Error deleting user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;