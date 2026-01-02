import React, { useRef, useEffect, useState } from "react";
import Header from "./Header";
import ParticipantsPanel from "./ParticipantsPanel";
import ChatPanel from "./ChatPanel";
import ControlBar from "./ControlBar";

function VideoCall({ stream, isConnecting, onJoinRoom, setVideoContainerRef, socket, userName, roomId }) {
  const localVideoRef = useRef(null);
  const videoContainerRef = useRef(null);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [micEnabled, setMicEnabled] = useState(true);
  const [isInCall, setIsInCall] = useState(false);
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

  // Also update ref when container is mounted
  useEffect(() => {
    if (videoContainerRef.current && setVideoContainerRef) {
      setVideoContainerRef(videoContainerRef.current);
    }
  }, [setVideoContainerRef]);

  // Auto-join when component mounts if we have socket and roomId
  useEffect(() => {
    if (socket && roomId && !hasAutoJoined.current) {
      hasAutoJoined.current = true;
      setIsInCall(true);
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

  // Update local video mic status indicator
  useEffect(() => {
    const localVideoWrapper = document.getElementById('wrapper-local');
    if (localVideoWrapper) {
      const micStatus = localVideoWrapper.querySelector('.mic-status');
      if (micStatus) {
        if (micEnabled) {
          micStatus.className = 'mic-status mic-unmuted';
          micStatus.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 14C13.1 14 14 13.1 14 12V6C14 4.9 13.1 4 12 4C10.9 4 10 4.9 10 6V12C10 13.1 10.9 14 12 14Z" fill="currentColor"/>
            </svg>
          `;
        } else {
          micStatus.className = 'mic-status mic-muted';
          micStatus.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M19 11H17.3C17.2 11.3 17.1 11.6 17 12V14C17 15.1 16.1 16 15 16H9C7.9 16 7 15.1 7 14V12C7 11.6 6.9 11.3 6.8 11H5C4.4 11 4 11.4 4 12C4 12.6 4.4 13 5 13H19C19.6 13 20 12.6 20 12C20 11.4 19.6 11 19 11Z" fill="currentColor"/>
              <path d="M12 14C13.1 14 14 13.1 14 12V6C14 4.9 13.1 4 12 4C10.9 4 10 4.9 10 6V12C10 13.1 10.9 14 12 14Z" fill="currentColor"/>
              <path d="M3.7 2.3L2.3 3.7L20.3 21.7L21.7 20.3L3.7 2.3Z" fill="currentColor"/>
            </svg>
          `;
        }
      }
    }
  }, [micEnabled]);

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

    socket.on("user-joined", handleUserJoined);
    socket.on("user-left", handleUserLeft);
    socket.on("room-users", handleRoomUsers);

    return () => {
      socket.off("user-joined", handleUserJoined);
      socket.off("user-left", handleUserLeft);
      socket.off("room-users", handleRoomUsers);
    };
  }, [socket, currentUserId, displayName, micEnabled, cameraEnabled]);

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
          name: displayName,
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
      author: displayName,
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
              {micEnabled && (
                <div className="mic-status mic-unmuted">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M12 14C13.1 14 14 13.1 14 12V6C14 4.9 13.1 4 12 4C10.9 4 10 4.9 10 6V12C10 13.1 10.9 14 12 14Z" fill="currentColor"/>
                  </svg>
                </div>
              )}
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
