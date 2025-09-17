@@ .. @@
 import React, { useState, useEffect } from 'react';
-import { Server, Activity, Wifi, WifiOff, Clock } from 'lucide-react';
+import { Server, Activity, Wifi, WifiOff, Clock, RefreshCw } from 'lucide-react';
 
 interface ServerStatus {
   id: string;
   name: string;
   ip: string;
+  group: string;
   status: 'online' | 'offline';
   responseTime: number;
   lastCheck: string;
+  pingStatus: 'success' | 'failed';
+  telnetStatus: 'success' | 'failed';
 }
 
 const ServerMonitoring: React.FC = () => {
   const [servers, setServers] = useState<ServerStatus[]>([]);
+  const [isRefreshing, setIsRefreshing] = useState(false);
+  const [lastSync, setLastSync] = useState<Date>(new Date());
 
   useEffect(() => {
     fetchServerStatus();
-    const interval = setInterval(fetchServerStatus, 60000); // Check every minute
+    const interval = setInterval(fetchServerStatus, 30000); // Check every 30 seconds
     return () => clearInterval(interval);
   }, []);
 
   const fetchServerStatus = async () => {
+    setIsRefreshing(true);
     try {
-      const response = await fetch('/api/servers/status');
-      const data = await response.json();
-      setServers(data);
+      const response = await fetch('http://localhost:3001/api/servers/status', {
+        headers: {
+          'Authorization': `Bearer ${localStorage.getItem('token')}`,
+        },
+      });
+      
+      if (response.ok) {
+        const data = await response.json();
+        // Only update if we have valid data and prevent duplicate servers
+        if (data && Array.isArray(data)) {
+          const uniqueServers = data.filter((server, index, self) => 
+            index === self.findIndex(s => s.id === server.id)
+          );
+          setServers(uniqueServers);
+          setLastSync(new Date());
+        }
+      }
     } catch (error) {
       console.error('Failed to fetch server status:', error);
+    } finally {
+      setIsRefreshing(false);
     }
   };
 
+  const formatLastCheck = (lastCheck: string) => {
+    if (!lastCheck || lastCheck === 'Never') return 'Never';
+    const date = new Date(lastCheck);
+    return date.toLocaleString();
+  };
+
+  const getStatusColor = (status: string) => {
+    switch (status) {
+      case 'online': return 'text-green-600';
+      case 'offline': return 'text-red-600';
+      default: return 'text-gray-600';
+    }
+  };
+
   return (
     <div className="space-y-6">
-      <h2 className="text-2xl font-bold text-gray-800">Server Monitoring</h2>
+      <div className="flex justify-between items-center">
+        <h2 className="text-2xl font-bold text-gray-800">Server Monitoring</h2>
+        <div className="flex items-center space-x-4">
+          <span className="text-sm text-gray-600">
+            Last sync: {lastSync.toLocaleTimeString()}
+          </span>
+          <button
+            onClick={fetchServerStatus}
+            disabled={isRefreshing}
+            className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
+          >
+            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
+            Refresh
+          </button>
+        </div>
+      </div>
       
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {servers.map((server) => (
           <div key={server.id} className="bg-white p-6 rounded-lg shadow-md">
             <div className="flex items-center justify-between mb-4">
               <div className="flex items-center">
                 <Server className="w-6 h-6 text-blue-600 mr-2" />
                 <h3 className="text-lg font-semibold">{server.name}</h3>
               </div>
               <div className="flex items-center">
-                {server.status === 'online' ? (
+                {server.status === 'online' && server.pingStatus === 'success' ? (
                   <Wifi className="w-5 h-5 text-green-600" />
                 ) : (
                   <WifiOff className="w-5 h-5 text-red-600" />
                 )}
               </div>
             </div>
             
             <div className="space-y-2">
               <p className="text-sm text-gray-600">IP: {server.ip}</p>
+              <p className="text-sm text-gray-600">Group: {server.group}</p>
               <p className={`text-sm font-medium ${getStatusColor(server.status)}`}>
                 Status: {server.status}
               </p>
+              <div className="flex space-x-4">
+                <p className={`text-sm ${server.pingStatus === 'success' ? 'text-green-600' : 'text-red-600'}`}>
+                  Ping: {server.pingStatus}
+                </p>
+                <p className={`text-sm ${server.telnetStatus === 'success' ? 'text-green-600' : 'text-red-600'}`}>
+                  Telnet: {server.telnetStatus}
+                </p>
+              </div>
               <p className="text-sm text-gray-600">
-                Response: {server.responseTime}ms
+                Response: {server.responseTime > 0 ? `${server.responseTime}ms` : 'N/A'}
               </p>
               <p className="text-sm text-gray-600 flex items-center">
                 <Clock className="w-4 h-4 mr-1" />
-                Last check: {server.lastCheck}
+                Last check: {formatLastCheck(server.lastCheck)}
               </p>
             </div>
           </div>
         ))}
       </div>
+      
+      {servers.length === 0 && (
+        <div className="text-center py-8">
+          <p className="text-gray-600">No servers configured</p>
+        </div>
+      )}
     </div>
   );
 };