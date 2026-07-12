import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const SocketProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);
  const [socketNotifications, setSocketNotifications] = useState([]);
  const [activeEmergency, setActiveEmergency] = useState(null);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const socketInstance = io(SOCKET_URL, {
      transports: ['websocket'],
      withCredentials: true,
    });

    socketInstance.on('connect', () => {
      console.log('Real-time Socket Connected:', socketInstance.id);
      // Join room for this household
      socketInstance.emit('join-household', user.id);
    });

    // Listeners for various events
    socketInstance.on('new-notification', (notif) => {
      console.log('Socket notification received:', notif);
      setSocketNotifications((prev) => [notif, ...prev].slice(0, 50));
    });

    socketInstance.on('emergency-triggered', (data) => {
      console.warn('CRITICAL: Emergency Triggered!', data);
      setActiveEmergency(data);
    });

    socketInstance.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.emit('leave-household', user.id);
      socketInstance.disconnect();
    };
  }, [isAuthenticated, user]);

  const clearEmergency = () => {
    setActiveEmergency(null);
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        socketNotifications,
        setSocketNotifications,
        activeEmergency,
        clearEmergency,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
