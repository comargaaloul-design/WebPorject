@@ .. @@
 import React, { useState, useEffect } from 'react';
-import { FileText, Search, Filter } from 'lucide-react';
+import { FileText, Search, Filter, Download, RefreshCw, User, Server, Clock } from 'lucide-react';
 
 interface LogEntry {
   id: string;
-  timestamp: string;
+  timestamp: string; // ISO string
   action: string;
-  server: string;
+  serverIds: string[];
+  serverNames: string[];
   user: string;
   status: 'success' | 'failed' | 'pending';
+  details?: string;
+  duration?: number; // in milliseconds
 }
 
 const LogViewer: React.FC = () => {
   const [logs, setLogs] = useState<LogEntry[]>([]);
   const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
   const [searchTerm, setSearchTerm] = useState('');
   const [filterAction, setFilterAction] = useState('');
   const [filterStatus, setFilterStatus] = useState('');
+  const [filterUser, setFilterUser] = useState('');
+  const [dateRange, setDateRange] = useState({
+    start: '',
+    end: ''
+  });
+  const [isLoading, setIsLoading] = useState(false);
 
   useEffect(() => {
     fetchLogs();
+    const interval = setInterval(fetchLogs, 30000); // Refresh every 30 seconds
+    return () => clearInterval(interval);
   }, []);
 
   useEffect(() => {
@@ -1,6 +1,6 @@
   }, [logs, searchTerm, filterAction, filterStatus]);
 
   const fetchLogs = async () => {
+    setIsLoading(true);
     try {
-      const response = await fetch('/api/logs');
-      const data = await response.json();
-      setLogs(data);
+      const response = await fetch('http://localhost:3001/api/logs', {
+        headers: {
+          'Authorization': `Bearer ${localStorage.getItem('token')}`,
+        },
+      });
+      
+      if (response.ok) {
+        const data = await response.json();
+        setLogs(data.sort((a: LogEntry, b: LogEntry) => 
+          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
+        ));
+      }
     } catch (error) {
       console.error('Failed to fetch logs:', error);
+    } finally {
+      setIsLoading(false);
     }
   };
 
   const filterLogs = () => {
     let filtered = logs;
 
+    // Search filter
     if (searchTerm) {
       filtered = filtered.filter(log =>
-        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
-        log.server.toLowerCase().includes(searchTerm.toLowerCase()) ||
-        log.user.toLowerCase().includes(searchTerm.toLowerCase())
+        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
+        log.serverNames.some(name => name.toLowerCase().includes(searchTerm.toLowerCase())) ||
+        log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
+        (log.details && log.details.toLowerCase().includes(searchTerm.toLowerCase()))
       );
     }
 
+    // Action filter
     if (filterAction) {
       filtered = filtered.filter(log => log.action === filterAction);
     }
 
+    // Status filter
     if (filterStatus) {
       filtered = filtered.filter(log => log.status === filterStatus);
     }
 
+    // User filter
+    if (filterUser) {
+      filtered = filtered.filter(log => log.user === filterUser);
+    }
+
+    // Date range filter
+    if (dateRange.start) {
+      filtered = filtered.filter(log => 
+        new Date(log.timestamp) >= new Date(dateRange.start)
+      );
+    }
+    
+    if (dateRange.end) {
+      filtered = filtered.filter(log => 
+        new Date(log.timestamp) <= new Date(dateRange.end + 'T23:59:59')
+      );
+    }
+
     setFilteredLogs(filtered);
   };
 
+  const exportLogs = () => {
+    const csvContent = [
+      ['Timestamp', 'Action', 'Servers', 'User', 'Status', 'Duration (ms)', 'Details'].join(','),
+      ...filteredLogs.map(log => [
+        log.timestamp,
+        log.action,
+        log.serverNames.join(';'),
+        log.user,
+        log.status,
+        log.duration || '',
+        log.details || ''
+      ].join(','))
+    ].join('\n');
+
+    const blob = new Blob([csvContent], { type: 'text/csv' });
+    const url = window.URL.createObjectURL(blob);
+    const a = document.createElement('a');
+    a.href = url;
+    a.download = `server-logs-${new Date().toISOString().split('T')[0]}.csv`;
+    a.click();
+    window.URL.revokeObjectURL(url);
+  };
+
+  const formatTimestamp = (timestamp: string) => {
+    return new Date(timestamp).toLocaleString('en-US', {
+      year: 'numeric',
+      month: '2-digit',
+      day: '2-digit',
+      hour: '2-digit',
+      minute: '2-digit',
+      second: '2-digit',
+      hour12: false
+    });
+  };
+
+  const getStatusColor = (status: string) => {
+    switch (status) {
+      case 'success': return 'text-green-600 bg-green-100';
+      case 'failed': return 'text-red-600 bg-red-100';
+      case 'pending': return 'text-yellow-600 bg-yellow-100';
+      default: return 'text-gray-600 bg-gray-100';
+    }
+  };
+
+  const uniqueActions = [...new Set(logs.map(log => log.action))];
+  const uniqueUsers = [...new Set(logs.map(log => log.user))];
+
   return (
     <div className="space-y-6">
-      <h2 className="text-2xl font-bold text-gray-800">System Logs</h2>
+      <div className="flex justify-between items-center">
+        <h2 className="text-2xl font-bold text-gray-800">System Logs</h2>
+        <div className="flex space-x-2">
+          <button
+            onClick={fetchLogs}
+            disabled={isLoading}
+            className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
+          >
+            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
+            Refresh
+          </button>
+          <button
+            onClick={exportLogs}
+            className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
+          >
+            <Download className="w-4 h-4 mr-2" />
+            Export CSV
+          </button>
+        </div>
+      </div>
       
       {/* Filters */}
       <div className="bg-white p-6 rounded-lg shadow-md">
         <h3 className="text-lg font-semibold mb-4">Filters</h3>
-        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
+        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
           <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">
               Search
             </label>
             <div className="relative">
               <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
               <input
                 type="text"
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
-                placeholder="Search logs..."
+                placeholder="Search in logs..."
               />
             </div>
           </div>
           
           <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">
               Action
             </label>
             <select
               value={filterAction}
               onChange={(e) => setFilterAction(e.target.value)}
               className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
             >
               <option value="">All Actions</option>
-              <option value="restart">Restart</option>
-              <option value="shutdown">Shutdown</option>
-              <option value="start">Start</option>
-              <option value="stop">Stop</option>
+              {uniqueActions.map(action => (
+                <option key={action} value={action}>{action}</option>
+              ))}
             </select>
           </div>
           
           <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">
               Status
             </label>
             <select
               value={filterStatus}
               onChange={(e) => setFilterStatus(e.target.value)}
               className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
             >
               <option value="">All Status</option>
               <option value="success">Success</option>
               <option value="failed">Failed</option>
               <option value="pending">Pending</option>
             </select>
           </div>
+          
+          <div>
+            <label className="block text-sm font-medium text-gray-700 mb-1">
+              User
+            </label>
+            <select
+              value={filterUser}
+              onChange={(e) => setFilterUser(e.target.value)}
+              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
+            >
+              <option value="">All Users</option>
+              {uniqueUsers.map(user => (
+                <option key={user} value={user}>{user}</option>
+              ))}
+            </select>
+          </div>
+          
+          <div>
+            <label className="block text-sm font-medium text-gray-700 mb-1">
+              Start Date
+            </label>
+            <input
+              type="date"
+              value={dateRange.start}
+              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
+              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
+            />
+          </div>
+          
+          <div>
+            <label className="block text-sm font-medium text-gray-700 mb-1">
+              End Date
+            </label>
+            <input
+              type="date"
+              value={dateRange.end}
+              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
+              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
+            />
+          </div>
+        </div>
+        
+        <div className="mt-4 flex justify-between items-center">
+          <p className="text-sm text-gray-600">
+            Showing {filteredLogs.length} of {logs.length} log entries
+          </p>
+          <button
+            onClick={() => {
+              setSearchTerm('');
+              setFilterAction('');
+              setFilterStatus('');
+              setFilterUser('');
+              setDateRange({ start: '', end: '' });
+            }}
+            className="text-sm text-blue-600 hover:text-blue-800"
+          >
+            Clear all filters
+          </button>
         </div>
       </div>
 
       {/* Log Entries */}
       <div className="bg-white rounded-lg shadow-md">
-        <div className="overflow-x-auto">
-          <table className="w-full">
-            <thead className="bg-gray-50">
-              <tr>
-                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
-                  Timestamp
-                </th>
-                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
-                  Action
-                </th>
-                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
-                  Server
-                </th>
-                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
-                  User
-                </th>
-                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
-                  Status
-                </th>
-              </tr>
-            </thead>
-            <tbody className="bg-white divide-y divide-gray-200">
-              {filteredLogs.map((log) => (
-                <tr key={log.id}>
-                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
-                    {new Date(log.timestamp).toLocaleString()}
-                  </td>
-                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
-                    {log.action}
-                  </td>
-                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
-                    {log.server}
-                  </td>
-                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
-                    {log.user}
-                  </td>
-                  <td className="px-6 py-4 whitespace-nowrap">
-                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
-                      log.status === 'success' ? 'bg-green-100 text-green-800' :
-                      log.status === 'failed' ? 'bg-red-100 text-red-800' :
-                      'bg-yellow-100 text-yellow-800'
-                    }`}>
-                      {log.status}
-                    </span>
-                  </td>
-                </tr>
-              ))}
-            </tbody>
-          </table>
+        {filteredLogs.length === 0 ? (
+          <div className="text-center py-8">
+            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
+            <p className="text-gray-600">
+              {logs.length === 0 ? 'No log entries found' : 'No entries match your filters'}
+            </p>
+          </div>
+        ) : (
+          <div className="divide-y divide-gray-200">
+            {filteredLogs.map((log) => (
+              <div key={log.id} className="p-6 hover:bg-gray-50">
+                <div className="flex items-start justify-between mb-3">
+                  <div className="flex items-center space-x-3">
+                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(log.status)}`}>
+                      {log.status}
+                    </div>
+                    <h4 className="font-semibold text-gray-900 capitalize">{log.action}</h4>
+                  </div>
+                  <div className="flex items-center text-sm text-gray-500">
+                    <Clock className="w-4 h-4 mr-1" />
+                    {formatTimestamp(log.timestamp)}
+                  </div>
+                </div>
+                
+                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
+                  <div className="flex items-center">
+                    <User className="w-4 h-4 mr-2 text-gray-400" />
+                    <span className="text-gray-600">User: </span>
+                    <span className="font-medium ml-1">{log.user}</span>
+                  </div>
+                  
+                  <div className="flex items-center">
+                    <Server className="w-4 h-4 mr-2 text-gray-400" />
+                    <span className="text-gray-600">Servers: </span>
+                    <span className="font-medium ml-1">
+                      {log.serverNames.length > 2 
+                        ? `${log.serverNames.slice(0, 2).join(', ')} +${log.serverNames.length - 2} more`
+                        : log.serverNames.join(', ')
+                      }
+                    </span>
+                  </div>
+                  
+                  {log.duration && (
+                    <div className="flex items-center">
+                      <Clock className="w-4 h-4 mr-2 text-gray-400" />
+                      <span className="text-gray-600">Duration: </span>
+                      <span className="font-medium ml-1">{log.duration}ms</span>
+                    </div>
+                  )}
+                </div>
+                
+                {log.details && (
+                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
+                    <p className="text-sm text-gray-700">{log.details}</p>
+                  </div>
+                )}
+                
+                {log.serverNames.length > 2 && (
+                  <div className="mt-3">
+                    <details className="text-sm">
+                      <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
+                        View all servers ({log.serverNames.length})
+                      </summary>
+                      <div className="mt-2 flex flex-wrap gap-1">
+                        {log.serverNames.map((name, index) => (
+                          <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
+                            {name}
+                          </span>
+                        ))}
+                      </div>
+                    </details>
+                  </div>
+                )}
+              </div>
+            ))}
+          </div>
+        )}
+      </div>
+    </div>
+  );
+};
+
+export default LogViewer;