import React, { useState, useEffect } from "react";
import { FiMic, FiMicOff, FiVideo, FiVideoOff } from "react-icons/fi";

function ParticipantsPanel({ participants }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [userManuallyToggled, setUserManuallyToggled] = useState(false);

  // Auto-collapse when there are multiple participants (2+)
  useEffect(() => {
    if (!userManuallyToggled && participants.length > 1) {
      setIsExpanded(false);
    } else if (!userManuallyToggled && participants.length === 1) {
      setIsExpanded(true);
    }
  }, [participants.length, userManuallyToggled]);

  const handleToggle = () => {
    setUserManuallyToggled(true);
    setIsExpanded(!isExpanded);
  };

  const getInitials = (name) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="participants-panel">
      <div className="panel-header" onClick={handleToggle}>
        <h3>Participants</h3>
        <span className={`caret ${isExpanded ? "up" : "down"}`}>▼</span>
      </div>
      {isExpanded && (
        <div className="panel-content">
          {participants.map((participant) => (
            <div key={participant.id} className="participant-item">
              <div className="participant-avatar">
                {getInitials(participant.name)}
              </div>
              <div className="participant-info">
                <span className="participant-name">{participant.name}</span>
              </div>
              <div className="participant-status">
                {participant.micEnabled ? (
                  <span className="status-icon mic-on" title="Microphone on" aria-label="Microphone on"><FiMic /></span>
                ) : (
                  <span className="status-icon mic-off" title="Microphone off" aria-label="Microphone off"><FiMicOff /></span>
                )}
                {participant.cameraEnabled ? (
                  <span className="status-icon camera-on" title="Camera on" aria-label="Camera on"><FiVideo /></span>
                ) : (
                  <span className="status-icon camera-off" title="Camera off" aria-label="Camera off"><FiVideoOff /></span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ParticipantsPanel;

