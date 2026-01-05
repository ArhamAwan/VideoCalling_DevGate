import React, { useState, useEffect, useRef, useCallback } from "react";
import { useMediaStream } from "./hooks/useMediaStream";
import { useSocket } from "./hooks/useSocket";
import { useWebRTC } from "./hooks/useWebRTC";
import VideoCall from "./components/VideoCall";
import { useTheme } from "./hooks/useTheme";
import HomePage from "./components/HomePage";

function App() {
  const [stream, setStream] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isInCall, setIsInCall] = useState(false);
  const [userName, setUserName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [error, setError] = useState("");
  const [showCallEnded, setShowCallEnded] = useState(false);
  const [callEndedMessage, setCallEndedMessage] = useState("");
  const { socket, joinRoom, createRoom, checkRoomExists, leaveRoom, endCall } =
    useSocket();
  const { theme, toggleTheme } = useTheme();
  const { startMedia } = useMediaStream();
  const {
    createPeer,
    setVideoContainerRef,
    cleanup: cleanupWebRTC,
  } = useWebRTC(socket, stream, setIsConnecting);

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

  const performCallCleanup = useCallback(
    (showMessage = true, message = "Call ended") => {
      console.log("Performing call cleanup...");

      // Show call ended modal first
      if (showMessage) {
        setShowCallEnded(true);
        setCallEndedMessage(message);
      }

      // 1. Clean up WebRTC peer connections
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }

      // 2. Clean up all WebRTC connections and video elements
      if (cleanupWebRTC) {
        cleanupWebRTC();
      }

      // 3. Stop all media tracks
      if (stream) {
        stream.getTracks().forEach((track) => {
          track.stop();
          console.log(`Stopped ${track.kind} track`);
        });
      }

      // Wait 2 seconds before returning to home (to show the modal if needed)
      const delay = showMessage ? 2000 : 0;
      setTimeout(() => {
        // 4. Reset state to go back to home page
        setIsInCall(false);
        setIsConnecting(false);
        setRoomId("");
        setUserName("");
        setError("");
        setShowCallEnded(false);
        setCallEndedMessage("");

        // 5. Restart media stream for next call
        startMedia()
          .then((newStream) => {
            setStream(newStream);
          })
          .catch((error) => {
            console.error("Failed to restart media after ending call:", error);
          });

        console.log("Call cleanup complete");
      }, delay);
    },
    [cleanupWebRTC, stream, startMedia]
  );

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

  // Listen for call-ended event (when another user ends the call)
  useEffect(() => {
    if (!socket) return;

    const handleCallEnded = (data) => {
      console.log("Call ended by another user:", data);
      // Perform cleanup with message
      performCallCleanup(true, "Call ended by another participant");
    };

    socket.on("call-ended", handleCallEnded);

    return () => {
      socket.off("call-ended", handleCallEnded);
    };
  }, [socket, performCallCleanup]);

  const handleEndCall = () => {
    console.log("Leaving call...");

    // Notify server that this user is leaving (not ending the call for everyone)
    if (roomId) {
      leaveRoom(roomId);
    }

    // Perform cleanup without showing "call ended" message since we're just leaving
    performCallCleanup(false, "");
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
    <>
      {/* Optional: Add theme toggle button */}
      <button
        onClick={toggleTheme}
        style={{
          position: "fixed",
          top: "16px",
          right: "16px",
          zIndex: 10000,
          padding: "8px 12px",
          borderRadius: "8px",
          border: "none",
          backgroundColor: "var(--bg-surface)",
          color: "var(--text-primary)",
          cursor: "pointer",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        }}
        title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      >
        {theme === "light" ? "🌙" : "☀️"}
      </button>

      {!isInCall ? (
        <HomePage
          onCreateCall={handleCreateCall}
          onJoinCall={handleJoinCall}
          error={error}
        />
      ) : (
        <VideoCall
          stream={stream}
          isConnecting={isConnecting}
          setVideoContainerRef={setVideoContainerRef}
          socket={socket}
          userName={userName}
          roomId={roomId}
          onEndCall={handleEndCall}
        />
      )}
      {showCallEnded && (
        <div className="call-ended-overlay">
          <div className="call-ended-modal">
            <div className="call-ended-icon">📞</div>
            <h2>Call Ended</h2>
            <p>{callEndedMessage}</p>
          </div>
        </div>
      )}
    </>
  );
}

export default App;
