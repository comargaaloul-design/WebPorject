import React, { useState, useEffect } from 'react';
import { 
  RotateCcw, 
  Play, 
  Calendar,
  Server,
  CheckSquare,
  Square,
  Clock,
  Mail
} from 'lucide-react';
import axios from 'axios';

interface ServerConfig {
  _id: string;
  hostname: string;
  ip: string;
  port: number;
  group: string;
  isActive: boolean;
}

const RestartManager = () => {
  const [servers, setServers] = useState<ServerConfig[]>([]);
  const [selectedServers, setSelectedServers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [scheduleMode, setScheduleMode] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [notifyEmails, setNotifyEmails] = useState(false);
  const [restartInProgress, setRestartInProgress] = useState(false);

  useEffect(() => {
    fetchServers();
  }, []);

  const fetchServers = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/servers`);
      setServers(response.data.filter((s: ServerConfig) => s.isActive));
    } catch (error) {
      console.error('Error fetching servers:', error);
    }
  };

  const handleServerToggle = (serverId: string) => {
    setSelectedServers(prev => 
      prev.includes(serverId) 
        ? prev.filter(id => id !== serverId)
        : [...prev, serverId]
    );
  };

  const handleSelectAll = () => {
    if (selectedServers.length === servers.length) {
      setSelectedServers([]);
    } else {
      setSelectedServers(servers.map(s => s._id));
    }
  };

  const handleRestartNow = async () => {
    if (selectedServers.length === 0) {
      alert('Veuillez sélectionner au moins un serveur à redémarrer.');
      return;
    }

    if (!window.confirm(`Êtes-vous sûr de vouloir redémarrer ${selectedServers.length} serveur(s) maintenant ?`)) {
      return;
    }

    setRestartInProgress(true);
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/restart/execute`, {
        serverIds: selectedServers,
        notifyEmails
      });
      
      alert('Redémarrage initié avec succès !');
      setSelectedServers([]);
    } catch (error) {
      console.error('Error initiating restart:', error);
      alert('Erreur lors du redémarrage. Veuillez réessayer.');
    } finally {
      setRestartInProgress(false);
    }
  };

  const handleScheduleRestart = async () => {
    if (selectedServers.length === 0) {
      alert('Veuillez sélectionner au moins un serveur à redémarrer.');
      return;
    }

    if (!scheduledDate || !scheduledTime) {
      alert('Veuillez spécifier une date et une heure pour la planification.');
      return;
    }

    const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
    if (scheduledDateTime <= new Date()) {
      alert('La date et l\'heure doivent être dans le futur.');
      return;
    }

    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/restart/schedule`, {
        serverIds: selectedServers,
        scheduledTime: scheduledDateTime,
        notifyEmails
      });
      
      alert('Redémarrage planifié avec succès !');
      setSelectedServers([]);
      setScheduledDate('');
      setScheduledTime('');
      setScheduleMode(false);
    } catch (error) {
      console.error('Error scheduling restart:', error);
      alert('Erreur lors de la planification. Veuillez réessayer.');
    }
  };

  const presetSelections = [
    {
      name: 'Stack complet (sans SiegeAssurnetDigitale)',
      serverNames: ['SiegeAssurnetFront', 'droolslot2', 'siegeawf', 'siegeasdrools', 'siegeaskeycloak', 'siegeasbackend', 'assurnetprod']
    },
    {
      name: 'Stack complet (avec SiegeAssurnetDigitale)',
      serverNames: ['SiegeAssurnetFront', 'droolslot2', 'siegeawf', 'siegeasdrools', 'siegeaskeycloak', 'siegeasbackend', 'assurnetprod', 'SiegeAssurnetDigitale']
    },
    {
      name: 'Serveurs Web uniquement',
      serverNames: ['SiegeAssurnetFront', 'droolslot2', 'siegeawf', 'assurnetprod']
    }
  ];

  const handlePresetSelection = (serverNames: string[]) => {
    const serverIds = servers
      .filter(server => serverNames.includes(server.hostname))
      .map(server => server._id);
    setSelectedServers(serverIds);
  };

  const groupedServers = servers.reduce((acc, server) => {
    if (!acc[server.group]) {
      acc[server.group] = [];
    }
    acc[server.group].push(server);
    return acc;
  }, {} as Record<string, ServerConfig[]>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Gestionnaire de Redémarrage</h1>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setScheduleMode(!scheduleMode)}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
              scheduleMode ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <Clock className="h-4 w-4" />
            <span>{scheduleMode ? 'Mode planifié' : 'Mode immédiat'}</span>
          </button>
        </div>
      </div>

      {/* Preset Selections */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Sélections Rapides</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {presetSelections.map((preset, index) => (
            <button
              key={index}
              onClick={() => handlePresetSelection(preset.serverNames)}
              className="text-left p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              <h3 className="font-medium text-gray-900">{preset.name}</h3>
              <p className="text-sm text-gray-500 mt-1">
                {preset.serverNames.length} serveur(s)
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Server Selection */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">Sélection des Serveurs</h2>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500">
              {selectedServers.length} / {servers.length} sélectionné(s)
            </span>
            <button
              onClick={handleSelectAll}
              className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
            >
              {selectedServers.length === servers.length ? (
                <CheckSquare className="h-5 w-5" />
              ) : (
                <Square className="h-5 w-5" />
              )}
              <span className="text-sm">Tout sélectionner</span>
            </button>
          </div>
        </div>

        <div className="p-6">
          {Object.entries(groupedServers).map(([group, groupServers]) => (
            <div key={group} className="mb-6 last:mb-0">
              <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wider mb-3">
                {group} ({groupServers.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {groupServers.map((server) => (
                  <div
                    key={server._id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedServers.includes(server._id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleServerToggle(server._id)}
                  >
                    <div className="flex items-center space-x-3">
                      {selectedServers.includes(server._id) ? (
                        <CheckSquare className="h-5 w-5 text-blue-600" />
                      ) : (
                        <Square className="h-5 w-5 text-gray-400" />
                      )}
                      <Server className="h-5 w-5 text-gray-400" />
                      <div>
                        <div className="font-medium text-gray-900">{server.hostname}</div>
                        <div className="text-sm text-gray-500">{server.ip}:{server.port}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Schedule Section */}
      {scheduleMode && (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Planification</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Heure</label>
              <input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Options and Actions */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={notifyEmails}
                onChange={(e) => setNotifyEmails(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <Mail className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-700">Notifier par email</span>
            </label>
          </div>

          <div className="flex items-center space-x-3">
            {scheduleMode ? (
              <button
                onClick={handleScheduleRestart}
                disabled={loading || selectedServers.length === 0}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
              >
                <Calendar className="h-4 w-4" />
                <span>Planifier le Redémarrage</span>
              </button>
            ) : (
              <button
                onClick={handleRestartNow}
                disabled={restartInProgress || selectedServers.length === 0}
                className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
              >
                {restartInProgress ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                <span>
                  {restartInProgress ? 'Redémarrage en cours...' : 'Redémarrer Maintenant'}
                </span>
              </button>
            )}
          </div>
        </div>

        {selectedServers.length > 0 && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Attention:</strong> Cette action redémarrera {selectedServers.length} serveur(s). 
              Les services seront temporairement indisponibles pendant le processus de redémarrage.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RestartManager;