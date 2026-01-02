import React, { useState, useEffect, useRef } from "react";
import { useMediaStream } from "./hooks/useMediaStream";
import { useSocket } from "./hooks/useSocket";
import { useWebRTC } from "./hooks/useWebRTC";
import VideoCall from "./components/VideoCall";

function App() {
  const [stream, setStream] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const { socket, joinRoom } = useSocket();
  const { startMedia } = useMediaStream();
  const { createPeer, setVideoContainerRef } = useWebRTC(
    socket,
    stream,
    setIsConnecting
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    async function init() {
      try {
        const mediaStream = await startMedia();
        setStream(mediaStream);
      } catch (error) {
        console.error("Failed to start media:", error);
      }
    }
    init();
  }, [startMedia]);

  const cleanupRef = useRef(null);

  const [userName, setUserName] = useState("");
  const [hasJoined, setHasJoined] = useState(false);

  const handleJoinRoom = () => {
    if (!stream || !socket || !userName.trim()) return;

    setIsConnecting(true);
    joinRoom("test-room", userName);
    setHasJoined(true);

    if (cleanupRef.current) {
      cleanupRef.current();
    }
    cleanupRef.current = createPeer(stream);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, []);

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      {!hasJoined ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          gap: '20px',
          background: '#f5f5f5'
        }}>
          <h2>Enter your name to join</h2>
          <input
            type="text"
            placeholder="Your Name"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            style={{
              padding: '10px 20px',
              fontSize: '16px',
              borderRadius: '8px',
              border: '1px solid #ddd',
              width: '250px'
            }}
          />
          <button
            onClick={handleJoinRoom}
            disabled={!userName.trim()}
            style={{
              padding: '10px 30px',
              background: '#4a90e2',
              color: 'white',
              border: 'none',
              borderRadius: '20px',
              fontSize: '16px',
              cursor: userName.trim() ? 'pointer' : 'not-allowed',
              opacity: userName.trim() ? 1 : 0.7
            }}
          >
            Join Call
          </button>
        </div>
      ) : (
        <VideoCall
          stream={stream}
          isConnecting={isConnecting}
          onJoinRoom={handleJoinRoom}
          setVideoContainerRef={setVideoContainerRef}
          socket={socket}
          userName={userName}
        />
      )}
    </div>
  );
}

export default App;
