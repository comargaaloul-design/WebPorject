const nodemailer = require('nodemailer');
const { getEmailSettings } = require('../routes/settings');
const logger = require('../utils/logger');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initialized = false;
  }

  async initialize() {
    try {
      const emailSettings = getEmailSettings();
      
      if (!emailSettings.username || !emailSettings.password) {
        logger.warn('Email service not initialized: missing credentials');
        return false;
      }

      this.transporter = nodemailer.createTransporter({
        host: emailSettings.host,
        port: emailSettings.port,
        secure: emailSettings.secure,
        auth: {
          user: emailSettings.username,
          pass: emailSettings.password
        }
      });

      // Test the connection
      await this.transporter.verify();
      this.initialized = true;
      logger.info('Email service initialized successfully');
      return true;
    } catch (error) {
      logger.error('Failed to initialize email service:', error);
      this.initialized = false;
      return false;
    }
  }

  async sendServerAlert(server, status, alertEmails) {
    if (!this.initialized) {
      const initResult = await this.initialize();
      if (!initResult) {
        logger.warn('Cannot send alert: email service not initialized');
        return false;
      }
    }

    try {
      const emailSettings = getEmailSettings();
      
      const subject = `🚨 Alerte Serveur: ${server.hostname} - ${status.pingStatus === 'offline' || status.telnetStatus === 'offline' ? 'HORS LIGNE' : 'PROBLÈME'}`;
      
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #ef4444; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">🚨 Alerte Serveur</h1>
          </div>
          
          <div style="padding: 20px; background-color: #f9f9f9;">
            <h2>Détails du Serveur</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr style="border-bottom: 1px solid #ddd;">
                <td style="padding: 8px; font-weight: bold;">Nom:</td>
                <td style="padding: 8px;">${server.hostname}</td>
              </tr>
              <tr style="border-bottom: 1px solid #ddd;">
                <td style="padding: 8px; font-weight: bold;">Adresse IP:</td>
                <td style="padding: 8px;">${server.ip}</td>
              </tr>
              <tr style="border-bottom: 1px solid #ddd;">
                <td style="padding: 8px; font-weight: bold;">Port:</td>
                <td style="padding: 8px;">${server.port}</td>
              </tr>
              <tr style="border-bottom: 1px solid #ddd;">
                <td style="padding: 8px; font-weight: bold;">Status Ping:</td>
                <td style="padding: 8px;">
                  <span style="color: ${status.pingStatus === 'online' ? 'green' : 'red'}; font-weight: bold;">
                    ${status.pingStatus === 'online' ? '✅ OK' : '❌ ÉCHEC'}
                  </span>
                </td>
              </tr>
              <tr style="border-bottom: 1px solid #ddd;">
                <td style="padding: 8px; font-weight: bold;">Status Telnet:</td>
                <td style="padding: 8px;">
                  <span style="color: ${status.telnetStatus === 'online' ? 'green' : 'red'}; font-weight: bold;">
                    ${status.telnetStatus === 'online' ? '✅ OK' : '❌ ÉCHEC'}
                  </span>
                </td>
              </tr>
              <tr>
                <td style="padding: 8px; font-weight: bold;">Dernière Vérification:</td>
                <td style="padding: 8px;">${new Date(status.lastCheck).toLocaleString('fr-FR')}</td>
              </tr>
            </table>
          </div>

          <div style="padding: 20px;">
            <h3>Actions Recommandées:</h3>
            <ul>
              <li>Vérifiez la connectivité réseau du serveur</li>
              <li>Vérifiez que les services nécessaires sont démarrés</li>
              <li>Consultez les logs du serveur pour plus de détails</li>
              <li>Si le problème persiste, envisagez un redémarrage</li>
            </ul>
          </div>

          <div style="background-color: #f0f0f0; padding: 10px; text-align: center; font-size: 12px; color: #666;">
            Cet email a été envoyé automatiquement par le système Server Monitor.
            <br>
            Date: ${new Date().toLocaleString('fr-FR')}
          </div>
        </div>
      `;

      for (const email of alertEmails) {
        await this.transporter.sendMail({
          from: `"${emailSettings.fromName}" <${emailSettings.fromEmail}>`,
          to: email,
          subject,
          html
        });
      }

      logger.info(`Server alert sent for ${server.hostname} to ${alertEmails.length} recipients`);
      return true;
    } catch (error) {
      logger.error('Failed to send server alert:', error);
      return false;
    }
  }

  async sendRestartNotification(servers, userInfo, alertEmails) {
    if (!this.initialized) {
      const initResult = await this.initialize();
      if (!initResult) {
        logger.warn('Cannot send notification: email service not initialized');
        return false;
      }
    }

    try {
      const emailSettings = getEmailSettings();
      
      const subject = `🔄 Notification: Redémarrage de ${servers.length} serveur(s)`;
      
      const serverList = servers.map(s => `<li>${s.hostname} (${s.ip}:${s.port})</li>`).join('');
      
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #3b82f6; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">🔄 Redémarrage de Serveurs</h1>
          </div>
          
          <div style="padding: 20px;">
            <p>Un redémarrage de serveurs a été initié:</p>
            
            <h3>Serveurs concernés:</h3>
            <ul style="background-color: #f9f9f9; padding: 15px;">
              ${serverList}
            </ul>
            
            <h3>Détails de l'opération:</h3>
            <table style="width: 100%; border-collapse: collapse; margin: 10px 0;">
              <tr style="border-bottom: 1px solid #ddd;">
                <td style="padding: 8px; font-weight: bold;">Utilisateur:</td>
                <td style="padding: 8px;">${userInfo.username}</td>
              </tr>
              <tr style="border-bottom: 1px solid #ddd;">
                <td style="padding: 8px; font-weight: bold;">Date/Heure:</td>
                <td style="padding: 8px;">${new Date().toLocaleString('fr-FR')}</td>
              </tr>
              <tr>
                <td style="padding: 8px; font-weight: bold;">Nombre de serveurs:</td>
                <td style="padding: 8px;">${servers.length}</td>
              </tr>
            </table>
          </div>

          <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; margin: 20px;">
            <h4 style="color: #856404; margin-top: 0;">⚠️ Information Importante</h4>
            <p style="color: #856404; margin-bottom: 0;">
              Les services seront temporairement indisponibles pendant le processus de redémarrage. 
              Vous recevrez une notification une fois le processus terminé.
            </p>
          </div>

          <div style="background-color: #f0f0f0; padding: 10px; text-align: center; font-size: 12px; color: #666;">
            Cet email a été envoyé automatiquement par le système Server Monitor.
          </div>
        </div>
      `;

      for (const email of alertEmails) {
        await this.transporter.sendMail({
          from: `"${emailSettings.fromName}" <${emailSettings.fromEmail}>`,
          to: email,
          subject,
          html
        });
      }

      logger.info(`Restart notification sent to ${alertEmails.length} recipients`);
      return true;
    } catch (error) {
      logger.error('Failed to send restart notification:', error);
      return false;
    }
  }
}

module.exports = new EmailService();