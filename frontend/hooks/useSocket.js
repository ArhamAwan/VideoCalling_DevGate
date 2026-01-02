import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

export function useSocket() {
  const socketRef = useRef(null);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Use Vite proxy for Socket.IO (works with both HTTP and HTTPS)
    const serverUrl = window.location.origin;

    const socketInstance = io(serverUrl, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socketInstance.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error);
    });

    socketRef.current = socketInstance;
    setSocket(socketInstance);

    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, []);

  const joinRoom = (roomId, userName) => {
    if (socketRef.current) {
      socketRef.current.emit('join-room', roomId, userName);
    }
  };

  return {
    socket,
    joinRoom,
  };
}

