class MessageService {
  constructor() {

    this.messageHistory = new Map();
  }


  storeMessage(roomId, message) {
    if (!this.messageHistory.has(roomId)) {
      this.messageHistory.set(roomId, []);
    }
    this.messageHistory.get(roomId).push({
      ...message,
      timestamp: Date.now(),
    });
  }

  // Get message history for a room
  getMessageHistory(roomId) {
    return this.messageHistory.get(roomId) || [];
  }

  // Clear message history for a room
  clearHistory(roomId) {
    this.messageHistory.delete(roomId);
  }
}

export const messageService = new MessageService();

