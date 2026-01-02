# How the Video Call Application Works

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Application Flow](#application-flow)
4. [Technical Components](#technical-components)
5. [WebRTC Connection Process](#webrtc-connection-process)
6. [Signaling Flow](#signaling-flow)
7. [File Structure](#file-structure)
8. [Setup & Usage](#setup--usage)

---

## Overview

This is a **WebRTC-based video calling application** that enables real-time peer-to-peer video and audio communication between multiple users in the same room. The application uses:

- **WebRTC** for direct peer-to-peer media streaming
- **Socket.IO** for signaling (connection negotiation)
- **Express.js** as the backend server
- **Vanilla JavaScript** (ES6 modules) for the frontend

### Key Features
- Multi-user video calls (supports unlimited participants)
- Real-time audio and video streaming
- Camera and microphone controls
- Dynamic video layout that adapts to participant count
- Room-based communication
- Responsive design

---

## Architecture

The application follows a **hybrid architecture**:

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Browser   │◄──────►│   Server    │◄──────►│   Browser   │
│  (Frontend) │         │  (Backend)  │         │  (Frontend) │
└──────┬──────┘         └─────────────┘         └──────┬──────┘
       │                                                │
       │                                                │
       └────────────────────────────────────────────────┘
                    Direct WebRTC Connection
                    (Video/Audio Streams)
```

### Two Types of Connections:

1. **Signaling Connection (Socket.IO)**
   - Used for exchanging WebRTC negotiation messages
   - Goes through the server
   - Handles: offers, answers, ICE candidates, user presence

2. **Media Connection (WebRTC)**
   - Direct peer-to-peer connection
   - Bypasses the server
   - Carries actual video and audio streams

---

## Application Flow

### 1. Initialization (Page Load)

When a user opens the application:

```
1. HTML loads (index.html)
2. app.js initializes
3. media.js requests camera/microphone access
4. Local video stream is captured and displayed
5. UI controls are set up (camera/mic toggle buttons)
6. Socket.IO connection is established
```

**Files Involved:**
- `index.html` → Loads the page structure
- `app.js` → Orchestrates initialization
- `media.js` → Handles `getUserMedia()` API
- `ui.js` → Sets up button event handlers
- `socket.js` → Establishes Socket.IO connection

### 2. Joining a Room

When the user clicks "Join Room":

```
1. User clicks "Join Room" button
2. app.js calls joinRoom("test-room")
3. socket.js emits "join-room" event to server
4. Backend adds user to room and tracks them
5. Backend notifies other users: "user-joined" event
6. Backend sends existing users list: "room-users" event
7. Frontend receives events and creates peer connections
```

**Backend Process:**
- Maintains a `Map<roomId, Set<socketId>>` to track users per room
- Emits `"user-joined"` to notify existing users
- Emits `"room-users"` to send the new user a list of existing participants

### 3. WebRTC Connection Establishment

For each user in the room, a peer connection is created:

```
1. webrtc.js creates RTCPeerConnection
2. Adds local video/audio tracks to peer
3. Sets up event handlers:
   - ontrack: Receives remote streams
   - onicecandidate: Discovers network info
4. Creates WebRTC offer (if initiating)
5. Sends offer via Socket.IO "signal" event
6. Other user receives offer, creates answer
7. Answer is sent back via Socket.IO
8. Both users exchange ICE candidates
9. Direct peer-to-peer connection established
```

### 4. Video Display

When a remote stream is received:

```
1. Peer connection receives track (ontrack event)
2. webrtc.js creates new <video> element
3. Sets srcObject to remote stream
4. Appends to video container
5. updateVideoLayout() adjusts grid layout based on count
```

### 5. User Disconnection

When a user leaves:

```
1. Socket.IO detects disconnect
2. Backend removes user from room
3. Backend emits "user-left" to remaining users
4. Frontend closes peer connection
5. Frontend removes video element
6. Layout updates automatically
```

---

## Technical Components

### Backend (`backend/index.js` or `backend/https-server.js`)

**Responsibilities:**
- Serve static frontend files
- Handle Socket.IO connections
- Manage room membership
- Relay WebRTC signaling messages

**Key Data Structures:**
```javascript
const rooms = new Map(); // Map<roomId, Set<socketId>>
```

**Socket Events Handled:**
- `connection` - New user connects
- `join-room` - User joins a room
- `signal` - WebRTC signaling messages (offers, answers, ICE candidates)
- `disconnect` - User leaves

**Server Options:**
- **HTTP Server** (`index.js`): Runs on port 3000
- **HTTPS Server** (`https-server.js`): Runs on port 3443, uses self-signed certificates

### Frontend Modules

#### 1. `app.js` - Main Orchestrator
- Initializes the application
- Coordinates all modules
- Handles "Join Room" button click
- Manages the main application flow

#### 2. `socket.js` - Socket.IO Client
- Establishes Socket.IO connection
- Auto-detects HTTP/HTTPS protocol
- Connects to appropriate port (3000 or 3443)
- Exports `joinRoom()` function

#### 3. `webrtc.js` - WebRTC Peer Management
- Manages multiple peer connections (Map structure)
- Creates RTCPeerConnection instances
- Handles offer/answer/ICE candidate exchange
- Dynamically creates/removes video elements
- Updates video layout based on participant count

**Key Functions:**
- `createPeer(stream)` - Sets up peer connection listeners
- `createPeerConnection(userId, shouldCreateOffer)` - Creates individual peer connection
- `updateVideoLayout()` - Adjusts CSS grid based on video count
- `addVideoElement(userId, stream)` - Creates DOM video element
- `removeVideoElement(userId)` - Removes video element

#### 4. `media.js` - Media Capture
- Requests camera/microphone access
- Uses `navigator.mediaDevices.getUserMedia()`
- Returns MediaStream object
- Displays local video

#### 5. `ui.js` - User Interface
- Sets up camera/mic toggle buttons
- Manages button states and styling
- Shows/hides connecting spinner
- Updates button text based on state

### Styling (`styles.css`)

**Dynamic Video Layout:**
- **1 video**: Single column, max-width 400px
- **2 videos**: 2 columns side-by-side
- **3 videos**: 2x2 grid (first video spans full width)
- **4 videos**: 2x2 grid
- **5+ videos**: Auto-fit grid (min 200px per video)

**Responsive Design:**
- Mobile breakpoints at 768px and 480px
- Stacks videos vertically on small screens
- Adjusts button sizes and spacing

---

## WebRTC Connection Process

### Step-by-Step WebRTC Negotiation

#### 1. **Peer Connection Creation**
```javascript
const peer = new RTCPeerConnection({
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" }
  ]
});
```

#### 2. **Add Local Media Tracks**
```javascript
localStream.getTracks().forEach((track) => {
  peer.addTrack(track, localStream);
});
```

#### 3. **Create Offer (Initiator)**
```javascript
const offer = await peer.createOffer();
await peer.setLocalDescription(offer);
socket.emit("signal", { offer, to: userId });
```

#### 4. **Receive Offer (Responder)**
```javascript
await peer.setRemoteDescription(offer);
const answer = await peer.createAnswer();
await peer.setLocalDescription(answer);
socket.emit("signal", { answer, to: from });
```

#### 5. **Receive Answer (Initiator)**
```javascript
await peer.setRemoteDescription(answer);
```

#### 6. **ICE Candidate Exchange**
Both sides exchange ICE candidates as they're discovered:
```javascript
peer.onicecandidate = (event) => {
  if (event.candidate) {
    socket.emit("signal", { candidate: event.candidate, to: userId });
  }
};
```

#### 7. **Receive Remote Stream**
```javascript
peer.ontrack = (event) => {
  addVideoElement(userId, event.streams[0]);
  updateVideoLayout();
};
```

### STUN Servers

The application uses Google's public STUN servers for NAT traversal:
- `stun:stun.l.google.com:19302`
- `stun:stun1.l.google.com:19302`

**Note:** No TURN servers are configured. This may cause connection failures in strict NAT environments.

---

## Signaling Flow

### Event Flow Diagram

```
User A                          Server                          User B
  │                               │                               │
  │─── join-room("test-room") ───►│                               │
  │                               │─── user-joined(A) ───────────►│
  │                               │                               │
  │◄── room-users([B]) ───────────│                               │
  │                               │                               │
  │─── signal({offer, to: B}) ───►│                               │
  │                               │─── signal({offer, from: A}) ─►│
  │                               │                               │
  │                               │◄── signal({answer, to: A}) ───│
  │◄── signal({answer, from: B})─│                               │
  │                               │                               │
  │─── signal({candidate, to: B})►│                               │
  │                               │─── signal({candidate, from: A})►│
  │                               │                               │
  │                               │◄── signal({candidate, to: A}) ─│
  │◄── signal({candidate, from: B})│                               │
  │                               │                               │
  │◄═══════════════════════════════════════════════════════════════►│
  │                    Direct WebRTC Connection                    │
  │                    (Video/Audio Streams)                       │
```

### Signal Message Types

1. **Offer**: Initial connection proposal
   ```javascript
   { offer: RTCSessionDescription, to: "socketId" }
   ```

2. **Answer**: Response to offer
   ```javascript
   { answer: RTCSessionDescription, to: "socketId" }
   ```

3. **ICE Candidate**: Network connectivity information
   ```javascript
   { candidate: RTCIceCandidate, to: "socketId" }
   ```

---

## File Structure

```
Video Call/
├── backend/
│   ├── index.js          # HTTP server (port 3000)
│   └── https-server.js   # HTTPS server (port 3443)
├── frontend/
│   ├── index.html        # Main HTML page
│   ├── styles.css        # All styling
│   └── js/
│       ├── app.js        # Main application logic
│       ├── socket.js     # Socket.IO client
│       ├── webrtc.js     # WebRTC peer management
│       ├── media.js      # Media capture
│       └── ui.js         # UI controls
├── package.json          # Dependencies and scripts
└── HOW_IT_WORKS.md       # This file
```

---

## Setup & Usage

### Installation

```bash
npm install
```

### Running the Application

**HTTP Server (Port 3000):**
```bash
npm start
# or for development with auto-reload:
npm run dev
```

**HTTPS Server (Port 3443):**
```bash
npm run https
# or for development with auto-reload:
npm run https-dev
```

### Accessing the Application

- **HTTP**: Open `http://localhost:3000`
- **HTTPS**: Open `https://localhost:3443` (accept self-signed certificate warning)

### Testing Multi-User Calls

1. Open the application in one browser tab
2. Allow camera/microphone permissions
3. Click "Join Room"
4. Open the same URL in another tab/window
5. Click "Join Room" in the second window
6. Both users should see each other's video

### Current Limitations

- Room ID is hardcoded to `"test-room"` in `app.js`
- No room ID input field for users
- No TURN servers configured (may fail behind strict NATs)
- Self-signed certificates require browser warning acceptance
- No user authentication or authorization

---

## Key Concepts

### WebRTC (Web Real-Time Communication)
- Enables direct peer-to-peer communication
- Handles media encoding/decoding
- Manages network traversal (NAT, firewalls)
- Provides encryption for media streams

### Signaling
- Process of exchanging connection information
- Required because WebRTC doesn't include signaling
- Can use any transport mechanism (WebSocket, HTTP, etc.)
- This app uses Socket.IO for signaling

### ICE (Interactive Connectivity Establishment)
- Protocol for establishing connections
- Discovers network paths between peers
- Uses STUN servers to find public IP addresses
- May use TURN servers as relay if direct connection fails

### Peer Connection
- Represents a connection to a remote peer
- Manages media tracks (audio/video)
- Handles connection state
- Exchanges network information (ICE candidates)

---

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
- Try using HTTPS server for better compatibility

### Connection Fails Behind NAT
- Add TURN servers to RTCPeerConnection configuration
- Use a TURN service provider (e.g., Twilio, Xirsys)

---

## Future Enhancements

Potential improvements:
- Room ID input field
- User names/identities
- Screen sharing
- Chat functionality
- Recording capabilities
- TURN server integration
- User authentication
- Better error handling
- Connection quality indicators

---

**Last Updated:** 2024

