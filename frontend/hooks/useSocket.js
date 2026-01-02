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

  const checkRoomExists = (roomId) => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current) {
        reject(new Error('Socket not connected'));
        return;
      }

      socketRef.current.emit('check-room-exists', roomId, (response) => {
        if (response && response.exists) {
          resolve(true);
        } else {
          resolve(false);
        }
      });

      // Also listen for room-not-found event as fallback
      const timeout = setTimeout(() => {
        socketRef.current.off('room-not-found', handleRoomNotFound);
        reject(new Error('Timeout waiting for room check'));
      }, 5000);

      const handleRoomNotFound = () => {
        clearTimeout(timeout);
        socketRef.current.off('room-not-found', handleRoomNotFound);
        resolve(false);
      };

      socketRef.current.once('room-not-found', handleRoomNotFound);
    });
  };

  const joinRoom = (roomId, userName = null) => {
    if (socketRef.current) {
      if (userName) {
        socketRef.current.emit('join-room', { roomId, userName });
      } else {
        // Support old format for backward compatibility
        socketRef.current.emit('join-room', roomId);
      }
    }
  };

  const createRoom = (roomId, userName) => {
    if (socketRef.current) {
      socketRef.current.emit('create-room', { roomId, userName });
    }
  };

  return {
    socket,
    joinRoom,
    createRoom,
    checkRoomExists,
  };
}

