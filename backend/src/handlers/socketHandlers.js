import { setupRoomHandlers } from './roomHandlers.js';
import { setupSignalingHandlers } from './signalingHandlers.js';
import { setupChatHandlers } from './chatHandlers.js';
import { roomService } from '../services/roomService.js';
import { userService } from '../services/userService.js';
import { logger } from '../utils/logger.js';
import { SOCKET_EVENTS } from '../utils/constants.js';

export function setupSocketHandlers(io) {
  io.on('connection', (socket) => {
    logger.info('User connected:', socket.id);

    // Setup all event handlers
    setupRoomHandlers(io, socket);
    setupSignalingHandlers(io, socket);
    setupChatHandlers(io, socket);

    // Handle disconnect
    socket.on('disconnect', () => {
      try {
        logger.info('User disconnected:', socket.id);

        // Remove user name
        userService.removeUser(socket.id);

        // Remove user from all rooms
        const userRooms = roomService.getUserRooms(socket.id);
        userRooms.forEach((roomId) => {
          const result = roomService.leaveRoom(roomId, socket.id);

          // Notify others in the room
          socket.to(roomId).emit(SOCKET_EVENTS.USER_LEFT, socket.id);

          // Clean up empty rooms
          if (result && result.deleted) {
            logger.info(`Room ${roomId} deleted (empty)`);
          } else if (result) {
            logger.info(`Room ${roomId} now has ${result.remainingUsers} users`);
          }
        });
      } catch (error) {
        logger.error(`Error in disconnect handler for ${socket.id}:`, error);
      }
    });
  });
}

