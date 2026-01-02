import React from "react";

function ControlBar({
  micEnabled,
  cameraEnabled,
  showChat,
  onToggleMic,
  onToggleCamera,
  onToggleChat,
  onOptions,
  onEndCall,
  isInCall,
  onJoinRoom,
}) {
  return (
    <div className="control-bar">
      <button
        className={`control-btn ${!micEnabled ? "off" : ""}`}
        onClick={onToggleMic}
        title={micEnabled ? "Mute" : "Unmute"}
      >
        {micEnabled ? "🎤" : "🔇"}
      </button>
      <button
        className={`control-btn ${!cameraEnabled ? "off" : ""}`}
        onClick={onToggleCamera}
        title={cameraEnabled ? "Turn off camera" : "Turn on camera"}
      >
        📹
      </button>
      <button
        className={`control-btn ${showChat ? "active" : ""}`}
        onClick={onToggleChat}
        title="Toggle chat"
      >
        💬
      </button>
      <button className="control-btn" onClick={onOptions} title="More options">
        ⋯
      </button>
      {!isInCall ? (
        <button className="join-btn" onClick={onJoinRoom}>
          Join Room
        </button>
      ) : (
        <button className="end-call-btn" onClick={onEndCall}>
          End Call
        </button>
      )}
    </div>
  );
}

export default ControlBar;

