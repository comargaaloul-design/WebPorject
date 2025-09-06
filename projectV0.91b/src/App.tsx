import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ServerManagement from './pages/ServerManagement';
import UserManagement from './pages/UserManagement';
import RestartManager from './pages/RestartManager';
import AuditLogs from './pages/AuditLogs';
import Settings from './pages/Settings';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <AuthProvider>
        <SocketProvider>
          <div className="min-h-screen bg-gray-50">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                <Route index element={<Dashboard />} />
                <Route path="/servers" element={<ServerManagement />} />
                <Route path="/users" element={<UserManagement />} />
                <Route path="/restart" element={<RestartManager />} />
                <Route path="/audit" element={<AuditLogs />} />
                <Route path="/settings" element={<Settings />} />
              </Route>
            </Routes>
          </div>
        </SocketProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;