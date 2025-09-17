@@ .. @@
   const handleAddUser = async (e: React.FormEvent) => {
     e.preventDefault();
     
+    if (!newUser.username.trim() || !newUser.password.trim()) {
+      setMessage('Username and password are required');
+      return;
+    }
+
     try {
-      const response = await fetch('/api/users', {
+      const response = await fetch('http://localhost:3001/api/users', {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
+          'Authorization': `Bearer ${localStorage.getItem('token')}`,
         },
         body: JSON.stringify(newUser),
       });
 
-      if (response.ok) {
+      const data = await response.json();
+      
+      if (response.ok && data.success) {
         setMessage('User added successfully');
         setNewUser({ username: '', password: '', role: 'user' });
         fetchUsers();
       } else {
-        setMessage('Failed to add user');
+        setMessage(data.message || 'Failed to add user');
       }
     } catch (error) {
+      console.error('Error adding user:', error);
       setMessage('Failed to add user');
     }
   };