class UserService {
  constructor() {
    this.userNames = new Map();
  }

  setUserName(socketId, userName) {
    if (userName) {
      this.userNames.set(socketId, userName);
    }
  }

  getUserName(socketId) {
    return this.userNames.get(socketId) || null;
  }

  removeUser(socketId) {
    this.userNames.delete(socketId);
  }

  getUserNames(userIds) {
    return userIds.map(id => ({
      id,
      name: this.userNames.get(id) || `User ${id.substring(0, 8)}`,
    }));
  }
}

export const userService = new UserService();

