import React, { useState, useRef, useEffect } from "react";
import { FiChevronUp, FiSend } from "react-icons/fi";

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

  // Group consecutive messages from the same author
  const renderMessages = () => {
    return messages.map((msg, index) => {
      const prevMessage = index > 0 ? messages[index - 1] : null;
      const nextMessage = index < messages.length - 1 ? messages[index + 1] : null;
      const isFirstInGroup = !prevMessage || prevMessage.author !== msg.author;
      const isLastInGroup = !nextMessage || nextMessage.author !== msg.author;

      return (
        <div 
          key={index} 
          className={`chat-message-group ${isFirstInGroup ? 'first-in-group' : ''} ${isLastInGroup ? 'last-in-group' : ''}`}
        >
          {isFirstInGroup && (
            <div className="message-author-name">{msg.author}</div>
          )}
          <div className="message-bubble-wrapper">
            <div className="message-bubble">
              <span className="message-text">{msg.text}</span>
              <span className="message-timestamp">{msg.time}</span>
            </div>
          </div>
        </div>
      );
    });
  };

  return (
    <div className="chat-panel">
      <div className="panel-header" onClick={() => setIsExpanded(!isExpanded)}>
        <h3>Chats</h3>
        <FiChevronUp className={`caret ${isExpanded ? "up" : "down"}`} />
      </div>
      {isExpanded && (
        <div className="panel-content chat-content">
          <div className="chat-messages">
            {renderMessages()}
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
              <FiSend className="send-icon" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatPanel;

