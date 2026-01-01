import { io } from "https://cdn.socket.io/4.7.2/socket.io.esm.min.js";

// Use the current host or fallback to localhost for development
const serverUrl =
  window.location.hostname === "localhost"
    ? "http://localhost:3000"
    : `http://${window.location.hostname}:3000`;

export const socket = io(serverUrl);

export function joinRoom(roomId) {
  socket.emit("join-room", roomId);
}
