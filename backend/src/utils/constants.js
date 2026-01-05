export const SOCKET_EVENTS = {
  // Room events
  CHECK_ROOM_EXISTS: 'check-room-exists',
  CREATE_ROOM: 'create-room',
  JOIN_ROOM: 'join-room',
  LEAVE_ROOM: 'leave-room',
  END_CALL: 'end-call',
  ROOM_CREATED: 'room-created',
  ROOM_NOT_FOUND: 'room-not-found',
  ROOM_USERS: 'room-users',
  
  // Signaling events
  SIGNAL: 'signal',
  
  // Chat events
  SEND_MESSAGE: 'send-message',
  RECEIVE_MESSAGE: 'receive-message',
  
  // User events
  USER_JOINED: 'user-joined',
  USER_LEFT: 'user-left',
  CALL_ENDED: 'call-ended',
  
  // Media events
  MIC_TOGGLE: 'mic-toggle',
  
  // Error events
  ERROR: 'error',
};

export const ERROR_MESSAGES = {
  ROOM_NOT_FOUND: 'Room not found',
  FAILED_TO_CREATE_ROOM: 'Failed to create room',
  FAILED_TO_JOIN_ROOM: 'Failed to join room',
  INVALID_ROOM_ID: 'Invalid room ID',
};

