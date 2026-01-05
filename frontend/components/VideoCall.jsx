import React, { useRef, useEffect, useState } from "react";
import Header from "./Header";
import ParticipantsPanel from "./ParticipantsPanel";
import ChatPanel from "./ChatPanel";
import ControlBar from "./ControlBar";
import { FiMic, FiMicOff } from "react-icons/fi";

function VideoCall({ stream, isConnecting, setVideoContainerRef, socket, userName, roomId, onEndCall }) {
  const localVideoRef = useRef(null);
  const videoContainerRef = useRef(null);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [micEnabled, setMicEnabled] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [messages, setMessages] = useState([]);
  const [currentUserId] = useState(() => socket?.id || "You");
  const displayName = userName || "You";
  const hasAutoJoined = useRef(false);

  useEffect(() => {
    if (setVideoContainerRef) {
      // Set the ref immediately and also on mount
      if (videoContainerRef.current) {
        setVideoContainerRef(videoContainerRef.current);
      }
      // Also set up a callback ref to ensure it's always set
      const container = document.querySelector('.videos-grid-container');
      if (container && !videoContainerRef.current) {
        videoContainerRef.current = container;
        setVideoContainerRef(container);
      }
    }
  }, [setVideoContainerRef]);


  // Auto-join when component mounts if we have socket and roomId
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

  useEffect(() => {
    if (stream && localVideoRef.current) {
      const video = localVideoRef.current;
      video.srcObject = stream;

      // Wait for video to be ready before playing
      const handleCanPlay = () => {
        video.play().catch((err) => {
          // Ignore AbortError - it's common when video is reloaded
          if (err.name !== 'AbortError') {
            console.error("Error playing video:", err);
          }
        });
      };

      video.addEventListener('canplay', handleCanPlay, { once: true });

      // Also try to play immediately (in case canplay already fired)
      if (video.readyState >= 2) {
        video.play().catch((err) => {
          if (err.name !== 'AbortError') {
            console.error("Error playing video:", err);
          }
        });
      }

      return () => {
        video.removeEventListener('canplay', handleCanPlay);
      };
    }
  }, [stream]);



  useEffect(() => {
    if (!socket) return;

    const handleUserJoined = (payload) => {
      const userId = payload.id || payload;
      const newUserName = payload.name || userName || `User ${userId.substring(0, 8)}`;

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
      // users is array of { id, name } objects
      if (Array.isArray(users) && users.length > 0) {
        const otherParticipants = users.map(({ id, name }) => ({
          id,
          name: name || `User ${id.substring(0, 8)}`,
          micEnabled: true,
          cameraEnabled: true,
        }));

        // Add local user
        setParticipants([
          {
            id: currentUserId,
            name: displayName,
            micEnabled: micEnabled,
            cameraEnabled: cameraEnabled,
          },
          ...otherParticipants,
        ]);
      }
    };

    const handleUserLeft = (userId) => {
      setParticipants((prev) => prev.filter((p) => p.id !== userId));
    };

    const handleReceiveMessage = (message) => {
      setMessages((prev) => [...prev, message]);
    };

    socket.on("user-joined", handleUserJoined);
    socket.on("user-left", handleUserLeft);
    socket.on("room-users", handleRoomUsers);
    socket.on("receive-message", handleReceiveMessage);

    const handleMicToggle = ({ userId, isMuted }) => {
      setParticipants((prev) =>
        prev.map((p) =>
          p.id === userId
            ? { ...p, micEnabled: !isMuted }
            : p
        )
      );
    };

    socket.on("mic-toggle", handleMicToggle);

    return () => {
      socket.off("user-joined", handleUserJoined);
      socket.off("user-left", handleUserLeft);
      socket.off("room-users", handleRoomUsers);
      socket.off("receive-message", handleReceiveMessage);
      socket.off("mic-toggle", handleMicToggle);
    };
  }, [socket, currentUserId, displayName, micEnabled, cameraEnabled, userName]);

  useEffect(() => {
    setParticipants((prev) =>
      prev.map((p) =>
        p.id === currentUserId
          ? { ...p, micEnabled: micEnabled, cameraEnabled: cameraEnabled }
          : p
      )
    );
  }, [micEnabled, cameraEnabled, currentUserId]);

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
        // Notify other peers about mic toggle so their UI can update
        if (socket) {
          socket.emit("mic-toggle", {
            roomId,
            userId: currentUserId,
            isMuted: !audioTrack.enabled,
          });
        }
      }
    }
  };

  const handleEndCall = () => {
    if (onEndCall) {
      onEndCall();
    }
  };

  const handleSendMessage = (text) => {
    const time = new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const newMessage = {
      author: displayName,
      text: text,
      time: time,
    };

    // Update local state
    setMessages((prev) => [...prev, newMessage]);

    // Send to server
    if (socket && roomId) {
      socket.emit("send-message", {
        roomId,
        message: text,
        time,
        author: displayName
      });
    }
  };

  const handleOptions = () => {
    // Placeholder for options menu
    console.log("Options clicked");
  };

  return (
    <div className="video-call-container">
      <Header roomId={roomId} />

      <div className="main-content">
        <div className="video-area">
          {/* Grid container for all videos */}
          <div className="videos-grid-container" ref={videoContainerRef}>
            {/* Local video - will be added to grid */}
            <div className="video-wrapper grid-video local-video-wrapper" id="wrapper-local">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="local-video"
              />
              <div className="video-label">{displayName}</div>
              <div className={`mic-status ${micEnabled ? 'mic-unmuted' : 'mic-muted'}`} aria-label={micEnabled ? 'Microphone on' : 'Microphone muted'}>
                {micEnabled ? <FiMic /> : <FiMicOff />}
              </div>
              {/* Remote videos will be added here by useWebRTC */}
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
        isInCall={true}
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
