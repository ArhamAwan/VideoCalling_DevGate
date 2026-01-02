import React from "react";

function Header() {
  const getCurrentDate = () => {
    const now = new Date();
    const options = { month: "long", day: "numeric", year: "numeric" };
    const timeOptions = { hour: "2-digit", minute: "2-digit" };
    return `${now.toLocaleDateString("en-US", options)} | ${now.toLocaleTimeString("en-US", timeOptions)}`;
  };

  return (
    <header className="call-header">
      <div className="header-left">
        <div className="meeting-info">
          <span className="meeting-icon">📹</span>
          <span className="meeting-title">[Internal] Weekly Report Marketing + Sales</span>
        </div>
        <div className="meeting-date">{getCurrentDate()}</div>
      </div>
    </header>
  );
}

export default Header;

