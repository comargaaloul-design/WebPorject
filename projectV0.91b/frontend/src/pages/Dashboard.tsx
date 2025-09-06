import React from 'react';
import { 
  Server, 
  Wifi, 
  WifiOff, 
  Activity, 
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { useSocket } from '../contexts/SocketContext';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const Dashboard = () => {
  const { serverStatuses, connected } = useSocket();

  const onlineServers = serverStatuses.filter(s => s.pingStatus === 'online' && s.telnetStatus === 'online').length;
  const offlineServers = serverStatuses.filter(s => s.pingStatus === 'offline' || s.telnetStatus === 'offline').length;
  const checkingServers = serverStatuses.filter(s => s.pingStatus === 'checking' || s.telnetStatus === 'checking').length;

  const getStatusColor = (pingStatus: string, telnetStatus: string) => {
    if (pingStatus === 'offline' || telnetStatus === 'offline') return 'text-red-600 bg-red-50';
    if (pingStatus === 'checking' || telnetStatus === 'checking') return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  const getStatusIcon = (pingStatus: string, telnetStatus: string) => {
    if (pingStatus === 'offline' || telnetStatus === 'offline') return <AlertTriangle className="h-5 w-5" />;
    if (pingStatus === 'checking' || telnetStatus === 'checking') return <Clock className="h-5 w-5" />;
    return <CheckCircle className="h-5 w-5" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex items-center space-x-2">
          {connected ? (
            <div className="flex items-center space-x-2 text-green-600 bg-green-50 px-3 py-1 rounded-full">
              <Wifi className="h-4 w-4" />
              <span className="text-sm font-medium">Connecté</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2 text-red-600 bg-red-50 px-3 py-1 rounded-full">
              <WifiOff className="h-4 w-4" />
              <span className="text-sm font-medium">Déconnecté</span>
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Server className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Serveurs</p>
              <p className="text-2xl font-bold text-gray-900">{serverStatuses.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-green-50 rounded-lg">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">En Ligne</p>
              <p className="text-2xl font-bold text-gray-900">{onlineServers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-red-50 rounded-lg">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Hors Ligne</p>
              <p className="text-2xl font-bold text-gray-900">{offlineServers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-50 rounded-lg">
              <Activity className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Vérification</p>
              <p className="text-2xl font-bold text-gray-900">{checkingServers}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Server Status Table */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">État des Serveurs en Temps Réel</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Serveur
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Adresse IP
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Port
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ping
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Telnet
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dernière Vérification
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  État
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {serverStatuses.map((server, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {server.hostname}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {server.ip}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {server.port}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      server.pingStatus === 'online' ? 'bg-green-100 text-green-800' :
                      server.pingStatus === 'offline' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {server.pingStatus === 'online' ? 'OK' : 
                       server.pingStatus === 'offline' ? 'ERREUR' : 'VÉRIFICATION'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      server.telnetStatus === 'online' ? 'bg-green-100 text-green-800' :
                      server.telnetStatus === 'offline' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {server.telnetStatus === 'online' ? 'OK' : 
                       server.telnetStatus === 'offline' ? 'ERREUR' : 'VÉRIFICATION'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {server.lastCheck ? format(new Date(server.lastCheck), 'HH:mm:ss', { locale: fr }) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full ${getStatusColor(server.pingStatus, server.telnetStatus)}`}>
                      {getStatusIcon(server.pingStatus, server.telnetStatus)}
                      <span className="text-xs font-medium">
                        {server.pingStatus === 'offline' || server.telnetStatus === 'offline' ? 'PROBLÈME' :
                         server.pingStatus === 'checking' || server.telnetStatus === 'checking' ? 'VÉRIFICATION' :
                         'FONCTIONNEL'}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {serverStatuses.length === 0 && (
            <div className="text-center py-12">
              <Server className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun serveur configuré</h3>
              <p className="mt-1 text-sm text-gray-500">
                Commencez par ajouter des serveurs dans la section gestion.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;