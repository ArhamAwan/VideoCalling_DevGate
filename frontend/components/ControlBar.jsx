import React from "react";
import {
  FiMic,
  FiMicOff,
  FiVideo,
  FiVideoOff,
  FiMessageSquare,
  FiMoreHorizontal,
  FiPhone,
  FiPhoneOff,
} from "react-icons/fi";

function ControlBar({
  micEnabled,
  cameraEnabled,
  showChat,
  onToggleMic,
  onToggleCamera,
  onToggleChat,
  onOptions,
  onEndCall,
  isInCall = true,
}) {
  return (
    <div className="control-bar">
      <button
        type="button"
        className={`control-btn ${!micEnabled ? "off" : ""}`}
        onClick={onToggleMic}
        title={micEnabled ? "Mute" : "Unmute"}
        aria-label={micEnabled ? "Mute microphone" : "Unmute microphone"}
        aria-pressed={!micEnabled ? "true" : "false"}
      >
        {micEnabled ? <FiMic /> : <FiMicOff />}
      </button>
      <button
        type="button"
        className={`control-btn ${!cameraEnabled ? "off" : ""}`}
        onClick={onToggleCamera}
        title={cameraEnabled ? "Turn off camera" : "Turn on camera"}
        aria-label={cameraEnabled ? "Turn off camera" : "Turn on camera"}
        aria-pressed={!cameraEnabled ? "true" : "false"}
      >
        {cameraEnabled ? <FiVideo /> : <FiVideoOff />}
      </button>
      <button type="button" className="control-btn" onClick={onOptions} title="More options" aria-label="More options">
        <FiMoreHorizontal />
      </button>
      {!isInCall ? (
        <button type="button" className="join-btn" onClick={onJoinRoom}>
          <FiPhone /> Join Room
        </button>
      ) : (
        <button type="button" className="end-call-btn" onClick={onEndCall} aria-label="End call">
          <FiPhoneOff /> End Call
        </button>
      )}
    </div>
  );
}

export default ControlBar;
