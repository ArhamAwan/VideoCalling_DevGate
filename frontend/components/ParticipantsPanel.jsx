import React, { useState } from "react";

function ParticipantsPanel({ participants }) {
  const [isExpanded, setIsExpanded] = useState(true);

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
      <div className="panel-header" onClick={() => setIsExpanded(!isExpanded)}>
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
                  <span className="status-icon mic-on" title="Microphone on">🎤</span>
                ) : (
                  <span className="status-icon mic-off" title="Microphone off">🔇</span>
                )}
                {participant.cameraEnabled ? (
                  <span className="status-icon camera-on" title="Camera on">📹</span>
                ) : (
                  <span className="status-icon camera-off" title="Camera off">📷</span>
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

