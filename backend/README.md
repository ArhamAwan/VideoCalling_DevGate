# Backend Structure

This backend follows a modular, scalable architecture with clear separation of concerns.

## Folder Structure

```
backend/
├── src/
│   ├── config/          # Server and Socket.IO configuration
│   │   ├── server.js    # Express app and HTTP server setup
│   │   ├── socket.io.js # Socket.IO initialization
│   │   └── https-server.js # HTTPS server configuration
│   │
│   ├── services/        # Business logic layer
│   │   ├── roomService.js    # Room management (CRUD operations)
│   │   ├── userService.js    # User management
│   │   └── messageService.js # Chat message handling
│   │
│   ├── handlers/        # Socket event handlers
│   │   ├── socketHandlers.js    # Main socket connection handler
│   │   ├── roomHandlers.js     # Room-related events
│   │   ├── signalingHandlers.js # WebRTC signaling events
│   │   └── chatHandlers.js     # Chat-related events
│   │
│   ├── utils/           # Utility functions
│   │   ├── constants.js # Socket event names and error messages
│   │   └── logger.js    # Logging utility
│   │
│   └── middleware/      # Express middleware (for future use)
│
├── server.js            # HTTP server entry point
├── https-server.js      # HTTPS server entry point
└── package.json
```

## Entry Points

- **`server.js`** - HTTP server (default, port 3000)
- **`https-server.js`** - HTTPS server with self-signed cert (port 3443)

## Running the Server

```bash
# HTTP server
npm start
# or
npm run dev

# HTTPS server
npm run start:https
# or
npm run dev:https
```

## Architecture Overview

### Services Layer
- **RoomService**: Manages room state (create, join, leave, end)
- **UserService**: Manages user names and metadata
- **MessageService**: Handles chat message storage (ready for history feature)

### Handlers Layer
- **socketHandlers.js**: Sets up connection and disconnect handlers
- **roomHandlers.js**: Handles room creation, joining, leaving, and ending
- **signalingHandlers.js**: Handles WebRTC signaling (offer/answer/ICE)
- **chatHandlers.js**: Handles chat messages and mic toggle events

### Configuration
- **server.js**: Express app setup and static file serving
- **socket.io.js**: Socket.IO server initialization with CORS
- **https-server.js**: HTTPS server with self-signed certificates

## Benefits

1. **Separation of Concerns**: Business logic separated from event handling
2. **Scalability**: Easy to add new features without touching core files
3. **Testability**: Services and handlers can be unit tested independently
4. **Maintainability**: Clear structure makes code easy to navigate
5. **Reusability**: Services can be used across different handlers

## Migration Notes

The old `index.js` file has been refactored into this new structure. All functionality remains the same, but the code is now better organized.

