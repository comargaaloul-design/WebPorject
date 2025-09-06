import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface ServerStatus {
  hostname: string;
  ip: string;
  port: number;
  pingStatus: 'online' | 'offline' | 'checking';
  telnetStatus: 'online' | 'offline' | 'checking';
  lastCheck: string;
}

interface SocketContextType {
  socket: Socket | null;
  serverStatuses: ServerStatus[];
  connected: boolean;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [serverStatuses, setServerStatuses] = useState<ServerStatus[]>([]);
  const [connected, setConnected] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000');
      
      newSocket.on('connect', () => {
        setConnected(true);
      });

      newSocket.on('disconnect', () => {
        setConnected(false);
      });

      newSocket.on('serverStatus', (statuses: ServerStatus[]) => {
        setServerStatuses(statuses);
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, serverStatuses, connected }}>
      {children}
    </SocketContext.Provider>
  );
};