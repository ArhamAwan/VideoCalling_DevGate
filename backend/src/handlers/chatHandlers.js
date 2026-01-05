import { logger } from "../utils/logger.js";
import { SOCKET_EVENTS } from "../utils/constants.js";
import { messageService } from "../services/messageService.js";

export function setupChatHandlers(io, socket) {
  // Chat messages
  socket.on(SOCKET_EVENTS.SEND_MESSAGE, (data) => {
    try {
      const { roomId, message, time, author } = data;

      // Store message for history (optional)
      messageService.storeMessage(roomId, { text: message, author, time });

      // Broadcast to others in the room
      socket.to(roomId).emit(SOCKET_EVENTS.RECEIVE_MESSAGE, {
        text: message,
        author: author,
        time: time,
        from: socket.id,
      });
    } catch (error) {
      logger.error("Error sending message:", error);
    }
  });

  // Mic toggle events
  socket.on(SOCKET_EVENTS.MIC_TOGGLE, (data) => {
    try {
      const { roomId, userId, isMuted } = data || {};
      if (roomId) {
        socket.to(roomId).emit(SOCKET_EVENTS.MIC_TOGGLE, { userId, isMuted });
      } else {
        // Fallback: broadcast to all other rooms the socket is in
        Array.from(socket.rooms).forEach((room) => {
          if (room !== socket.id) {
            socket.to(room).emit(SOCKET_EVENTS.MIC_TOGGLE, { userId, isMuted });
          }
        });
      }
    } catch (error) {
      logger.error(`Error handling mic-toggle from ${socket.id}:`, error);
    }
  });
}
