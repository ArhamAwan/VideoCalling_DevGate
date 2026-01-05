import { Server } from 'socket.io';
import { setupSocketHandlers } from '../handlers/socketHandlers.js';

export function initializeSocketIO(server) {
  const io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST'],
    },
  });

  setupSocketHandlers(io);
  return io;
}

