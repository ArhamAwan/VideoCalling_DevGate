import express from "express";
import http from "http";
import { Server } from "socket.io";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import os from "os";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const PORT = process.env.PORT || 3000;

// Serve static files from frontend directory (or dist if built)
const frontendPath = path.join(__dirname, "../dist");
const fallbackPath = path.join(__dirname, "../frontend");

if (fs.existsSync(frontendPath)) {
  app.use(express.static(frontendPath));
} else {
  app.use(express.static(fallbackPath));
}

// Store rooms and users
const rooms = new Map();

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join-room", (roomId) => {
    console.log(`User ${socket.id} joining room: ${roomId}`);

    // Leave any previous rooms
    socket.rooms.forEach((room) => {
      if (room !== socket.id) {
        socket.leave(room);
      }
    });

    // Join the new room
    socket.join(roomId);

    // Initialize room if it doesn't exist
    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Set());
    }

    const room = rooms.get(roomId);
    room.add(socket.id);

    // Notify others in the room
    socket.to(roomId).emit("user-joined", socket.id);

    // Send current room users to the new user
    const otherUsers = Array.from(room).filter((id) => id !== socket.id);
    socket.emit("room-users", otherUsers);

    console.log(`Room ${roomId} now has ${room.size} users`);
  });

  socket.on("signal", (data) => {
    if (data.to) {
      socket.to(data.to).emit("signal", {
        ...data,
        from: socket.id,
      });
    } else {
      socket.rooms.forEach((room) => {
        if (room !== socket.id) {
          socket.to(room).emit("signal", {
            ...data,
            from: socket.id,
          });
        }
      });
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);

    // Remove user from all rooms
    rooms.forEach((users, roomId) => {
      if (users.has(socket.id)) {
        users.delete(socket.id);

        // Notify others in the room
        socket.to(roomId).emit("user-left", socket.id);

        // Clean up empty rooms
        if (users.size === 0) {
          rooms.delete(roomId);
          console.log(`Room ${roomId} deleted (empty)`);
        } else {
          console.log(`Room ${roomId} now has ${users.size} users`);
        }
      }
    });
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log("WebRTC signaling server ready");

  // Show network IP addresses
  const networkInterfaces = os.networkInterfaces();

  console.log("\nAvailable on your network:");
  Object.keys(networkInterfaces).forEach((interfaceName) => {
    networkInterfaces[interfaceName].forEach((iface) => {
      if (iface.family === "IPv4" && !iface.internal) {
        console.log(`  http://${iface.address}:${PORT}`);
      }
    });
  });
});
