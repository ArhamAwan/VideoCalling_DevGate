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

  const handleJoinRoom = () => {
    if (!stream || !socket) return;

    setIsConnecting(true);
    joinRoom("test-room");

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
    <VideoCall
      stream={stream}
      isConnecting={isConnecting}
      onJoinRoom={handleJoinRoom}
      setVideoContainerRef={setVideoContainerRef}
      socket={socket}
    />
  );
}

export default App;
