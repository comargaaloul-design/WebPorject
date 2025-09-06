const express = require('express');
const nodemailer = require('nodemailer');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const AuditLog = require('../models/AuditLog');
const logger = require('../utils/logger');

const router = express.Router();

// In-memory settings storage (in production, use MongoDB)
let settings = {
  email: {
    host: 'smtp-mail.outlook.com',
    port: 587,
    secure: false,
    username: '',
    password: '',
    fromName: 'Server Monitor',
    fromEmail: ''
  },
  monitoring: {
    pingInterval: 60,
    telnetTimeout: 5000,
    alertEmails: [],
    enableEmailAlerts: true
  }
};

// Get all settings
router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    // Don't send password in response
    const safeSettings = {
      ...settings,
      email: {
        ...settings.email,
        password: settings.email.password ? '********' : ''
      }
    };
    res.json(safeSettings);
  } catch (error) {
    logger.error('Error fetching settings:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update email settings
router.put('/email', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    settings.email = {
      ...settings.email,
      ...req.body
    };

    // Log the action
    await AuditLog.create({
      action: 'settings_updated',
      userId: req.user.userId,
      username: req.user.username,
      details: { section: 'email' },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    logger.info(`Email settings updated by ${req.user.username}`);
    res.json({ message: 'Email settings updated successfully' });
  } catch (error) {
    logger.error('Error updating email settings:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update monitoring settings
router.put('/monitoring', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    settings.monitoring = {
      ...settings.monitoring,
      ...req.body
    };

    // Log the action
    await AuditLog.create({
      action: 'settings_updated',
      userId: req.user.userId,
      username: req.user.username,
      details: { section: 'monitoring' },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    logger.info(`Monitoring settings updated by ${req.user.username}`);
    res.json({ message: 'Monitoring settings updated successfully' });
  } catch (error) {
    logger.error('Error updating monitoring settings:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Test email configuration
router.post('/test-email', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { testEmail, ...emailConfig } = req.body;

    const transporter = nodemailer.createTransporter({
      host: emailConfig.host,
      port: emailConfig.port,
      secure: emailConfig.secure,
      auth: {
        user: emailConfig.username,
        pass: emailConfig.password
      }
    });

    await transporter.sendMail({
      from: `"${emailConfig.fromName}" <${emailConfig.fromEmail}>`,
      to: testEmail,
      subject: 'Test Email - Server Monitor',
      html: `
        <h2>Test Email - Server Monitor</h2>
        <p>Ceci est un email de test pour vérifier la configuration email.</p>
        <p><strong>Date:</strong> ${new Date().toLocaleString('fr-FR')}</p>
        <p><strong>Utilisateur:</strong> ${req.user.username}</p>
        <hr>
        <p><small>Cet email a été envoyé automatiquement par le système Server Monitor.</small></p>
      `
    });

    logger.info(`Test email sent successfully by ${req.user.username}`);
    res.json({ message: 'Test email sent successfully' });
  } catch (error) {
    logger.error('Error sending test email:', error);
    res.status(500).json({ 
      message: 'Failed to send test email',
      error: error.message 
    });
  }
});

// Get current email settings for notifications
function getEmailSettings() {
  return settings.email;
}

// Get current monitoring settings
function getMonitoringSettings() {
  return settings.monitoring;
}

module.exports = router;
module.exports.getEmailSettings = getEmailSettings;
module.exports.getMonitoringSettings = getMonitoringSettings;