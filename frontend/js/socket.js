import { io } from "https://cdn.socket.io/4.7.2/socket.io.esm.min.js";

export const socket = io("http://localhost:3000");

export function joinRoom(roomId) {
  socket.emit("join-room", roomId);
}
