const Server = require('../models/Server');
const ping = require('ping');
const logger = require('../utils/logger');
const net = require('net');

class MonitoringService {
  constructor(io) {
    this.io = io;
    this.serverStatuses = new Map();
    this.isRunning = false;
    this.intervalId = null;
  }

  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    logger.info('Monitoring service started');
    
    // Initial check
    this.checkAllServers();
    
    // Check every minute
    this.intervalId = setInterval(() => {
      this.checkAllServers();
    }, 60000);
  }

  stop() {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    logger.info('Monitoring service stopped');
  }

  async checkAllServers() {
    try {
      const servers = await Server.find({ isActive: true });
      
      for (const server of servers) {
        this.checkServer(server);
      }
    } catch (error) {
      logger.error('Error checking servers:', error);
    }
  }

  async checkServer(server) {
    const serverId = server._id.toString();
    
    try {
      // Check ping
      const pingResult = await ping.promise.probe(server.ip, {
        timeout: 10,
        extra: ['-c', '1']
      });

      // Check telnet (port connectivity)
      const telnetStatus = await this.checkTelnet(server.ip, server.port);

      const status = {
        hostname: server.hostname,
        ip: server.ip,
        port: server.port,
        pingStatus: pingResult.alive ? 'online' : 'offline',
        telnetStatus: telnetStatus ? 'online' : 'offline',
        lastCheck: new Date().toISOString()
      };

      this.serverStatuses.set(serverId, status);
      
      // Log status changes
      const previousStatus = this.serverStatuses.get(serverId);
      if (!previousStatus || 
          previousStatus.pingStatus !== status.pingStatus || 
          previousStatus.telnetStatus !== status.telnetStatus) {
        
        logger.info(`Server ${server.hostname} status: PING=${status.pingStatus}, TELNET=${status.telnetStatus}`);
        
        // If server goes offline, this could trigger email notifications
        if (status.pingStatus === 'offline' || status.telnetStatus === 'offline') {
          this.handleServerDown(server, status);
        }
      }

    } catch (error) {
      logger.error(`Error checking server ${server.hostname}:`, error);
      
      const status = {
        hostname: server.hostname,
        ip: server.ip,
        port: server.port,
        pingStatus: 'offline',
        telnetStatus: 'offline',
        lastCheck: new Date().toISOString()
      };
      
      this.serverStatuses.set(serverId, status);
    }

    // Send update to connected clients
    this.sendStatusUpdate();
  }

  async checkTelnet(host, port) {
    return new Promise((resolve) => {
      const socket = new net.Socket();
      
      socket.setTimeout(10000); // Increased timeout
      
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
      
      try {
        socket.connect(port, host);
      } catch (error) {
        resolve(false);
      }
    });
  }

  handleServerDown(server, status) {
    // Here you would implement email notification logic
    // For now, just log the event
    logger.warn(`Server ${server.hostname} is down - PING: ${status.pingStatus}, TELNET: ${status.telnetStatus}`);
    
    // TODO: Implement email notification service
    // this.emailService.sendAlert(server, status);
  }

  sendStatusUpdate() {
    const statuses = Array.from(this.serverStatuses.values());
    this.io.emit('serverStatus', statuses);
  }

  getServerStatuses() {
    return Array.from(this.serverStatuses.values());
  }
}

module.exports = MonitoringService;