import React, { useState, useEffect, useRef } from "react";
import { useMediaStream } from "./hooks/useMediaStream";
import { useSocket } from "./hooks/useSocket";
import { useWebRTC } from "./hooks/useWebRTC";
import VideoCall from "./components/VideoCall";
import HomePage from "./components/HomePage";

function App() {
  const [stream, setStream] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isInCall, setIsInCall] = useState(false);
  const [userName, setUserName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [error, setError] = useState("");
  const { socket, joinRoom, createRoom, checkRoomExists } = useSocket();
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

  const handleCreateCall = async (name, newRoomId) => {
    if (!stream || !socket) {
      setError("Media stream or socket not ready. Please wait...");
      return;
    }

    setUserName(name);
    setRoomId(newRoomId);
    setError("");

    // Create the room on the server (this also joins the socket room)
    createRoom(newRoomId, name);

    setIsConnecting(true);
    setIsInCall(true);

    // Set up WebRTC peer connections
    // The room-users event will fire with existing users (empty if we're first)
    if (cleanupRef.current) {
      cleanupRef.current();
    }
    cleanupRef.current = createPeer(stream);
  };

  const handleJoinCall = async (name, joinRoomId) => {
    if (!stream || !socket) {
      setError("Media stream or socket not ready. Please wait...");
      return;
    }

    setError("");

    try {
      // Check if room exists
      const exists = await checkRoomExists(joinRoomId);
      
      if (!exists) {
        setError("Room not found. Please check the room ID and try again.");
        return;
      }

      setUserName(name);
      setRoomId(joinRoomId);
      setIsConnecting(true);
      setIsInCall(true);

      // Join the room
      joinRoom(joinRoomId, name);

      if (cleanupRef.current) {
        cleanupRef.current();
      }
      cleanupRef.current = createPeer(stream);
    } catch (err) {
      console.error("Error joining room:", err);
      setError("Failed to join room. Please try again.");
    }
  };

  const handleJoinRoom = () => {
    // This is called from VideoCall component when ready to join
    if (!stream || !socket) return;

    setIsConnecting(true);
    joinRoom(roomId, userName);

    if (cleanupRef.current) {
      cleanupRef.current();
    }
    cleanupRef.current = createPeer(stream);
  };

  // Listen for room-not-found errors
  useEffect(() => {
    if (!socket) return;

    const handleRoomNotFound = () => {
      setIsInCall(false);
      setError("Room not found. Please check the room ID and try again.");
      setIsConnecting(false);
    };

    socket.on("room-not-found", handleRoomNotFound);

    return () => {
      socket.off("room-not-found", handleRoomNotFound);
    };
  }, [socket]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, []);

  if (!isInCall) {
    return (
      <HomePage
        onCreateCall={handleCreateCall}
        onJoinCall={handleJoinCall}
        error={error}
      />
    );
  }

  return (
    <VideoCall
      stream={stream}
      isConnecting={isConnecting}
      onJoinRoom={handleJoinRoom}
      setVideoContainerRef={setVideoContainerRef}
      socket={socket}
      userName={userName}
      roomId={roomId}
    />
  );
}

export default App;
