import { roomService } from '../services/roomService.js';
import { userService } from '../services/userService.js';
import { logger } from '../utils/logger.js';
import { SOCKET_EVENTS, ERROR_MESSAGES } from '../utils/constants.js';

export function setupRoomHandlers(io, socket) {
  // Check if room exists
  socket.on(SOCKET_EVENTS.CHECK_ROOM_EXISTS, (roomId, callback) => {
    try {
      const exists = roomService.roomExists(roomId);
      if (typeof callback === 'function') {
        callback({ exists });
      } else {
        socket.emit('room-exists-response', { roomId, exists });
      }
    } catch (error) {
      logger.error(`Error in check-room-exists handler for ${socket.id}:`, error);
      if (typeof callback === 'function') {
        callback({ exists: false });
      }
    }
  });

  // Create room
  socket.on(SOCKET_EVENTS.CREATE_ROOM, (data) => {
    try {
      const roomId = data?.roomId;
      const userName = data?.userName;

      if (!roomId) {
        logger.error(`Invalid create-room data from ${socket.id}:`, data);
        socket.emit(SOCKET_EVENTS.ERROR, { message: ERROR_MESSAGES.INVALID_ROOM_ID });
        return;
      }

      logger.info(`User ${socket.id} creating room: ${roomId} as ${userName}`);

      // Store user name
      userService.setUserName(socket.id, userName);

      // Leave any previous rooms
      const previousRooms = roomService.getUserRooms(socket.id);
      previousRooms.forEach(room => {
        socket.leave(room);
        roomService.leaveRoom(room, socket.id);
      });

      // Create and join the new room
      roomService.createRoom(roomId);
      roomService.joinRoom(roomId, socket.id);
      socket.join(roomId);

      // Send room-users event (empty array since they're alone)
      socket.emit(SOCKET_EVENTS.ROOM_USERS, []);

      // Send confirmation
      socket.emit(SOCKET_EVENTS.ROOM_CREATED, { roomId });

      const roomUsers = roomService.getRoomUsers(roomId);
      logger.info(`Room ${roomId} created with ${roomUsers.length} users`);
    } catch (error) {
      logger.error(`Error in create-room handler for ${socket.id}:`, error);
      socket.emit(SOCKET_EVENTS.ERROR, { message: ERROR_MESSAGES.FAILED_TO_CREATE_ROOM });
    }
  });

  // Join room
  socket.on(SOCKET_EVENTS.JOIN_ROOM, (data) => {
    try {
      // Support both old format (string) and new format (object)
      const roomId = typeof data === 'string' ? data : data?.roomId;
      const userName = typeof data === 'string' ? null : data?.userName;

      if (!roomId) {
        logger.error(`Invalid join-room data from ${socket.id}:`, data);
        socket.emit(SOCKET_EVENTS.ERROR, { message: ERROR_MESSAGES.INVALID_ROOM_ID });
        return;
      }

      logger.info(`User ${socket.id} joining room: ${roomId}${userName ? ` as ${userName}` : ''}`);

      // Validate room exists (for joining, not creating)
      if (!roomService.roomExists(roomId)) {
        socket.emit(SOCKET_EVENTS.ROOM_NOT_FOUND, { roomId });
        return;
      }

      // Store user name
      userService.setUserName(socket.id, userName);

      // Leave any previous rooms
      const previousRooms = roomService.getUserRooms(socket.id);
      previousRooms.forEach(room => {
        socket.leave(room);
        roomService.leaveRoom(room, socket.id);
      });

      // Join the new room
      socket.join(roomId);
      roomService.joinRoom(roomId, socket.id);

      const room = roomService.rooms.get(roomId);
      const userNameToUse = userName || userService.getUserName(socket.id);

      // Notify others in the room
      socket.to(roomId).emit(SOCKET_EVENTS.USER_JOINED, {
        id: socket.id,
        name: userNameToUse,
      });

      // Send current room users with names to the new user
      const otherUsers = roomService.getRoomUsers(roomId)
        .filter((id) => id !== socket.id);
      const usersWithNames = userService.getUserNames(otherUsers);
      socket.emit(SOCKET_EVENTS.ROOM_USERS, usersWithNames);

      logger.info(`Room ${roomId} now has ${room.size} users`);
    } catch (error) {
      logger.error(`Error in join-room handler for ${socket.id}:`, error);
      socket.emit(SOCKET_EVENTS.ERROR, { message: ERROR_MESSAGES.FAILED_TO_JOIN_ROOM });
    }
  });

  // Leave room
  socket.on(SOCKET_EVENTS.LEAVE_ROOM, (roomId) => {
    try {
      if (!roomId) {
        logger.warn(`User ${socket.id} attempted to leave room with no roomId.`);
        return;
      }

      logger.info(`User ${socket.id} leaving room: ${roomId}`);

      const result = roomService.leaveRoom(roomId, socket.id);
      if (result) {
        socket.leave(roomId);

        // Notify others in the room
        socket.to(roomId).emit(SOCKET_EVENTS.USER_LEFT, socket.id);

        if (result.deleted) {
          logger.info(`Room ${roomId} deleted (empty)`);
        } else {
          logger.info(`Room ${roomId} now has ${result.remainingUsers} users`);
        }
      }
    } catch (error) {
      logger.error(`Error in leave-room handler for ${socket.id}:`, error);
    }
  });

  // End call (ends call for everyone)
  socket.on(SOCKET_EVENTS.END_CALL, (roomId) => {
    try {
      if (!roomId) {
        logger.warn(`User ${socket.id} attempted to end call with no roomId.`);
        return;
      }

      logger.info(`User ${socket.id} ending call in room: ${roomId}`);

      const room = roomService.rooms.get(roomId);
      if (room && room.has(socket.id)) {
        // Notify all other users in the room that the call has ended
        socket.to(roomId).emit(SOCKET_EVENTS.CALL_ENDED, {
          roomId,
          endedBy: socket.id,
        });

        // Remove all users from the room
        roomService.endRoom(roomId);
        logger.info(`Room ${roomId} ended and deleted`);
      }
    } catch (error) {
      logger.error('Error in end-call handler:', error);
    }
  });
}

