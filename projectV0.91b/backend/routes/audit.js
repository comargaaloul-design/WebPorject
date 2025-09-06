const express = require('express');
const AuditLog = require('../models/AuditLog');
const { authMiddleware, permissionMiddleware } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Get audit logs with pagination and filtering
router.get('/', authMiddleware, permissionMiddleware('audit'), async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      action, 
      dateFrom, 
      dateTo,
      userId
    } = req.query;

    const query = {};
    
    // Filter by action
    if (action && action !== 'all') {
      query.action = action;
    }
    
    // Filter by date range
    if (dateFrom || dateTo) {
      query.timestamp = {};
      if (dateFrom) {
        query.timestamp.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        query.timestamp.$lte = new Date(new Date(dateTo).setHours(23, 59, 59, 999));
      }
    }
    
    // Filter by user
    if (userId) {
      query.userId = userId;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [logs, totalCount] = await Promise.all([
      AuditLog.find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('userId', 'username'),
      AuditLog.countDocuments(query)
    ]);

    const totalPages = Math.ceil(totalCount / parseInt(limit));

    res.json({
      logs,
      currentPage: parseInt(page),
      totalPages,
      totalCount,
      hasNextPage: parseInt(page) < totalPages,
      hasPrevPage: parseInt(page) > 1
    });
  } catch (error) {
    logger.error('Error fetching audit logs:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Export audit logs as CSV
router.get('/export', authMiddleware, permissionMiddleware('audit'), async (req, res) => {
  try {
    const { action, dateFrom, dateTo, userId } = req.query;
    
    const query = {};
    
    if (action && action !== 'all') {
      query.action = action;
    }
    
    if (dateFrom || dateTo) {
      query.timestamp = {};
      if (dateFrom) {
        query.timestamp.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        query.timestamp.$lte = new Date(new Date(dateTo).setHours(23, 59, 59, 999));
      }
    }
    
    if (userId) {
      query.userId = userId;
    }

    const logs = await AuditLog.find(query)
      .sort({ timestamp: -1 })
      .limit(10000) // Limit export to prevent memory issues
      .populate('userId', 'username');

    // Create CSV content
    const csvHeader = 'Date,Action,Username,IP Address,Details\n';
    const csvRows = logs.map(log => {
      const date = log.timestamp.toISOString();
      const action = log.action;
      const username = log.username;
      const ip = log.ipAddress || '';
      const details = JSON.stringify(log.details || {}).replace(/"/g, '""');
      
      return `"${date}","${action}","${username}","${ip}","${details}"`;
    }).join('\n');

    const csv = csvHeader + csvRows;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="audit-logs.csv"');
    res.send(csv);
  } catch (error) {
    logger.error('Error exporting audit logs:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get audit statistics
router.get('/stats', authMiddleware, permissionMiddleware('audit'), async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;
    
    const matchStage = {};
    if (dateFrom || dateTo) {
      matchStage.timestamp = {};
      if (dateFrom) {
        matchStage.timestamp.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        matchStage.timestamp.$lte = new Date(new Date(dateTo).setHours(23, 59, 59, 999));
      }
    }

    const stats = await AuditLog.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$action',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const totalLogs = await AuditLog.countDocuments(matchStage);
    
    res.json({
      totalLogs,
      actionStats: stats
    });
  } catch (error) {
    logger.error('Error fetching audit stats:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;