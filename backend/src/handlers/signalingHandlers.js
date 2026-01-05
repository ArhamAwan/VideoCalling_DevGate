import { logger } from '../utils/logger.js';
import { SOCKET_EVENTS } from '../utils/constants.js';

export function setupSignalingHandlers(io, socket) {
  socket.on(SOCKET_EVENTS.SIGNAL, (data) => {
    try {
      if (data?.to) {
        // Send to specific user
        socket.to(data.to).emit(SOCKET_EVENTS.SIGNAL, {
          ...data,
          from: socket.id,
        });
      } else {
        // Broadcast to all rooms the socket is in
        Array.from(socket.rooms).forEach((room) => {
          if (room !== socket.id) {
            socket.to(room).emit(SOCKET_EVENTS.SIGNAL, {
              ...data,
              from: socket.id,
            });
          }
        });
      }
    } catch (error) {
      logger.error(`Error in signal handler for ${socket.id}:`, error);
    }
  });
}

