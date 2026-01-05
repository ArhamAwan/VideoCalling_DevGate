import React, { useMemo } from "react";

const AvatarPlaceholder = ({ name, size = 40, fontSize, className = "" }) => {
  const initials = useMemo(() => {
    if (!name) return "?";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (
      parts[0].charAt(0) + parts[parts.length - 1].charAt(0)
    ).toUpperCase();
  }, [name]);

  const backgroundColor = useMemo(() => {
    if (!name) return "#6b7280";
    const colors = [
      "#EF4444", // Red
      "#F59E0B", // Amber
      "#10B981", // Emerald
      "#3B82F6", // Blue
      "#6366F1", // Indigo
      "#8B5CF6", // Violet
      "#EC4899", // Pink
      "#F97316", // Orange
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }, [name]);

  const style = {
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: "50%",
    backgroundColor,
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: fontSize ? `${fontSize}px` : `${size * 0.4}px`,
    fontWeight: "600",
    userSelect: "none",
  };

  return (
    <div
      className={`avatar-placeholder ${className}`}
      style={style}
      title={name}
    >
      {initials}
    </div>
  );
};

export default AvatarPlaceholder;
