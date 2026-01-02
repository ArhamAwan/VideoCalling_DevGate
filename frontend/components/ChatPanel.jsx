import React, { useState, useRef, useEffect } from "react";

function ChatPanel({ messages, onSendMessage }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [messageText, setMessageText] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const getInitials = (name) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const handleSend = () => {
    if (messageText.trim()) {
      onSendMessage(messageText);
      setMessageText("");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="chat-panel">
      <div className="panel-header" onClick={() => setIsExpanded(!isExpanded)}>
        <h3>Chats</h3>
        <span className={`caret ${isExpanded ? "up" : "down"}`}>▼</span>
      </div>
      {isExpanded && (
        <div className="panel-content chat-content">
          <div className="chat-messages">
            {messages.map((msg, index) => (
              <div key={index} className="chat-message">
                <div className="message-header">
                  <div className="message-avatar">
                    {getInitials(msg.author)}
                  </div>
                  <div className="message-info">
                    <span className="message-author">{msg.author}</span>
                    <span className="message-time">{msg.time}</span>
                  </div>
                </div>
                <div className="message-text">{msg.text}</div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <div className="chat-input-container">
            <input
              type="text"
              className="chat-input"
              placeholder="Type Something..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <button className="chat-send-btn" onClick={handleSend}>
              ✈️
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatPanel;

