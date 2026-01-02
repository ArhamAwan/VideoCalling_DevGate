import React, { useRef, useEffect, useState } from "react";
import Header from "./Header";
import ParticipantsPanel from "./ParticipantsPanel";
import ChatPanel from "./ChatPanel";
import ControlBar from "./ControlBar";

function VideoCall({ stream, isConnecting, onJoinRoom, setVideoContainerRef, socket, userName }) {
  const localVideoRef = useRef(null);
  const videoContainerRef = useRef(null);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [micEnabled, setMicEnabled] = useState(true);
  const [isInCall, setIsInCall] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [messages, setMessages] = useState([]);
  const [currentUserId] = useState(() => socket?.id || "You");

  useEffect(() => {
    if (setVideoContainerRef && videoContainerRef.current) {
      setVideoContainerRef(videoContainerRef.current);
    }
  }, [setVideoContainerRef]);

  useEffect(() => {
    if (stream && localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
      localVideoRef.current.play().catch((err) => {
        console.error("Error playing video:", err);
      });
    }
  }, [stream]);

  useEffect(() => {
    if (!socket) return;

    const handleUserJoined = ({ id: userId, name: userName }) => {
      console.log("User joined:", userId, userName);
      setParticipants((prev) => {
        if (!prev.find((p) => p.id === userId)) {
          return [
            ...prev,
            {
              id: userId,
              name: userName || `User ${userId.substring(0, 8)}`,
              micEnabled: true,
              cameraEnabled: true,
            },
          ];
        }
        return prev;
      });
    };

    const handleRoomUsers = (users) => {
      console.log("Received room users:", users);
      setParticipants((prev) => {
        const newParticipants = users
          .filter((user) => !prev.find((p) => p.id === (user.id || user)))
          .map((user) => ({
            id: user.id || user,
            name: user.name || `User ${(user.id || user).substring(0, 8)}`,
            micEnabled: true,
            cameraEnabled: true,
          }));
        return [...prev, ...newParticipants];
      });
    };

    const handleUserLeft = (userId) => {
      setParticipants((prev) => prev.filter((p) => p.id !== userId));
    };

    socket.on("user-joined", handleUserJoined);
    socket.on("room-users", handleRoomUsers);
    socket.on("user-left", handleUserLeft);

    return () => {
      socket.off("user-joined", handleUserJoined);
      socket.off("room-users", handleRoomUsers);
      socket.off("user-left", handleUserLeft);
    };
  }, [socket]);

  useEffect(() => {
    if (isInCall) {
      setParticipants((prev) =>
        prev.map((p) =>
          p.id === currentUserId
            ? { ...p, micEnabled: micEnabled, cameraEnabled: cameraEnabled }
            : p
        )
      );
    }
  }, [micEnabled, cameraEnabled, isInCall, currentUserId]);

  const toggleCamera = () => {
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setCameraEnabled(videoTrack.enabled);
      }
    }
  };

  const toggleMic = () => {
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setMicEnabled(audioTrack.enabled);
      }
    }
  };

  const handleJoinRoom = () => {
    if (!isInCall) {
      onJoinRoom();
      setIsInCall(true);
      setParticipants([
        {
          id: currentUserId,
          name: userName || "You",
          micEnabled: micEnabled,
          cameraEnabled: cameraEnabled,
        },
      ]);
    }
  };

  const handleEndCall = () => {
    setIsInCall(false);
    setParticipants([]);
    setMessages([]);
  };

  const handleSendMessage = (text) => {
    const newMessage = {
      author: "You",
      text: text,
      time: new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  const handleOptions = () => {
    // Placeholder for options menu
    console.log("Options clicked");
  };

  return (
    <div className="video-call-container">
      <Header />

      <div className="main-content">
        <div className="video-area">
          <div className="video-container" ref={videoContainerRef}>
            <div className="video-wrapper main-video">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="local-video"
              />
              <div className="video-label">You</div>
              <div className="video-controls-overlay">
                <button className="fullscreen-btn">⛶</button>
                {micEnabled && <div className="audio-indicator">🔊</div>}
              </div>
            </div>
          </div>
        </div>

        <aside className="sidebar">
          <ParticipantsPanel participants={participants} />
          <ChatPanel messages={messages} onSendMessage={handleSendMessage} />
        </aside>
      </div>

      <ControlBar
        micEnabled={micEnabled}
        cameraEnabled={cameraEnabled}
        showChat={showChat}
        onToggleMic={toggleMic}
        onToggleCamera={toggleCamera}
        onToggleChat={() => setShowChat(!showChat)}
        onOptions={handleOptions}
        onEndCall={handleEndCall}
        isInCall={isInCall}
        onJoinRoom={handleJoinRoom}
      />

      {isConnecting && (
        <div className="connecting-overlay">
          <div className="spinner"></div>
          <span>Connecting...</span>
        </div>
      )}
    </div>
  );
}

export default VideoCall;
