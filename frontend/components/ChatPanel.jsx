import React, { useState, useRef, useEffect } from "react";

function ChatPanel({ messages, onSendMessage }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [messageText, setMessageText] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);



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
                  <span className="message-author">{msg.author}</span>
                </div>
                <div className="message-content-wrapper">
                  <div className="message-bubble">{msg.text}</div>
                  <span className="message-time">{msg.time}</span>
                </div>
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
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22 2L11 13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatPanel;

