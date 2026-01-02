const express = require("express");
const https = require("https");
const fs = require("fs");
const socketIo = require("socket.io");
const path = require("path");

const app = express();

// Create self-signed certificate (for development only)
const selfsigned = require("selfsigned");
const attrs = [{ name: "commonName", value: "localhost" }];
const pems = selfsigned.generate(attrs, { days: 365 });

const server = https.createServer(
  {
    key: pems.private,
    cert: pems.cert,
  },
  app
);

const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const PORT = process.env.PORT || 3443;

// Serve static files from frontend directory
app.use(express.static(path.join(__dirname, "../frontend")));

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
    // Handle targeted signaling (to specific user) or broadcast to room
    if (data.to) {
      // Send to specific user
      socket.to(data.to).emit("signal", {
        ...data,
        from: socket.id,
      });
    } else {
      // Broadcast to all users in the same room (legacy support)
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
  console.log(`HTTPS Server running on https://localhost:${PORT}`);
  console.log(`Network access: https://[YOUR_IP]:${PORT}`);
  console.log("WebRTC signaling server ready (HTTPS)");
  console.log(
    "⚠️  You will need to accept the self-signed certificate warning"
  );

  // Try to show the actual network IP
  const os = require("os");
  const networkInterfaces = os.networkInterfaces();

  console.log("\nAvailable on your network:");
  Object.keys(networkInterfaces).forEach((interfaceName) => {
    networkInterfaces[interfaceName].forEach((interface) => {
      if (interface.family === "IPv4" && !interface.internal) {
        console.log(`  https://${interface.address}:${PORT}`);
      }
    });
  });
});
