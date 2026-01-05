import React, { useState } from "react";

function Header({ roomId }) {
  const [copied, setCopied] = useState(false);

  const getCurrentDate = () => {
    const now = new Date();
    const options = { month: "long", day: "numeric", year: "numeric" };
    const timeOptions = { hour: "2-digit", minute: "2-digit" };
    return `${now.toLocaleDateString("en-US", options)} | ${now.toLocaleTimeString("en-US", timeOptions)}`;
  };

  const copyRoomId = () => {
    if (roomId) {
      navigator.clipboard.writeText(roomId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <header className="call-header">
      <div className="header-left">
        <div className="meeting-info">
          <span className="meeting-icon"></span>
        </div>
        <div className="meeting-date">{getCurrentDate()}</div>
      </div>
      {roomId && (
        <div className="header-right">
          <div className="room-id-header">
            <span className="room-id-label">Room ID:</span>
            <input
              type="text"
              value={roomId}
              readOnly
              className="room-id-value"
            />
            <button
              onClick={copyRoomId}
              className="copy-room-id-btn"
              title="Copy Room ID"
            >
              {copied ? "✓ Copied" : "Copy"}
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

export default Header;

