class RoomService {
  constructor() {
    this.rooms = new Map();
  }

  createRoom(roomId) {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Set());
      return true;
    }
    return false;
  }

  joinRoom(roomId, userId) {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Set());
    }
    this.rooms.get(roomId).add(userId);
    return this.rooms.get(roomId);
  }

  leaveRoom(roomId, userId) {
    const room = this.rooms.get(roomId);
    if (room && room.has(userId)) {
      room.delete(userId);
      if (room.size === 0) {
        this.rooms.delete(roomId);
        return { deleted: true };
      }
      return { deleted: false, remainingUsers: room.size };
    }
    return null;
  }

  getRoomUsers(roomId) {
    const room = this.rooms.get(roomId);
    return room ? Array.from(room) : [];
  }

  roomExists(roomId) {
    return this.rooms.has(roomId);
  }

  endRoom(roomId) {
    if (this.rooms.has(roomId)) {
      this.rooms.delete(roomId);
      return true;
    }
    return false;
  }

  getUserRooms(userId) {
    const userRooms = [];
    this.rooms.forEach((users, roomId) => {
      if (users.has(userId)) {
        userRooms.push(roomId);
      }
    });
    return userRooms;
  }
}

export const roomService = new RoomService();

