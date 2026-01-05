// Message service for handling chat messages
// Currently messages are just passed through, but this can be extended
// to store message history, implement rate limiting, etc.

class MessageService {
  constructor() {
    // Future: Could store message history here
    this.messageHistory = new Map(); // roomId -> Array<messages>
  }

  // Store message (for future history feature)
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

