const express = require('express');
const Server = require('../models/Server');
const AuditLog = require('../models/AuditLog');
const { authMiddleware, permissionMiddleware } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Get all servers
router.get('/', authMiddleware, permissionMiddleware('servers'), async (req, res) => {
  try {
    const servers = await Server.find().sort({ hostname: 1 });
    res.json(servers);
  } catch (error) {
    logger.error('Error fetching servers:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create new server
router.post('/', authMiddleware, permissionMiddleware('servers'), async (req, res) => {
  try {
    const server = new Server(req.body);
    await server.save();

    // Log the action
    await AuditLog.create({
      action: 'server_created',
      userId: req.user.userId,
      username: req.user.username,
      details: { serverId: server._id, hostname: server.hostname },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    logger.info(`Server ${server.hostname} created by ${req.user.username}`);
    res.status(201).json(server);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Server hostname already exists' });
    }
    logger.error('Error creating server:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update server
router.put('/:id', authMiddleware, permissionMiddleware('servers'), async (req, res) => {
  try {
    const server = await Server.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!server) {
      return res.status(404).json({ message: 'Server not found' });
    }

    // Log the action
    await AuditLog.create({
      action: 'server_updated',
      userId: req.user.userId,
      username: req.user.username,
      details: { serverId: server._id, hostname: server.hostname },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    logger.info(`Server ${server.hostname} updated by ${req.user.username}`);
    res.json(server);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Server hostname already exists' });
    }
    logger.error('Error updating server:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete server
router.delete('/:id', authMiddleware, permissionMiddleware('servers'), async (req, res) => {
  try {
    const server = await Server.findByIdAndDelete(req.params.id);

    if (!server) {
      return res.status(404).json({ message: 'Server not found' });
    }

    // Log the action
    await AuditLog.create({
      action: 'server_deleted',
      userId: req.user.userId,
      username: req.user.username,
      details: { serverId: server._id, hostname: server.hostname },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    logger.info(`Server ${server.hostname} deleted by ${req.user.username}`);
    res.json({ message: 'Server deleted successfully' });
  } catch (error) {
    logger.error('Error deleting server:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;