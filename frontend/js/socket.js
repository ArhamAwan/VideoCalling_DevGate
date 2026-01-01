import { io } from "https://cdn.socket.io/4.7.2/socket.io.esm.min.js";

// Detect if we're on HTTPS and adjust the socket URL accordingly
const protocol = window.location.protocol === "https:" ? "https" : "http";
const port = window.location.protocol === "https:" ? "3443" : "3000";

const serverUrl =
  window.location.hostname === "localhost"
    ? `${protocol}://localhost:${port}`
    : `${protocol}://${window.location.hostname}:${port}`;

export const socket = io(serverUrl);

export function joinRoom(roomId) {
  socket.emit("join-room", roomId);
}
