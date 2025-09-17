@@ .. @@
 import React, { useState, useEffect } from 'react';
-import { Calendar, Clock, Plus, Trash2 } from 'lucide-react';
+import { Calendar, Clock, Plus, Trash2, Edit } from 'lucide-react';
 
 interface ScheduledTask {
   id: string;
   name: string;
   action: string;
   serverIds: string[];
-  scheduledTime: string;
+  scheduledTime: string; // ISO string
+  timezone: string;
   status: 'pending' | 'completed' | 'failed';
+  createdBy: string;
+  createdAt: string;
 }
 
 interface Server {
   id: string;
   name: string;
+  group: string;
 }
 
 const ScheduleManagement: React.FC = () => {
   const [tasks, setTasks] = useState<ScheduledTask[]>([]);
   const [servers, setServers] = useState<Server[]>([]);
   const [newTask, setNewTask] = useState({
     name: '',
     action: 'restart',
     serverIds: [] as string[],
-    scheduledTime: '',
+    scheduledDate: '',
+    scheduledTime: '',
   });
+  const [userTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
 
   useEffect(() => {
     fetchTasks();
@@ -1,6 +1,6 @@
 
   const fetchTasks = async () => {
     try {
-      const response = await fetch('/api/schedule');
-      const data = await response.json();
-      setTasks(data);
+      const response = await fetch('http://localhost:3001/api/schedule', {
+        headers: {
+          'Authorization': `Bearer ${localStorage.getItem('token')}`,
+        },
+      });
+      
+      if (response.ok) {
+        const data = await response.json();
+        setTasks(data);
+      }
     } catch (error) {
       console.error('Failed to fetch tasks:', error);
     }
@@ -1,6 +1,6 @@
 
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
@@ -1,6 +1,6 @@
 
   const handleAddTask = async (e: React.FormEvent) => {
     e.preventDefault();
+    
+    if (!newTask.name.trim() || !newTask.scheduledDate || !newTask.scheduledTime || newTask.serverIds.length === 0) {
+      alert('Please fill in all required fields');
+      return;
+    }
+
+    // Combine date and time, ensuring correct timezone handling
+    const scheduledDateTime = new Date(`${newTask.scheduledDate}T${newTask.scheduledTime}`);
+    
+    // Validate that the scheduled time is in the future
+    if (scheduledDateTime <= new Date()) {
+      alert('Scheduled time must be in the future');
+      return;
+    }
 
     try {
-      const response = await fetch('/api/schedule', {
+      const response = await fetch('http://localhost:3001/api/schedule', {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
+          'Authorization': `Bearer ${localStorage.getItem('token')}`,
         },
         body: JSON.stringify({
           ...newTask,
+          scheduledTime: scheduledDateTime.toISOString(),
+          timezone: userTimezone,
+          createdBy: localStorage.getItem('username') || 'Unknown',
         }),
       });
 
-      if (response.ok) {
-        setNewTask({ name: '', action: 'restart', serverIds: [], scheduledTime: '' });
+      const result = await response.json();
+      
+      if (response.ok && result.success) {
+        setNewTask({ 
+          name: '', 
+          action: 'restart', 
+          serverIds: [], 
+          scheduledDate: '',
+          scheduledTime: '' 
+        });
         fetchTasks();
+        alert('Task scheduled successfully');
       } else {
-        alert('Failed to add task');
+        alert(result.message || 'Failed to add task');
       }
     } catch (error) {
+      console.error('Failed to add task:', error);
       alert('Failed to add task');
     }
   };
 
   const handleDeleteTask = async (taskId: string) => {
+    if (!confirm('Are you sure you want to delete this task?')) {
+      return;
+    }
+
     try {
-      const response = await fetch(`/api/schedule/${taskId}`, {
+      const response = await fetch(`http://localhost:3001/api/schedule/${taskId}`, {
         method: 'DELETE',
+        headers: {
+          'Authorization': `Bearer ${localStorage.getItem('token')}`,
+        },
       });
 
       if (response.ok) {
         fetchTasks();
+        alert('Task deleted successfully');
       } else {
         alert('Failed to delete task');
       }
     } catch (error) {
+      console.error('Failed to delete task:', error);
       alert('Failed to delete task');
     }
   };
 
+  const formatScheduledTime = (scheduledTime: string, timezone: string) => {
+    const date = new Date(scheduledTime);
+    return date.toLocaleString('en-US', {
+      timeZone: timezone,
+      year: 'numeric',
+      month: '2-digit',
+      day: '2-digit',
+      hour: '2-digit',
+      minute: '2-digit',
+      hour12: false
+    });
+  };
+
+  const getStatusColor = (status: string) => {
+    switch (status) {
+      case 'pending': return 'text-yellow-600 bg-yellow-100';
+      case 'completed': return 'text-green-600 bg-green-100';
+      case 'failed': return 'text-red-600 bg-red-100';
+      default: return 'text-gray-600 bg-gray-100';
+    }
+  };
+
+  // Get current date and time for min values
+  const now = new Date();
+  const currentDate = now.toISOString().split('T')[0];
+  const currentTime = now.toTimeString().slice(0, 5);
+
   return (
     <div className="space-y-6">
       <h2 className="text-2xl font-bold text-gray-800">Schedule Management</h2>
       
       {/* Add New Task */}
       <div className="bg-white p-6 rounded-lg shadow-md">
         <h3 className="text-lg font-semibold mb-4">Schedule New Task</h3>
         <form onSubmit={handleAddTask} className="space-y-4">
           <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">
               Task Name
             </label>
             <input
               type="text"
               value={newTask.name}
               onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
               className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
               placeholder="Enter task name"
+              required
             />
           </div>
           
           <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">
               Action
             </label>
             <select
               value={newTask.action}
               onChange={(e) => setNewTask({ ...newTask, action: e.target.value })}
               className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
             >
               <option value="restart">Restart</option>
               <option value="shutdown">Shutdown</option>
               <option value="start">Start</option>
               <option value="stop">Stop</option>
             </select>
           </div>
           
           <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">
               Select Servers
             </label>
             <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-3">
               {servers.map((server) => (
                 <label key={server.id} className="flex items-center space-x-2 mb-2">
                   <input
                     type="checkbox"
                     checked={newTask.serverIds.includes(server.id)}
                     onChange={(e) => {
                       if (e.target.checked) {
                         setNewTask({
                           ...newTask,
                           serverIds: [...newTask.serverIds, server.id]
                         });
                       } else {
                         setNewTask({
                           ...newTask,
                           serverIds: newTask.serverIds.filter(id => id !== server.id)
                         });
                       }
                     }}
                     className="w-4 h-4 text-blue-600"
                   />
                   <span className="text-sm">{server.name} ({server.group})</span>
                 </label>
               ))}
             </div>
+            {newTask.serverIds.length > 0 && (
+              <p className="text-sm text-blue-600 mt-1">
+                {newTask.serverIds.length} server(s) selected
+              </p>
+            )}
           </div>
           
-          <div>
+          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
+            <div>
+              <label className="block text-sm font-medium text-gray-700 mb-1">
+                Scheduled Date
+              </label>
+              <input
+                type="date"
+                value={newTask.scheduledDate}
+                onChange={(e) => setNewTask({ ...newTask, scheduledDate: e.target.value })}
+                min={currentDate}
+                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
+                required
+              />
+            </div>
+            
+            <div>
+              <label className="block text-sm font-medium text-gray-700 mb-1">
+                Scheduled Time
+              </label>
+              <input
+                type="time"
+                value={newTask.scheduledTime}
+                onChange={(e) => setNewTask({ ...newTask, scheduledTime: e.target.value })}
+                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
+                required
+              />
+            </div>
+          </div>
+          
+          <div className="text-sm text-gray-600">
+            <p>Timezone: {userTimezone}</p>
+            {newTask.scheduledDate && newTask.scheduledTime && (
+              <p>
+                Scheduled for: {new Date(`${newTask.scheduledDate}T${newTask.scheduledTime}`).toLocaleString()}
+              </p>
+            )}
+          </div>
+          
+          <button
+            type="submit"
+            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
+          >
+            <Plus className="w-4 h-4 mr-2" />
+            Schedule Task
+          </button>
+        </form>
+      </div>
+
+      {/* Scheduled Tasks */}
+      <div className="bg-white p-6 rounded-lg shadow-md">
+        <h3 className="text-lg font-semibold mb-4">Scheduled Tasks</h3>
+        
+        {tasks.length === 0 ? (
+          <p className="text-gray-600 text-center py-4">No scheduled tasks</p>
+        ) : (
+          <div className="space-y-4">
+            {tasks.map((task) => (
+              <div key={task.id} className="border border-gray-200 rounded-lg p-4">
+                <div className="flex justify-between items-start mb-3">
+                  <div>
+                    <h4 className="font-semibold text-lg">{task.name}</h4>
+                    <p className="text-sm text-gray-600">Action: {task.action}</p>
+                    <p className="text-sm text-gray-600">
+                      Created by: {task.createdBy} on {new Date(task.createdAt).toLocaleDateString()}
+                    </p>
+                  </div>
+                  <div className="flex items-center space-x-2">
+                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
+                      {task.status}
+                    </span>
+                    <button
+                      onClick={() => handleDeleteTask(task.id)}
+                      className="p-1 text-red-600 hover:bg-red-50 rounded"
+                    >
+                      <Trash2 className="w-4 h-4" />
+                    </button>
+                  </div>
+                </div>
+                
+                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
+                  <div>
+                    <p className="font-medium text-gray-700 mb-1">Scheduled Time:</p>
+                    <p className="flex items-center text-gray-600">
+                      <Clock className="w-4 h-4 mr-1" />
+                      {formatScheduledTime(task.scheduledTime, task.timezone)}
+                    </p>
+                  </div>
+                  
+                  <div>
+                    <p className="font-medium text-gray-700 mb-1">Target Servers:</p>
+                    <div className="flex flex-wrap gap-1">
+                      {task.serverIds.map(serverId => {
+                        const server = servers.find(s => s.id === serverId);
+                        return server ? (
+                          <span key={serverId} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
+                            {server.name}
+                          </span>
+                        ) : null;
+                      })}
+                    </div>
+                  </div>
+                </div>
+              </div>
+            ))}
+          </div>
+        )}
+      </div>
+    </div>
+  );
+};
+
+export default ScheduleManagement;