const express = require('express');
const { spawn } = require('child_process');
const Server = require('../models/Server');
const AuditLog = require('../models/AuditLog');
const { authMiddleware, permissionMiddleware } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Execute immediate restart
router.post('/execute', authMiddleware, permissionMiddleware('restart'), async (req, res) => {
  try {
    const { serverIds, notifyEmails } = req.body;

    if (!serverIds || !Array.isArray(serverIds) || serverIds.length === 0) {
      return res.status(400).json({ message: 'Server IDs are required' });
    }

    // Get server details
    const servers = await Server.find({ _id: { $in: serverIds }, isActive: true });
    
    if (servers.length === 0) {
      return res.status(404).json({ message: 'No active servers found' });
    }

    // Log the restart initiation
    await AuditLog.create({
      action: 'restart_initiated',
      userId: req.user.userId,
      username: req.user.username,
      details: { 
        serverCount: servers.length,
        servers: servers.map(s => ({ id: s._id, hostname: s.hostname })),
        notifyEmails
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Execute restart process
    executeRestart(servers, req.user, notifyEmails);

    logger.info(`Restart initiated by ${req.user.username} for ${servers.length} servers`);
    res.json({ 
      message: 'Restart process initiated successfully',
      servers: servers.map(s => ({ hostname: s.hostname, ip: s.ip }))
    });

  } catch (error) {
    logger.error('Error executing restart:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Schedule restart
router.post('/schedule', authMiddleware, permissionMiddleware('restart'), async (req, res) => {
  try {
    const { serverIds, scheduledTime, notifyEmails } = req.body;

    if (!serverIds || !Array.isArray(serverIds) || serverIds.length === 0) {
      return res.status(400).json({ message: 'Server IDs are required' });
    }

    if (!scheduledTime) {
      return res.status(400).json({ message: 'Scheduled time is required' });
    }

    const scheduleDate = new Date(scheduledTime);
    if (scheduleDate <= new Date()) {
      return res.status(400).json({ message: 'Scheduled time must be in the future' });
    }

    // Get server details
    const servers = await Server.find({ _id: { $in: serverIds }, isActive: true });
    
    if (servers.length === 0) {
      return res.status(404).json({ message: 'No active servers found' });
    }

    // Schedule the restart
    const delay = scheduleDate.getTime() - Date.now();
    
    setTimeout(() => {
      executeRestart(servers, req.user, notifyEmails);
      
      logger.info(`Scheduled restart executed for ${servers.length} servers`);
    }, delay);

    // Log the scheduling
    await AuditLog.create({
      action: 'restart_scheduled',
      userId: req.user.userId,
      username: req.user.username,
      details: { 
        serverCount: servers.length,
        servers: servers.map(s => ({ id: s._id, hostname: s.hostname })),
        scheduledTime: scheduleDate,
        notifyEmails
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    logger.info(`Restart scheduled by ${req.user.username} for ${servers.length} servers at ${scheduleDate}`);
    res.json({ 
      message: 'Restart scheduled successfully',
      scheduledTime: scheduleDate,
      servers: servers.map(s => ({ hostname: s.hostname, ip: s.ip }))
    });

  } catch (error) {
    logger.error('Error scheduling restart:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Execute restart process (based on original bash script logic)
async function executeRestart(servers, user, notifyEmails) {
  try {
    logger.info('Starting restart process');
    
    // Step 1: Ping all servers first
    logger.info('Step 1: Checking server connectivity');
    const pingResults = await Promise.all(servers.map(server => pingServer(server)));
    
    const offlineServers = pingResults.filter(result => !result.success);
    if (offlineServers.length > 0) {
      logger.warn(`Some servers are offline: ${offlineServers.map(s => s.hostname).join(', ')}`);
      
      await AuditLog.create({
        action: 'restart_failed',
        userId: user.userId,
        username: user.username,
        details: { 
          reason: 'Some servers unreachable',
          offlineServers: offlineServers.map(s => s.hostname)
        }
      });
      
      return;
    }

    // Step 2: Reboot servers (excluding siegedbc as per original script)
    logger.info('Step 2: Rebooting servers');
    const serversToReboot = servers.filter(s => s.hostname !== 'siegedbc');
    
    for (const server of serversToReboot) {
      try {
        await rebootServer(server);
        logger.info(`Reboot command sent to ${server.hostname}`);
      } catch (error) {
        logger.error(`Failed to reboot ${server.hostname}:`, error);
      }
    }

    // Special handling for assurnetprod (as per original script)
    const assurnetprod = servers.find(s => s.hostname === 'assurnetprod');
    if (assurnetprod) {
      try {
        await executeSSHCommand(assurnetprod.ip, 'nohup bash /usr/etc/scripts/stop_wildfly.sh > /dev/null 2>&1 &');
        logger.info('Wildfly stop script executed on assurnetprod');
      } catch (error) {
        logger.error('Failed to execute wildfly stop script:', error);
      }
    }

    // Step 3: Wait before telnet tests (as per original script)
    logger.info('Step 3: Waiting 2 minutes before telnet tests');
    await sleep(120000);

    // Step 4: Telnet tests with grouping and delays (as per original script)
    logger.info('Step 4: Starting telnet tests');
    
    // Group 0
    logger.info('Group 0 Telnet Test');
    await telnetTest('SiegeAssurnetFront', 80, servers);
    await telnetTest('droolslot2', 80, servers);
    await sleep(180000); // 3 minutes

    // Group 1
    logger.info('Group 1 Telnet Test');
    await telnetTest('siegeawf', 80, servers);
    await telnetTest('siegeasdrools', 8080, servers);
    await sleep(120000); // 2 minutes

    // Group 2
    logger.info('Group 2 Telnet Test');
    await telnetTest('siegeaskeycloak', 8080, servers);
    await sleep(650000); // ~11 minutes

    // Group 3
    logger.info('Group 3 Telnet Test');
    const digitalServer = servers.find(s => s.hostname === 'SiegeAssurnetDigitale');
    if (digitalServer) {
      await telnetTest('SiegeAssurnetDigitale', 7002, servers);
    }
    await telnetTest('siegeasbackend', 7001, servers);
    await telnetTest('assurnetprod', 80, servers);

    logger.info('Restart process completed successfully');
    
    // Log successful completion
    await AuditLog.create({
      action: 'restart_completed',
      userId: user.userId,
      username: user.username,
      details: { 
        serverCount: servers.length,
        servers: servers.map(s => ({ id: s._id, hostname: s.hostname }))
      }
    });

    // Send email notification if requested
    if (notifyEmails) {
      // TODO: Implement email notification
      logger.info('Email notification requested but not yet implemented');
    }

  } catch (error) {
    logger.error('Restart process failed:', error);
    
    await AuditLog.create({
      action: 'restart_failed',
      userId: user.userId,
      username: user.username,
      details: { 
        error: error.message,
        serverCount: servers.length
      }
    });
  }
}

// Ping server function
function pingServer(server) {
  return new Promise((resolve) => {
    const ping = spawn('ping', ['-c', '1', server.ip]);
    
    ping.on('close', (code) => {
      resolve({
        hostname: server.hostname,
        ip: server.ip,
        success: code === 0
      });
    });
    
    ping.on('error', (error) => {
      logger.error(`Ping error for ${server.hostname}:`, error);
      resolve({
        hostname: server.hostname,
        ip: server.ip,
        success: false
      });
    });
  });
}

// Reboot server function
function rebootServer(server) {
  return new Promise((resolve, reject) => {
    const ssh = spawn('ssh', [`root@${server.ip}`, 'reboot']);
    
    ssh.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`SSH reboot failed with code ${code}`));
      }
    });
    
    ssh.on('error', (error) => {
      reject(error);
    });
  });
}

// Execute SSH command
function executeSSHCommand(ip, command) {
  return new Promise((resolve, reject) => {
    const ssh = spawn('ssh', [`root@${ip}`, command]);
    
    ssh.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`SSH command failed with code ${code}`));
      }
    });
    
    ssh.on('error', (error) => {
      reject(error);
    });
  });
}

// Telnet test function with retry logic
async function telnetTest(hostname, port, servers) {
  const server = servers.find(s => s.hostname === hostname);
  if (!server) {
    logger.warn(`Server ${hostname} not found for telnet test`);
    return;
  }

  const maxRetries = 30; // Max retries
  const retryInterval = 120000; // 2 minutes between retries
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const success = await testTelnetConnection(server.ip, port);
      if (success) {
        logger.info(`TELNET OK: ${hostname}:${port}`);
        return true;
      }
    } catch (error) {
      logger.warn(`TELNET attempt ${attempt} failed for ${hostname}:${port}`);
    }
    
    if (attempt < maxRetries) {
      logger.info(`TELNET FAILED: ${hostname}:${port} - Retrying in 2 minutes (attempt ${attempt}/${maxRetries})`);
      await sleep(retryInterval);
    }
  }
  
  logger.error(`TELNET FAILED: ${hostname}:${port} - Max retries exceeded`);
  return false;
}

// Test telnet connection
function testTelnetConnection(ip, port) {
  return new Promise((resolve) => {
    const net = require('net');
    const socket = new net.Socket();
    
    socket.setTimeout(5000);
    
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    
    socket.on('error', () => {
      resolve(false);
    });
    
    socket.connect(port, ip);
  });
}

// Sleep utility
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = router;