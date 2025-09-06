import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Mail, 
  Server,
  Shield,
  Save,
  Eye,
  EyeOff,
  TestTube
} from 'lucide-react';
import axios from 'axios';

interface EmailSettings {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
  fromName: string;
  fromEmail: string;
}

interface MonitoringSettings {
  pingInterval: number;
  telnetTimeout: number;
  alertEmails: string[];
  enableEmailAlerts: boolean;
}

const Settings = () => {
  const [emailSettings, setEmailSettings] = useState<EmailSettings>({
    host: 'smtp-mail.outlook.com',
    port: 587,
    secure: false,
    username: '',
    password: '',
    fromName: 'Server Monitor',
    fromEmail: ''
  });

  const [monitoringSettings, setMonitoringSettings] = useState<MonitoringSettings>({
    pingInterval: 60,
    telnetTimeout: 5000,
    alertEmails: [],
    enableEmailAlerts: true
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [newAlertEmail, setNewAlertEmail] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/settings`);
      setEmailSettings(response.data.email || emailSettings);
      setMonitoringSettings(response.data.monitoring || monitoringSettings);
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const saveEmailSettings = async () => {
    setLoading(true);
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/api/settings/email`, emailSettings);
      alert('Paramètres email sauvegardés avec succès !');
    } catch (error) {
      console.error('Error saving email settings:', error);
      alert('Erreur lors de la sauvegarde des paramètres email');
    } finally {
      setLoading(false);
    }
  };

  const saveMonitoringSettings = async () => {
    setLoading(true);
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/api/settings/monitoring`, monitoringSettings);
      alert('Paramètres de monitoring sauvegardés avec succès !');
    } catch (error) {
      console.error('Error saving monitoring settings:', error);
      alert('Erreur lors de la sauvegarde des paramètres de monitoring');
    } finally {
      setLoading(false);
    }
  };

  const testEmailConnection = async () => {
    setTestingEmail(true);
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/settings/test-email`, {
        ...emailSettings,
        testEmail: emailSettings.fromEmail
      });
      alert('Test email envoyé avec succès ! Vérifiez votre boîte mail.');
    } catch (error) {
      console.error('Error testing email:', error);
      alert('Erreur lors du test email. Vérifiez vos paramètres.');
    } finally {
      setTestingEmail(false);
    }
  };

  const addAlertEmail = () => {
    if (newAlertEmail && !monitoringSettings.alertEmails.includes(newAlertEmail)) {
      setMonitoringSettings({
        ...monitoringSettings,
        alertEmails: [...monitoringSettings.alertEmails, newAlertEmail]
      });
      setNewAlertEmail('');
    }
  };

  const removeAlertEmail = (email: string) => {
    setMonitoringSettings({
      ...monitoringSettings,
      alertEmails: monitoringSettings.alertEmails.filter(e => e !== email)
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Paramètres</h1>
        <SettingsIcon className="h-8 w-8 text-gray-400" />
      </div>

      {/* Email Settings */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center">
          <Mail className="h-6 w-6 text-blue-600 mr-3" />
          <h2 className="text-lg font-medium text-gray-900">Configuration Email (Microsoft 365)</h2>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Serveur SMTP</label>
              <input
                type="text"
                value={emailSettings.host}
                onChange={(e) => setEmailSettings({ ...emailSettings, host: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="smtp-mail.outlook.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Port</label>
              <input
                type="number"
                value={emailSettings.port}
                onChange={(e) => setEmailSettings({ ...emailSettings, port: parseInt(e.target.value) })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email utilisateur</label>
              <input
                type="email"
                value={emailSettings.username}
                onChange={(e) => setEmailSettings({ 
                  ...emailSettings, 
                  username: e.target.value,
                  fromEmail: e.target.value 
                })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="votre-email@votredomaine.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mot de passe</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={emailSettings.password}
                  onChange={(e) => setEmailSettings({ ...emailSettings, password: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Mot de passe de l'application"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Utilisez un mot de passe d'application pour Microsoft 365
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nom de l'expéditeur</label>
              <input
                type="text"
                value={emailSettings.fromName}
                onChange={(e) => setEmailSettings({ ...emailSettings, fromName: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Server Monitor"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="secure"
                checked={emailSettings.secure}
                onChange={(e) => setEmailSettings({ ...emailSettings, secure: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="secure" className="ml-2 block text-sm text-gray-900">
                Connexion sécurisée (TLS)
              </label>
            </div>
          </div>

          <div className="mt-6 flex items-center space-x-4">
            <button
              onClick={saveEmailSettings}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>Sauvegarder</span>
            </button>
            
            <button
              onClick={testEmailConnection}
              disabled={testingEmail || !emailSettings.username || !emailSettings.password}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
            >
              {testingEmail ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              ) : (
                <TestTube className="h-4 w-4" />
              )}
              <span>{testingEmail ? 'Test en cours...' : 'Tester'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Monitoring Settings */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center">
          <Server className="h-6 w-6 text-green-600 mr-3" />
          <h2 className="text-lg font-medium text-gray-900">Configuration du Monitoring</h2>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Intervalle de vérification (secondes)
              </label>
              <input
                type="number"
                value={monitoringSettings.pingInterval}
                onChange={(e) => setMonitoringSettings({ 
                  ...monitoringSettings, 
                  pingInterval: parseInt(e.target.value) 
                })}
                min="30"
                max="3600"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Fréquence des vérifications ping/telnet (minimum 30 secondes)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Timeout Telnet (millisecondes)
              </label>
              <input
                type="number"
                value={monitoringSettings.telnetTimeout}
                onChange={(e) => setMonitoringSettings({ 
                  ...monitoringSettings, 
                  telnetTimeout: parseInt(e.target.value) 
                })}
                min="1000"
                max="30000"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="mt-6">
            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                id="enableEmailAlerts"
                checked={monitoringSettings.enableEmailAlerts}
                onChange={(e) => setMonitoringSettings({ 
                  ...monitoringSettings, 
                  enableEmailAlerts: e.target.checked 
                })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="enableEmailAlerts" className="ml-2 block text-sm font-medium text-gray-900">
                Activer les alertes par email
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Emails d'alerte
              </label>
              <div className="flex items-center space-x-2 mb-3">
                <input
                  type="email"
                  value={newAlertEmail}
                  onChange={(e) => setNewAlertEmail(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addAlertEmail()}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="email@exemple.com"
                />
                <button
                  onClick={addAlertEmail}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Ajouter
                </button>
              </div>
              
              <div className="space-y-2">
                {monitoringSettings.alertEmails.map((email, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg">
                    <span className="text-sm text-gray-900">{email}</span>
                    <button
                      onClick={() => removeAlertEmail(email)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Supprimer
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={saveMonitoringSettings}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>Sauvegarder</span>
            </button>
          </div>
        </div>
      </div>

      {/* Security Notice */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start">
          <Shield className="h-6 w-6 text-yellow-600 mt-0.5 mr-3" />
          <div>
            <h3 className="text-sm font-medium text-yellow-800">Sécurité</h3>
            <div className="mt-1 text-sm text-yellow-700">
              <p>• Utilisez un mot de passe d'application pour Microsoft 365, pas votre mot de passe principal</p>
              <p>• Les mots de passe sont chiffrés avant d'être stockés</p>
              <p>• Vérifiez régulièrement les logs d'audit pour détecter toute activité suspecte</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;