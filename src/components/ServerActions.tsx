@@ .. @@
 import React, { useState, useEffect } from 'react';
-import { Power, RotateCcw, Square, Play } from 'lucide-react';
+import { Power, RotateCcw, Square, Play, Loader2 } from 'lucide-react';
 
 interface Server {
   id: string;
   name: string;
   ip: string;
+  group: string;
   status: 'online' | 'offline';
 }
 
+interface ActionStatus {
+  [key: string]: {
+    isLoading: boolean;
+    message: string;
+  };
+}
+
 const ServerActions: React.FC = () => {
   const [servers, setServers] = useState<Server[]>([]);
   const [selectedServers, setSelectedServers] = useState<string[]>([]);
+  const [actionStatus, setActionStatus] = useState<ActionStatus>({});
+  const [groups, setGroups] = useState<string[]>([]);
+  const [selectedGroup, setSelectedGroup] = useState<string>('');
 
   useEffect(() => {
     fetchServers();
+    fetchGroups();
   }, []);
 
   const fetchServers = async () => {
     try {
-      const response = await fetch('/api/servers');
-      const data = await response.json();
-      setServers(data);
+      const response = await fetch('http://localhost:3001/api/servers', {
+        headers: {
+          'Authorization': `Bearer ${localStorage.getItem('token')}`,
+        },
+      });
+      
+      if (response.ok) {
+        const data = await response.json();
+        setServers(data);
+        // Extract unique groups
+        const uniqueGroups = [...new Set(data.map((server: Server) => server.group))];
+        setGroups(uniqueGroups);
+      }
     } catch (error) {
       console.error('Failed to fetch servers:', error);
     }
   };
 
+  const fetchGroups = async () => {
+    try {
+      const response = await fetch('http://localhost:3001/api/groups', {
+        headers: {
+          'Authorization': `Bearer ${localStorage.getItem('token')}`,
+        },
+      });
+      
+      if (response.ok) {
+        const data = await response.json();
+        setGroups(data.map((group: any) => group.name));
+      }
+    } catch (error) {
+      console.error('Failed to fetch groups:', error);
+    }
+  };
+
   const handleServerSelection = (serverId: string) => {
     setSelectedServers(prev => 
       prev.includes(serverId) 
@@ -1,6 +1,6 @@
         : [...prev, serverId]
     );
   };
 
+  const handleGroupSelection = (group: string) => {
+    const groupServers = servers.filter(server => server.group === group);
+    const groupServerIds = groupServers.map(server => server.id);
+    
+    if (groupServerIds.every(id => selectedServers.includes(id))) {
+      // Deselect all servers in group
+      setSelectedServers(prev => prev.filter(id => !groupServerIds.includes(id)));
+    } else {
+      // Select all servers in group
+      setSelectedServers(prev => [...new Set([...prev, ...groupServerIds])]);
+    }
+  };
+
   const executeAction = async (action: string) => {
     if (selectedServers.length === 0) {
       alert('Please select at least one server');
       return;
     }
 
+    const actionKey = `${action}-${selectedServers.join(',')}`;
+    setActionStatus(prev => ({
+      ...prev,
+      [actionKey]: { isLoading: true, message: `${action} process initiated...` }
+    }));
+
     try {
-      const response = await fetch('/api/servers/action', {
+      const response = await fetch('http://localhost:3001/api/servers/action', {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
+          'Authorization': `Bearer ${localStorage.getItem('token')}`,
         },
         body: JSON.stringify({
           action,
           serverIds: selectedServers,
         }),
       });
 
-      if (response.ok) {
-        alert(`${action} action initiated successfully`);
+      const result = await response.json();
+      
+      if (response.ok && result.success) {
+        setActionStatus(prev => ({
+          ...prev,
+          [actionKey]: { isLoading: false, message: `${action} completed successfully` }
+        }));
+        
+        // Log the action
+        await logAction(action, selectedServers);
+        
+        // Clear selection after successful action
         setSelectedServers([]);
+        
+        // Refresh server status
+        setTimeout(fetchServers, 2000);
       } else {
-        alert(`Failed to execute ${action} action`);
+        setActionStatus(prev => ({
+          ...prev,
+          [actionKey]: { isLoading: false, message: `Failed to execute ${action}` }
+        }));
       }
     } catch (error) {
-      alert(`Failed to execute ${action} action`);
+      console.error(`Failed to execute ${action}:`, error);
+      setActionStatus(prev => ({
+        ...prev,
+        [actionKey]: { isLoading: false, message: `Failed to execute ${action}` }
+      }));
+    }
+
+    // Clear status message after 5 seconds
+    setTimeout(() => {
+      setActionStatus(prev => {
+        const newStatus = { ...prev };
+        delete newStatus[actionKey];
+        return newStatus;
+      });
+    }, 5000);
+  };
+
+  const logAction = async (action: string, serverIds: string[]) => {
+    try {
+      await fetch('http://localhost:3001/api/logs', {
+        method: 'POST',
+        headers: {
+          'Content-Type': 'application/json',
+          'Authorization': `Bearer ${localStorage.getItem('token')}`,
+        },
+        body: JSON.stringify({
+          action,
+          serverIds,
+          timestamp: new Date().toISOString(),
+          user: localStorage.getItem('username') || 'Unknown',
+        }),
+      });
+    } catch (error) {
+      console.error('Failed to log action:', error);
     }
   };
 
+  const filteredServers = selectedGroup 
+    ? servers.filter(server => server.group === selectedGroup)
+    : servers;
+
+  const getActionStatus = (action: string) => {
+    const actionKey = `${action}-${selectedServers.join(',')}`;
+    return actionStatus[actionKey];
+  };
+
   return (
     <div className="space-y-6">
       <h2 className="text-2xl font-bold text-gray-800">Server Actions</h2>
       
+      {/* Group Filter */}
+      <div className="bg-white p-4 rounded-lg shadow-md">
+        <h3 className="text-lg font-semibold mb-3">Filter by Group</h3>
+        <div className="flex flex-wrap gap-2">
+          <button
+            onClick={() => setSelectedGroup('')}
+            className={`px-3 py-1 rounded-full text-sm ${
+              selectedGroup === '' 
+                ? 'bg-blue-600 text-white' 
+                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
+            }`}
+          >
+            All Groups
+          </button>
+          {groups.map(group => (
+            <button
+              key={group}
+              onClick={() => setSelectedGroup(group)}
+              className={`px-3 py-1 rounded-full text-sm ${
+                selectedGroup === group 
+                  ? 'bg-blue-600 text-white' 
+                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
+              }`}
+            >
+              {group}
+            </button>
+          ))}
+        </div>
+      </div>
+
+      {/* Group Actions */}
+      {selectedGroup && (
+        <div className="bg-white p-4 rounded-lg shadow-md">
+          <h3 className="text-lg font-semibold mb-3">Group Actions</h3>
+          <button
+            onClick={() => handleGroupSelection(selectedGroup)}
+            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
+          >
+            {servers.filter(s => s.group === selectedGroup && selectedServers.includes(s.id)).length === 
+             servers.filter(s => s.group === selectedGroup).length 
+              ? `Deselect All in ${selectedGroup}` 
+              : `Select All in ${selectedGroup}`}
+          </button>
+        </div>
+      )}
+
       {/* Server Selection */}
       <div className="bg-white p-6 rounded-lg shadow-md">
         <h3 className="text-lg font-semibold mb-4">Select Servers</h3>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
-          {servers.map((server) => (
+          {filteredServers.map((server) => (
             <label key={server.id} className="flex items-center space-x-3 cursor-pointer">
               <input
                 type="checkbox"
                 checked={selectedServers.includes(server.id)}
                 onChange={() => handleServerSelection(server.id)}
                 className="w-4 h-4 text-blue-600"
               />
               <div>
                 <p className="font-medium">{server.name}</p>
                 <p className="text-sm text-gray-600">{server.ip}</p>
+                <p className="text-sm text-gray-500">Group: {server.group}</p>
                 <span className={`inline-block w-2 h-2 rounded-full ${
                   server.status === 'online' ? 'bg-green-500' : 'bg-red-500'
                 }`}></span>
               </div>
             </label>
           ))}
         </div>
+        
+        {selectedServers.length > 0 && (
+          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
+            <p className="text-sm text-blue-800">
+              {selectedServers.length} server(s) selected
+            </p>
+          </div>
+        )}
       </div>
 
       {/* Action Buttons */}
       <div className="bg-white p-6 rounded-lg shadow-md">
         <h3 className="text-lg font-semibold mb-4">Actions</h3>
         <div className="flex flex-wrap gap-4">
-          <button
-            onClick={() => executeAction('restart')}
-            className="flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
-          >
-            <RotateCcw className="w-4 h-4 mr-2" />
-            Restart
-          </button>
-          <button
-            onClick={() => executeAction('shutdown')}
-            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
-          >
-            <Power className="w-4 h-4 mr-2" />
-            Shutdown
-          </button>
-          <button
-            onClick={() => executeAction('start')}
-            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
-          >
-            <Play className="w-4 h-4 mr-2" />
-            Start
-          </button>
-          <button
-            onClick={() => executeAction('stop')}
-            className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
-          >
-            <Square className="w-4 h-4 mr-2" />
-            Stop
-          </button>
+          {[
+            { action: 'restart', icon: RotateCcw, color: 'yellow', label: 'Restart' },
+            { action: 'shutdown', icon: Power, color: 'red', label: 'Shutdown' },
+            { action: 'start', icon: Play, color: 'green', label: 'Start' },
+            { action: 'stop', icon: Square, color: 'gray', label: 'Stop' }
+          ].map(({ action, icon: Icon, color, label }) => {
+            const status = getActionStatus(action);
+            return (
+              <button
+                key={action}
+                onClick={() => executeAction(action)}
+                disabled={status?.isLoading}
+                className={`flex items-center px-4 py-2 bg-${color}-600 text-white rounded-lg hover:bg-${color}-700 disabled:opacity-50`}
+              >
+                {status?.isLoading ? (
+                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
+                ) : (
+                  <Icon className="w-4 h-4 mr-2" />
+                )}
+                {label}
+              </button>
+            );
+          })}
+        </div>
+        
+        {/* Status Messages */}
+        <div className="mt-4 space-y-2">
+          {Object.entries(actionStatus).map(([key, status]) => (
+            <div key={key} className={`p-3 rounded-lg ${
+              status.isLoading ? 'bg-blue-50 text-blue-800' : 'bg-green-50 text-green-800'
+            }`}>
+              <p className="text-sm">{status.message}</p>
+            </div>
+          ))}
         </div>
       </div>
     </div>
   );
 };