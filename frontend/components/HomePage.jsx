import React, { useState } from "react";

function HomePage({ onCreateCall, onJoinCall, error }) {
  const [userName, setUserName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [showJoinInput, setShowJoinInput] = useState(false);
  const [generatedRoomId, setGeneratedRoomId] = useState("");
  const [roomCreated, setRoomCreated] = useState(false);

  const handleCreateCall = () => {
    if (!userName.trim()) {
      return;
    }
    const newRoomId = crypto.randomUUID();
    setGeneratedRoomId(newRoomId);
    setRoomCreated(true);
    // Don't navigate immediately - let user see the room ID first
  };

  const handleStartCall = () => {
    if (generatedRoomId && userName.trim()) {
      onCreateCall(userName, generatedRoomId);
    }
  };

  const handleJoinCall = () => {
    if (!userName.trim() || !roomId.trim()) {
      return;
    }
    onJoinCall(userName, roomId.trim());
  };

  const copyRoomId = () => {
    if (generatedRoomId) {
      navigator.clipboard.writeText(generatedRoomId);
      // You could add a toast notification here
    }
  };

  return (
    <div className="home-page">
      <div className="home-page-container">
        <div className="home-page-header">
          <h1>Video Call App</h1>
          <p>Enter your name to start or join a call</p>
        </div>

        <div className="home-page-form">
          <div className="form-group">
            <label htmlFor="userName">Your Name</label>
            <input
              type="text"
              id="userName"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Enter your name"
              className="form-input"
            />
          </div>

          {roomCreated && generatedRoomId && (
            <div className="room-id-display">
              <label>Room ID (Share this with others)</label>
              <div className="room-id-container">
                <input
                  type="text"
                  value={generatedRoomId}
                  readOnly
                  className="form-input room-id-input"
                />
                <button
                  onClick={copyRoomId}
                  className="copy-btn"
                  title="Copy Room ID"
                >
                  📋
                </button>
              </div>
              <p className="room-id-hint">Share this Room ID with others who want to join your call</p>
            </div>
          )}

          {showJoinInput && (
            <div className="form-group">
              <label htmlFor="roomId">Room ID</label>
              <input
                type="text"
                id="roomId"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                placeholder="Enter room ID to join"
                className="form-input"
              />
            </div>
          )}

          {error && <div className="error-message">{error}</div>}

          <div className="form-actions">
            {!roomCreated ? (
              <>
                <button
                  onClick={handleCreateCall}
                  className="btn btn-primary"
                  disabled={!userName.trim()}
                >
                  Create Call
                </button>
                <button
                  onClick={() => {
                    setShowJoinInput(!showJoinInput);
                    setRoomId("");
                    setGeneratedRoomId("");
                  }}
                  className="btn btn-secondary"
                  disabled={!userName.trim()}
                >
                  {showJoinInput ? "Cancel" : "Join Call"}
                </button>
                {showJoinInput && (
                  <button
                    onClick={handleJoinCall}
                    className="btn btn-primary"
                    disabled={!userName.trim() || !roomId.trim()}
                  >
                    Join
                  </button>
                )}
              </>
            ) : (
              <button
                onClick={handleStartCall}
                className="btn btn-primary"
              >
                Start Call
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;

