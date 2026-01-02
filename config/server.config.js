/**
 * Server Configuration
 * 
 * Configuration settings for the video call application servers
 */

module.exports = {
  // HTTP Server Configuration
  http: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || '0.0.0.0',
  },

  // HTTPS Server Configuration
  https: {
    port: process.env.HTTPS_PORT || 3443,
    host: process.env.HOST || '0.0.0.0',
  },

  // CORS Configuration
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST'],
  },

  // Socket.IO Configuration
  socket: {
    pingTimeout: 60000,
    pingInterval: 25000,
  },

  // STUN/TURN Servers
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    // Add TURN servers here if needed:
    // {
    //   urls: 'turn:your-turn-server.com:3478',
    //   username: 'your-username',
    //   credential: 'your-password',
    // },
  ],
};

