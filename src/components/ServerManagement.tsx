@@ .. @@
 import React, { useState, useEffect } from 'react';
-import { Server, Plus, Edit, Trash2 } from 'lucide-react';
+import { Server, Plus, Edit, Trash2, Users, FolderPlus } from 'lucide-react';
 
 interface ServerData {
   id: string;
   name: string;
   ip: string;
+  group: string;
   status: 'online' | 'offline';
+  description?: string;
+  port?: number;
+}
+
+interface Group {
+  id: string;
+  name: string;
+  description?: string;
+  serverCount: number;
 }
 
 const ServerManagement: React.FC = () => {
   const [servers, setServers] = useState<ServerData[]>([]);
+  const [groups, setGroups] = useState<Group[]>([]);
   const [showAddForm, setShowAddForm] = useState(false);
+  const [showAddGroupForm, setShowAddGroupForm] = useState(false);
   const [editingServer, setEditingServer] = useState<ServerData | null>(null);
+  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
   const [newServer, setNewServer] = useState({
     name: '',
     ip: '',
+    group: '',
+    description: '',
+    port: 22,
+  });
+  const [newGroup, setNewGroup] = useState({
+    name: '',
+    description: '',
   });
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
+        setGroups(data);
+      }
+    } catch (error) {
+      console.error('Failed to fetch groups:', error);
+    }
+  };
+
   const handleAddServer = async (e: React.FormEvent) => {
     e.preventDefault();
+    
+    if (!newServer.name.trim() || !newServer.ip.trim() || !newServer.group.trim()) {
+      alert('Please fill in all required fields');
+      return;
+    }
+
+    // Validate IP address format
+    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
+    if (!ipRegex.test(newServer.ip)) {
+      alert('Please enter a valid IP address');
+      return;
+    }
 
     try {
-      const response = await fetch('/api/servers', {
+      const response = await fetch('http://localhost:3001/api/servers', {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
+          'Authorization': `Bearer ${localStorage.getItem('token')}`,
         },
         body: JSON.stringify(newServer),
       });
 
-      if (response.ok) {
-        setNewServer({ name: '', ip: '' });
+      const result = await response.json();
+      
+      if (response.ok && result.success) {
+        setNewServer({ name: '', ip: '', group: '', description: '', port: 22 });
         setShowAddForm(false);
         fetchServers();
+        fetchGroups(); // Refresh groups to update server counts
+        alert('Server added successfully');
       } else {
-        alert('Failed to add server');
+        alert(result.message || 'Failed to add server');
       }
     } catch (error) {
+      console.error('Failed to add server:', error);
       alert('Failed to add server');
     }
   };
 
+  const handleAddGroup = async (e: React.FormEvent) => {
+    e.preventDefault();
+    
+    if (!newGroup.name.trim()) {
+      alert('Please enter a group name');
+      return;
+    }
+
+    try {
+      const response = await fetch('http://localhost:3001/api/groups', {
+        method: 'POST',
+        headers: {
+          'Content-Type': 'application/json',
+          'Authorization': `Bearer ${localStorage.getItem('token')}`,
+        },
+        body: JSON.stringify(newGroup),
+      });
+
+      const result = await response.json();
+      
+      if (response.ok && result.success) {
+        setNewGroup({ name: '', description: '' });
+        setShowAddGroupForm(false);
+        fetchGroups();
+        alert('Group added successfully');
+      } else {
+        alert(result.message || 'Failed to add group');
+      }
+    } catch (error) {
+      console.error('Failed to add group:', error);
+      alert('Failed to add group');
+    }
+  };
+
   const handleEditServer = async (e: React.FormEvent) => {
     e.preventDefault();
     if (!editingServer) return;
 
     try {
-      const response = await fetch(`/api/servers/${editingServer.id}`, {
+      const response = await fetch(`http://localhost:3001/api/servers/${editingServer.id}`, {
         method: 'PUT',
         headers: {
           'Content-Type': 'application/json',
+          'Authorization': `Bearer ${localStorage.getItem('token')}`,
         },
         body: JSON.stringify(editingServer),
       });
 
-      if (response.ok) {
+      const result = await response.json();
+      
+      if (response.ok && result.success) {
         setEditingServer(null);
         fetchServers();
+        fetchGroups();
+        alert('Server updated successfully');
       } else {
-        alert('Failed to update server');
+        alert(result.message || 'Failed to update server');
       }
     } catch (error) {
+      console.error('Failed to update server:', error);
       alert('Failed to update server');
     }
   };
 
   const handleDeleteServer = async (serverId: string) => {
+    if (!confirm('Are you sure you want to delete this server?')) {
+      return;
+    }
+
     try {
-      const response = await fetch(`/api/servers/${serverId}`, {
+      const response = await fetch(`http://localhost:3001/api/servers/${serverId}`, {
         method: 'DELETE',
+        headers: {
+          'Authorization': `Bearer ${localStorage.getItem('token')}`,
+        },
       });
 
       if (response.ok) {
         fetchServers();
+        fetchGroups();
+        alert('Server deleted successfully');
       } else {
         alert('Failed to delete server');
       }
     } catch (error) {
+      console.error('Failed to delete server:', error);
       alert('Failed to delete server');
     }
   };
 
+  const handleDeleteGroup = async (groupId: string) => {
+    const group = groups.find(g => g.id === groupId);
+    if (group && group.serverCount > 0) {
+      alert('Cannot delete group that contains servers. Please move or delete servers first.');
+      return;
+    }
+
+    if (!confirm('Are you sure you want to delete this group?')) {
+      return;
+    }
+
+    try {
+      const response = await fetch(`http://localhost:3001/api/groups/${groupId}`, {
+        method: 'DELETE',
+        headers: {
+          'Authorization': `Bearer ${localStorage.getItem('token')}`,
+        },
+      });
+
+      if (response.ok) {
+        fetchGroups();
+        alert('Group deleted successfully');
+      } else {
+        alert('Failed to delete group');
+      }
+    } catch (error) {
+      console.error('Failed to delete group:', error);
+      alert('Failed to delete group');
+    }
+  };
+
+  const filteredServers = selectedGroup 
+    ? servers.filter(server => server.group === selectedGroup)
+    : servers;
+
   return (
     <div className="space-y-6">
       <div className="flex justify-between items-center">
         <h2 className="text-2xl font-bold text-gray-800">Server Management</h2>
-        <button
-          onClick={() => setShowAddForm(true)}
-          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
-        >
-          <Plus className="w-4 h-4 mr-2" />
-          Add Server
-        </button>
+        <div className="flex space-x-2">
+          <button
+            onClick={() => setShowAddGroupForm(true)}
+            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
+          >
+            <FolderPlus className="w-4 h-4 mr-2" />
+            Add Group
+          </button>
+          <button
+            onClick={() => setShowAddForm(true)}
+            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
+          >
+            <Plus className="w-4 h-4 mr-2" />
+            Add Server
+          </button>
+        </div>
+      </div>
+
+      {/* Groups Management */}
+      <div className="bg-white p-6 rounded-lg shadow-md">
+        <h3 className="text-lg font-semibold mb-4">Server Groups</h3>
+        
+        {/* Group Filter */}
+        <div className="mb-4">
+          <div className="flex flex-wrap gap-2">
+            <button
+              onClick={() => setSelectedGroup('')}
+              className={`px-3 py-1 rounded-full text-sm ${
+                selectedGroup === '' 
+                  ? 'bg-blue-600 text-white' 
+                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
+              }`}
+            >
+              All Groups ({servers.length})
+            </button>
+            {groups.map(group => (
+              <button
+                key={group.id}
+                onClick={() => setSelectedGroup(group.name)}
+                className={`px-3 py-1 rounded-full text-sm ${
+                  selectedGroup === group.name 
+                    ? 'bg-blue-600 text-white' 
+                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
+                }`}
+              >
+                {group.name} ({group.serverCount})
+              </button>
+            ))}
+          </div>
+        </div>
+
+        {/* Groups List */}
+        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
+          {groups.map((group) => (
+            <div key={group.id} className="border border-gray-200 rounded-lg p-4">
+              <div className="flex justify-between items-start mb-2">
+                <div>
+                  <h4 className="font-semibold text-gray-900">{group.name}</h4>
+                  <p className="text-sm text-gray-600">{group.serverCount} servers</p>
+                </div>
+                <div className="flex space-x-1">
+                  <button
+                    onClick={() => setEditingGroup(group)}
+                    className="p-1 text-blue-600 hover:bg-blue-50 rounded"
+                  >
+                    <Edit className="w-4 h-4" />
+                  </button>
+                  <button
+                    onClick={() => handleDeleteGroup(group.id)}
+                    className="p-1 text-red-600 hover:bg-red-50 rounded"
+                  >
+                    <Trash2 className="w-4 h-4" />
+                  </button>
+                </div>
+              </div>
+              {group.description && (
+                <p className="text-sm text-gray-500">{group.description}</p>
+              )}
+            </div>
+          ))}
+        </div>
       </div>
 
+      {/* Add Group Form */}
+      {showAddGroupForm && (
+        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
+          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
+            <h3 className="text-lg font-semibold mb-4">Add New Group</h3>
+            <form onSubmit={handleAddGroup} className="space-y-4">
+              <div>
+                <label className="block text-sm font-medium text-gray-700 mb-1">
+                  Group Name *
+                </label>
+                <input
+                  type="text"
+                  value={newGroup.name}
+                  onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
+                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
+                  placeholder="Enter group name"
+                  required
+                />
+              </div>
+              
+              <div>
+                <label className="block text-sm font-medium text-gray-700 mb-1">
+                  Description
+                </label>
+                <textarea
+                  value={newGroup.description}
+                  onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
+                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
+                  placeholder="Enter group description"
+                  rows={3}
+                />
+              </div>
+              
+              <div className="flex justify-end space-x-2">
+                <button
+                  type="button"
+                  onClick={() => setShowAddGroupForm(false)}
+                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
+                >
+                  Cancel
+                </button>
+                <button
+                  type="submit"
+                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
+                >
+                  Add Group
+                </button>
+              </div>
+            </form>
+          </div>
+        </div>
+      )}
+
       {/* Add Server Form */}
       {showAddForm && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
-          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
+          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg">
             <h3 className="text-lg font-semibold mb-4">Add New Server</h3>
             <form onSubmit={handleAddServer} className="space-y-4">
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">
-                  Server Name
+                  Server Name *
                 </label>
                 <input
                   type="text"
                   value={newServer.name}
                   onChange={(e) => setNewServer({ ...newServer, name: e.target.value })}
                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                   placeholder="Enter server name"
+                  required
                 />
               </div>
               
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">
-                  IP Address
+                  IP Address *
                 </label>
                 <input
                   type="text"
                   value={newServer.ip}
                   onChange={(e) => setNewServer({ ...newServer, ip: e.target.value })}
                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                   placeholder="Enter IP address"
+                  required
+                />
+              </div>
+              
+              <div>
+                <label className="block text-sm font-medium text-gray-700 mb-1">
+                  Group *
+                </label>
+                <select
+                  value={newServer.group}
+                  onChange={(e) => setNewServer({ ...newServer, group: e.target.value })}
+                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
+                  required
+                >
+                  <option value="">Select a group</option>
+                  {groups.map(group => (
+                    <option key={group.id} value={group.name}>{group.name}</option>
+                  ))}
+                </select>
+              </div>
+              
+              <div>
+                <label className="block text-sm font-medium text-gray-700 mb-1">
+                  Port
+                </label>
+                <input
+                  type="number"
+                  value={newServer.port}
+                  onChange={(e) => setNewServer({ ...newServer, port: parseInt(e.target.value) })}
+                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
+                  placeholder="22"
+                  min="1"
+                  max="65535"
+                />
+              </div>
+              
+              <div>
+                <label className="block text-sm font-medium text-gray-700 mb-1">
+                  Description
+                </label>
+                <textarea
+                  value={newServer.description}
+                  onChange={(e) => setNewServer({ ...newServer, description: e.target.value })}
+                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
+                  placeholder="Enter server description"
+                  rows={3}
                 />
               </div>
               
               <div className="flex justify-end space-x-2">
                 <button
                   type="button"
                   onClick={() => setShowAddForm(false)}
                   className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                 >
                   Cancel
                 </button>
                 <button
                   type="submit"
                   className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                 >
                   Add Server
                 </button>
               </div>
             </form>
           </div>
         </div>
       )}
 
       {/* Edit Server Form */}
       {editingServer && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
-          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
+          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg">
             <h3 className="text-lg font-semibold mb-4">Edit Server</h3>
             <form onSubmit={handleEditServer} className="space-y-4">
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">
-                  Server Name
+                  Server Name *
                 </label>
                 <input
                   type="text"
                   value={editingServer.name}
                   onChange={(e) => setEditingServer({ ...editingServer, name: e.target.value })}
                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
+                  required
                 />
               </div>
               
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">
-                  IP Address
+                  IP Address *
                 </label>
                 <input
                   type="text"
                   value={editingServer.ip}
                   onChange={(e) => setEditingServer({ ...editingServer, ip: e.target.value })}
                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
+                  required
+                />
+              </div>
+              
+              <div>
+                <label className="block text-sm font-medium text-gray-700 mb-1">
+                  Group *
+                </label>
+                <select
+                  value={editingServer.group}
+                  onChange={(e) => setEditingServer({ ...editingServer, group: e.target.value })}
+                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
+                  required
+                >
+                  {groups.map(group => (
+                    <option key={group.id} value={group.name}>{group.name}</option>
+                  ))}
+                </select>
+              </div>
+              
+              <div>
+                <label className="block text-sm font-medium text-gray-700 mb-1">
+                  Port
+                </label>
+                <input
+                  type="number"
+                  value={editingServer.port || 22}
+                  onChange={(e) => setEditingServer({ ...editingServer, port: parseInt(e.target.value) })}
+                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
+                  min="1"
+                  max="65535"
+                />
+              </div>
+              
+              <div>
+                <label className="block text-sm font-medium text-gray-700 mb-1">
+                  Description
+                </label>
+                <textarea
+                  value={editingServer.description || ''}
+                  onChange={(e) => setEditingServer({ ...editingServer, description: e.target.value })}
+                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
+                  rows={3}
                 />
               </div>
               
               <div className="flex justify-end space-x-2">
                 <button
                   type="button"
                   onClick={() => setEditingServer(null)}
                   className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                 >
                   Cancel
                 </button>
                 <button
                   type="submit"
                   className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                 >
                   Update Server
                 </button>
               </div>
             </form>
           </div>
         </div>
       )}
 
       {/* Servers List */}
       <div className="bg-white rounded-lg shadow-md overflow-hidden">
-        <table className="w-full">
-          <thead className="bg-gray-50">
-            <tr>
-              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
-                Server
-              </th>
-              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
-                IP Address
-              </th>
-              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
-                Status
-              </th>
-              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
-                Actions
-              </th>
-            </tr>
-          </thead>
-          <tbody className="bg-white divide-y divide-gray-200">
-            {servers.map((server) => (
-              <tr key={server.id}>
-                <td className="px-6 py-4 whitespace-nowrap">
-                  <div className="flex items-center">
-                    <Server className="w-5 h-5 text-gray-400 mr-3" />
-                    <div className="text-sm font-medium text-gray-900">{server.name}</div>
-                  </div>
-                </td>
-                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
-                  {server.ip}
-                </td>
-                <td className="px-6 py-4 whitespace-nowrap">
-                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
-                    server.status === 'online' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
-                  }`}>
-                    {server.status}
-                  </span>
-                </td>
-                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
-                  <button
-                    onClick={() => setEditingServer(server)}
-                    className="text-blue-600 hover:text-blue-900 mr-4"
-                  >
-                    <Edit className="w-4 h-4" />
-                  </button>
-                  <button
-                    onClick={() => handleDeleteServer(server.id)}
-                    className="text-red-600 hover:text-red-900"
-                  >
-                    <Trash2 className="w-4 h-4" />
-                  </button>
-                </td>
-              </tr>
-            ))}
-          </tbody>
-        </table>
+        <div className="px-6 py-4 border-b border-gray-200">
+          <h3 className="text-lg font-semibold">
+            Servers {selectedGroup && `in ${selectedGroup}`} ({filteredServers.length})
+          </h3>
+        </div>
+        
+        {filteredServers.length === 0 ? (
+          <div className="text-center py-8">
+            <Server className="w-12 h-12 text-gray-400 mx-auto mb-4" />
+            <p className="text-gray-600">
+              {selectedGroup ? `No servers in ${selectedGroup} group` : 'No servers configured'}
+            </p>
+          </div>
+        ) : (
+          <div className="overflow-x-auto">
+            <table className="w-full">
+              <thead className="bg-gray-50">
+                <tr>
+                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
+                    Server
+                  </th>
+                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
+                    IP Address
+                  </th>
+                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
+                    Group
+                  </th>
+                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
+                    Status
+                  </th>
+                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
+                    Actions
+                  </th>
+                </tr>
+              </thead>
+              <tbody className="bg-white divide-y divide-gray-200">
+                {filteredServers.map((server) => (
+                  <tr key={server.id} className="hover:bg-gray-50">
+                    <td className="px-6 py-4 whitespace-nowrap">
+                      <div className="flex items-center">
+                        <Server className="w-5 h-5 text-gray-400 mr-3" />
+                        <div>
+                          <div className="text-sm font-medium text-gray-900">{server.name}</div>
+                          {server.description && (
+                            <div className="text-sm text-gray-500">{server.description}</div>
+                          )}
+                        </div>
+                      </div>
+                    </td>
+                    <td className="px-6 py-4 whitespace-nowrap">
+                      <div className="text-sm text-gray-900">{server.ip}</div>
+                      {server.port && server.port !== 22 && (
+                        <div className="text-sm text-gray-500">Port: {server.port}</div>
+                      )}
+                    </td>
+                    <td className="px-6 py-4 whitespace-nowrap">
+                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
+                        <Users className="w-3 h-3 mr-1" />
+                        {server.group}
+                      </span>
+                    </td>
+                    <td className="px-6 py-4 whitespace-nowrap">
+                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
+                        server.status === 'online' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
+                      }`}>
+                        {server.status}
+                      </span>
+                    </td>
+                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
+                      <div className="flex space-x-2">
+                        <button
+                          onClick={() => setEditingServer(server)}
+                          className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded"
+                        >
+                          <Edit className="w-4 h-4" />
+                        </button>
+                        <button
+                          onClick={() => handleDeleteServer(server.id)}
+                          className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded"
+                        >
+                          <Trash2 className="w-4 h-4" />
+                        </button>
+                      </div>
+                    </td>
+                  </tr>
+                ))}
+              </tbody>
+            </table>
+          </div>
+        )}
       </div>
     </div>
   );
 };