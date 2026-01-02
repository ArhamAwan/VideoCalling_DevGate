# Video Call Application

A real-time WebRTC-based video calling application that enables peer-to-peer video and audio communication between multiple users.

## Features

- 🎥 Multi-user video calls (supports unlimited participants)
- 🔊 Real-time audio and video streaming
- 📹 Camera and microphone controls
- 📱 Responsive design for mobile and desktop
- 🎨 Dynamic video layout that adapts to participant count
- 🔒 Room-based communication

## Tech Stack

- **Frontend**: React 18, Vite, HTML5, CSS3
- **Backend**: Node.js, Express.js
- **Real-time Communication**: Socket.IO (signaling), WebRTC (media)
- **STUN Servers**: Google's public STUN servers

## Project Structure

```
Video Call/
├── backend/              # Backend server files
│   ├── index.js         # HTTP server (port 3000)
│   └── https-server.js  # HTTPS server (port 3443)
├── frontend/            # Frontend application
│   ├── index.html       # Main HTML page
│   ├── main.jsx         # React entry point
│   ├── App.jsx          # Main React component
│   ├── styles.css       # Application styles
│   ├── components/       # React components
│   │   └── VideoCall.jsx
│   └── hooks/           # React hooks
│       ├── useMediaStream.js
│       ├── useSocket.js
│       └── useWebRTC.js
├── docs/                # Documentation
│   └── HOW_IT_WORKS.md  # Detailed technical documentation
├── config/              # Configuration files
├── vite.config.js       # Vite configuration
├── package.json         # Dependencies and scripts
└── README.md           # This file
```

## Quick Start

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Modern web browser with WebRTC support

### Installation

```bash
# Install dependencies
npm install
```

### Development Mode

For development with hot-reload (using Vite):

```bash
# Terminal 1: Start backend server
npm run dev

# Terminal 2: Start Vite dev server (frontend)
npx vite --config vite.config.js
# Or add to package.json: "dev:frontend": "vite --config vite.config.js"
```

The Vite dev server will run on `http://localhost:5173` and proxy Socket.IO requests to the backend.

### Production Build

```bash
# Build React app
npm run build

# Start production server
npm start
```

### Running the Application

**HTTP Server (Port 3000):**
```bash
npm start
```

**HTTPS Server (Port 3443):**
```bash
npm run https
```

**Development Mode (with auto-reload):**
```bash
# HTTP
npm run dev

# HTTPS
npm run https-dev
```

### Accessing the Application

- **HTTP**: Open `http://localhost:3000` in your browser
- **HTTPS**: Open `https://localhost:3443` in your browser (accept self-signed certificate warning)

## Usage

1. Open the application in your browser
2. Allow camera and microphone permissions when prompted
3. Click the "Join Room" button
4. Open the same URL in another browser tab/window (or on another device)
5. Click "Join Room" in the second window
6. Both users should now see each other's video feeds

## How It Works

This application uses a hybrid architecture:

- **Signaling (Socket.IO)**: Used for exchanging WebRTC negotiation messages through the server
- **Media (WebRTC)**: Direct peer-to-peer connection for video/audio streams

For detailed technical documentation, see [docs/HOW_IT_WORKS.md](docs/HOW_IT_WORKS.md).

## Scripts

- `npm start` - Start HTTP server
- `npm run dev` - Start HTTP server with auto-reload (nodemon)
- `npm run https` - Start HTTPS server
- `npm run https-dev` - Start HTTPS server with auto-reload (nodemon)

## Configuration

### Ports

- HTTP Server: `3000` (configurable via `PORT` environment variable)
- HTTPS Server: `3443` (configurable via `PORT` environment variable)

### STUN Servers

Currently using Google's public STUN servers:
- `stun:stun.l.google.com:19302`
- `stun:stun1.l.google.com:19302`

**Note**: No TURN servers are configured. This may cause connection failures in strict NAT environments.

## Browser Compatibility

- Chrome/Edge (recommended)
- Firefox
- Safari (macOS/iOS)
- Opera

## Limitations

- Room ID is currently hardcoded to `"test-room"`
- No user authentication
- No TURN servers (may fail behind strict NATs)
- Self-signed certificates require browser warning acceptance

## Troubleshooting

### Camera/Microphone Not Working
- Check browser permissions
- Ensure HTTPS is used (required for getUserMedia in some browsers)
- Verify camera/mic are not being used by another application

### Users Can't See Each Other
- Check browser console for errors
- Verify Socket.IO connection is established
- Check network connectivity
- Ensure STUN servers are accessible

### Connection Fails Behind NAT
- Add TURN servers to RTCPeerConnection configuration
- Use a TURN service provider (e.g., Twilio, Xirsys)

## Future Enhancements

- Room ID input field
- User names/identities
- Screen sharing
- Chat functionality
- Recording capabilities
- TURN server integration
- User authentication
- Better error handling
- Connection quality indicators

## License

MIT

## Author

DevGate Internship Project

