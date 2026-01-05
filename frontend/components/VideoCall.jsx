import React, { useRef, useEffect, useState, useMemo } from "react";
import { useTheme } from "../hooks/useTheme";
import {
  BsMicFill,
  BsMicMuteFill,
  BsCameraVideoFill,
  BsCameraVideoOffFill,
  BsChatDotsFill,
  BsPeopleFill,
  BsTelephoneFill,
  BsLink45Deg,
  BsSendFill,
  BsThreeDots,
} from "react-icons/bs";
import AvatarPlaceholder from "./AvatarPlaceholder";

function VideoCall({
  stream,
  isConnecting,
  setVideoContainerRef,
  socket,
  userName,
  roomId,
  onEndCall,
}) {
  const { theme, toggleTheme } = useTheme();
  const localVideoRef = useRef(null);
  const videoContainerRef = useRef(null);

  // State
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [micEnabled, setMicEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState("participants"); // 'participants' or 'chat'
  const [participants, setParticipants] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentUserId] = useState(() => socket?.id || "You");

  const displayName = userName || "You";
  const hasAutoJoined = useRef(false);

  // --- Clock Logic ---
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedTime = useMemo(() => {
    return currentTime
      .toLocaleString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      })
      .replace(" at ", " | ");
  }, [currentTime]);

  // --- WebRTC & Socket Logic (Preserved) ---

  useEffect(() => {
    if (setVideoContainerRef) {
      if (videoContainerRef.current) {
        setVideoContainerRef(videoContainerRef.current);
      }
      // Backup callback
      const container = document.querySelector(".videos-grid-container");
      if (container && !videoContainerRef.current) {
        videoContainerRef.current = container;
        setVideoContainerRef(container);
      }
    }
  }, [setVideoContainerRef]);

  // Auto-join
  useEffect(() => {
    if (socket && roomId && !hasAutoJoined.current) {
      hasAutoJoined.current = true;
      setParticipants([
        {
          id: currentUserId,
          name: displayName,
          micEnabled: micEnabled,
          cameraEnabled: cameraEnabled,
        },
      ]);
    }
  }, [socket, roomId, currentUserId, displayName, micEnabled, cameraEnabled]);

  // Local Stream
  useEffect(() => {
    if (stream && localVideoRef.current) {
      const video = localVideoRef.current;
      video.srcObject = stream;

      const safePlay = () => {
        video.play().catch((err) => {
          if (err.name !== "AbortError")
            console.error("Error playing video:", err);
        });
      };

      if (video.readyState >= 2) safePlay();
      else video.addEventListener("canplay", safePlay, { once: true });
    }
  }, [stream]);

  // Socket Events
  useEffect(() => {
    if (!socket) return;

    const handleUserJoined = (payload) => {
      const userId = payload.id || payload;
      const newUserName = payload.name || `User ${userId.substring(0, 4)}`;
      setParticipants((prev) => {
        if (!prev.find((p) => p.id === userId)) {
          return [
            ...prev,
            {
              id: userId,
              name: newUserName,
              micEnabled: true,
              cameraEnabled: true,
            },
          ];
        }
        return prev;
      });
    };

    const handleRoomUsers = (users) => {
      if (Array.isArray(users) && users.length > 0) {
        const otherParticipants = users.map(({ id, name }) => ({
          id,
          name: name || `User ${id.substring(0, 4)}`,
          micEnabled: true,
          cameraEnabled: true,
        }));
        setParticipants([
          { id: currentUserId, name: displayName, micEnabled, cameraEnabled },
          ...otherParticipants,
        ]);
      }
    };

    const handleUserLeft = (userId) =>
      setParticipants((prev) => prev.filter((p) => p.id !== userId));
    const handleReceiveMessage = (msg) => setMessages((prev) => [...prev, msg]);

    const handleMicToggle = ({ userId, isMuted }) => {
      setParticipants((prev) =>
        prev.map((p) => (p.id === userId ? { ...p, micEnabled: !isMuted } : p))
      );
    };

    socket.on("user-joined", handleUserJoined);
    socket.on("user-left", handleUserLeft);
    socket.on("room-users", handleRoomUsers);
    socket.on("receive-message", handleReceiveMessage);
    socket.on("mic-toggle", handleMicToggle);

    return () => {
      socket.off("user-joined", handleUserJoined);
      socket.off("user-left", handleUserLeft);
      socket.off("room-users", handleRoomUsers);
      socket.off("receive-message", handleReceiveMessage);
      socket.off("mic-toggle", handleMicToggle);
    };
  }, [socket, currentUserId, displayName, micEnabled, cameraEnabled]);

  // Sync local mic/camera state to participants list
  useEffect(() => {
    setParticipants((prev) =>
      prev.map((p) =>
        p.id === currentUserId ? { ...p, micEnabled, cameraEnabled } : p
      )
    );
  }, [micEnabled, cameraEnabled, currentUserId]);

  // Actions
  const toggleCamera = () => {
    if (stream) {
      const track = stream.getVideoTracks()[0];
      if (track) {
        track.enabled = !track.enabled;
        setCameraEnabled(track.enabled);
      }
    }
  };

  const toggleMic = () => {
    if (stream) {
      const track = stream.getAudioTracks()[0];
      if (track) {
        track.enabled = !track.enabled;
        setMicEnabled(track.enabled);
        if (socket)
          socket.emit("mic-toggle", {
            roomId,
            userId: currentUserId,
            isMuted: !track.enabled,
          });
      }
    }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const time = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    const msgData = { author: displayName, text: newMessage, time };

    setMessages((prev) => [...prev, msgData]);
    if (socket && roomId) {
      socket.emit("send-message", {
        roomId,
        message: newMessage,
        time,
        author: displayName,
      });
    }
    setNewMessage("");
  };

  const copyLink = () => {
    // Copy the Room ID, not the URL (since there's no routing)
    if (roomId) {
      navigator.clipboard.writeText(roomId);
      // Optional: Visual feedback could be added here
    }
  };

  return (
    <div className="app-container">
      {/* --- HEADER --- */}
      <header className="app-header">
        <div className="brand-section">
          <div className="logo-icon">
            <BsCameraVideoFill />
          </div>
          <h3>VideoMeet</h3>
        </div>

        <div className="header-info">
          <div className="date-time">{formattedTime}</div>

          <div className="participant-preview">
            <div className="avatar-stack">
              {participants.slice(0, 3).map((p, i) => (
                <AvatarPlaceholder key={p.id} name={p.name} size={32} />
              ))}
              {participants.length > 3 && (
                <div
                  className="avatar-placeholder"
                  style={{
                    width: 32,
                    height: 32,
                    backgroundColor: "#E0E0E0",
                    color: "#666",
                    fontSize: 12,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  +{participants.length - 3}
                </div>
              )}
            </div>
            <button
              className="invite-btn"
              onClick={copyLink}
              title="Copy Room ID"
            >
              <BsLink45Deg size={18} />
              <span style={{ opacity: 0.3 }}>|</span>
              <span>{roomId ? `${roomId.substring(0, 8)}...` : "Room ID"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* --- MAIN CONTENT --- */}
      <div className="main-content">
        {/* STAGE (Video Area) */}
        <div className="stage-container">
          {/* This container needs to match what useWebRTC expects (appending divs) 
              We style it as a grid. */}
          <div className="videos-grid-container" ref={videoContainerRef}>
            {/* Local Video */}
            <div className="video-wrapper">
              <video ref={localVideoRef} autoPlay playsInline muted />
              <div className="video-label">{displayName} (You)</div>
              <div className={`mic-status ${!micEnabled ? "mic-muted" : ""}`}>
                {micEnabled ? <BsMicFill /> : <BsMicMuteFill />}
              </div>
            </div>
          </div>
        </div>

        {/* SIDEBAR */}
        <aside className="sidebar">
          <div className="sidebar-header">
            <button
              className={`sidebar-tab ${
                activeTab === "participants" ? "active" : ""
              }`}
              onClick={() => setActiveTab("participants")}
            >
              Participants ({participants.length})
            </button>
            <button
              className={`sidebar-tab ${activeTab === "chat" ? "active" : ""}`}
              onClick={() => setActiveTab("chat")}
            >
              Chat
            </button>
          </div>

          {activeTab === "participants" ? (
            <div className="sidebar-section">
              <div className="participants-list">
                {participants.map((p) => (
                  <div key={p.id} className="participant-item">
                    <div className="participant-info">
                      <AvatarPlaceholder name={p.name} size={36} />
                      <span className="participant-name">
                        {p.name} {p.id === currentUserId && "(You)"}
                      </span>
                    </div>
                    <div className="participant-controls">
                      <button
                        className={`icon-btn-sm ${
                          !p.micEnabled ? "danger" : ""
                        }`}
                      >
                        {p.micEnabled ? (
                          <BsMicFill size={14} />
                        ) : (
                          <BsMicMuteFill size={14} />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="chat-container">
              <div className="chat-messages">
                {messages.length === 0 && (
                  <div
                    style={{
                      textAlign: "center",
                      color: "var(--text-secondary)",
                      marginTop: 20,
                      fontSize: 13,
                    }}
                  >
                    No messages yet
                  </div>
                )}
                {messages.map((msg, i) => (
                  <div key={i} className="chat-message">
                    <AvatarPlaceholder
                      name={msg.author}
                      size={32}
                      fontSize={12}
                    />
                    <div className="message-content">
                      <div className="message-header">
                        <span className="message-author">{msg.author}</span>
                        <span className="message-time">{msg.time}</span>
                      </div>
                      <div className="message-bubble">{msg.text}</div>
                    </div>
                  </div>
                ))}
              </div>
              <form className="chat-input-area" onSubmit={sendMessage}>
                <input
                  type="text"
                  className="chat-input"
                  placeholder="Type something..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                />
                <button type="submit" className="send-btn">
                  <BsSendFill size={14} />
                </button>
              </form>
            </div>
          )}
        </aside>
      </div>

      {/* --- FOOTER CONTROLS --- */}
      <div className="controls-bar">
        <button
          className={`control-btn ${micEnabled ? "" : "danger-soft"}`}
          onClick={toggleMic}
        >
          {micEnabled ? <BsMicFill /> : <BsMicMuteFill />}
        </button>

        <button
          className={`control-btn ${cameraEnabled ? "" : "danger-soft"}`}
          onClick={toggleCamera}
        >
          {cameraEnabled ? <BsCameraVideoFill /> : <BsCameraVideoOffFill />}
        </button>

        <button
          className="control-btn"
          onClick={() => setActiveTab("participants")}
        >
          <BsPeopleFill />
        </button>

        <button className="control-btn" onClick={() => setActiveTab("chat")}>
          <BsChatDotsFill />
        </button>

        <button className="control-btn danger" onClick={onEndCall}>
          <BsTelephoneFill />
          <span>End Call</span>
        </button>
      </div>

      {isConnecting && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(255,255,255,0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999,
          }}
        >
          <div className="spinner"></div>
          <span style={{ marginLeft: 10, fontWeight: 600 }}>Connecting...</span>
        </div>
      )}
    </div>
  );
}

export default VideoCall;
