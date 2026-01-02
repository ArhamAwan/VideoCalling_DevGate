import express from "express";
import https from "https";
import fs from "fs";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";
import selfsigned from "selfsigned";
import os from "os";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Create self-signed certificate (for development only)
const attrs = [{ name: "commonName", value: "localhost" }];
const pems = selfsigned.generate(attrs, { days: 365 });

const server = https.createServer(
  {
    key: pems.private,
    cert: pems.cert,
  },
  app
);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const PORT = process.env.PORT || 3443;

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
// Store user names: socketId -> userName
const userNames = new Map();

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Check if room exists
  socket.on("check-room-exists", (roomId, callback) => {
    try {
      const exists = rooms.has(roomId);
      if (typeof callback === "function") {
        callback({ exists });
      } else {
        socket.emit("room-exists-response", { roomId, exists });
      }
    } catch (error) {
      console.error(`Error in check-room-exists handler for ${socket.id}:`, error);
      if (typeof callback === "function") {
        callback({ exists: false });
      }
    }
  });

  socket.on("join-room", (data) => {
    try {
      // Support both old format (string) and new format (object)
      const roomId = typeof data === "string" ? data : data?.roomId;
      const userName = typeof data === "string" ? null : data?.userName;

      if (!roomId) {
        console.error(`Invalid join-room data from ${socket.id}:`, data);
        socket.emit("error", { message: "Invalid room ID" });
        return;
      }

      console.log(`User ${socket.id} joining room: ${roomId}${userName ? ` as ${userName}` : ""}`);

      // Validate room exists (for joining, not creating)
      if (!rooms.has(roomId)) {
        socket.emit("room-not-found", { roomId });
        return;
      }

      // Store user name
      if (userName) {
        userNames.set(socket.id, userName);
      }

      // Leave any previous rooms
      Array.from(socket.rooms).forEach((room) => {
        if (room !== socket.id) {
          socket.leave(room);
        }
      });

      // Join the new room
      socket.join(roomId);

      const room = rooms.get(roomId);
      if (room) {
        room.add(socket.id);

        // Notify others in the room
        socket.to(roomId).emit("user-joined", { id: socket.id, name: userName || userNames.get(socket.id) });

        // Send current room users with names to the new user
        const otherUsers = Array.from(room)
          .filter((id) => id !== socket.id)
          .map((id) => ({
            id,
            name: userNames.get(id) || `User ${id.substring(0, 8)}`,
          }));
        socket.emit("room-users", otherUsers);

        console.log(`Room ${roomId} now has ${room.size} users`);
      }
    } catch (error) {
      console.error(`Error in join-room handler for ${socket.id}:`, error);
      socket.emit("error", { message: "Failed to join room" });
    }
  });

  // Create room (called when user creates a new call)
  socket.on("create-room", (data) => {
    try {
      const roomId = data?.roomId;
      const userName = data?.userName;

      if (!roomId) {
        console.error(`Invalid create-room data from ${socket.id}:`, data);
        socket.emit("error", { message: "Invalid room ID" });
        return;
      }

      console.log(`User ${socket.id} creating room: ${roomId} as ${userName}`);

      // Store user name
      if (userName) {
        userNames.set(socket.id, userName);
      }

      // Leave any previous rooms
      Array.from(socket.rooms).forEach((room) => {
        if (room !== socket.id) {
          socket.leave(room);
        }
      });

      // Create and join the new room
      if (!rooms.has(roomId)) {
        rooms.set(roomId, new Set());
      }

      const room = rooms.get(roomId);
      room.add(socket.id);
      socket.join(roomId);

      // Send room-users event (empty array since they're alone)
      socket.emit("room-users", []);

      // Send confirmation
      socket.emit("room-created", { roomId });

      console.log(`Room ${roomId} created with ${room.size} users`);
    } catch (error) {
      console.error(`Error in create-room handler for ${socket.id}:`, error);
      socket.emit("error", { message: "Failed to create room" });
    }
  });

  socket.on("signal", (data) => {
    try {
      if (data?.to) {
        socket.to(data.to).emit("signal", {
          ...data,
          from: socket.id,
        });
      } else {
        Array.from(socket.rooms).forEach((room) => {
          if (room !== socket.id) {
            socket.to(room).emit("signal", {
              ...data,
              from: socket.id,
            });
          }
        });
      }
    } catch (error) {
      console.error(`Error in signal handler for ${socket.id}:`, error);
    }
  });

  socket.on("disconnect", () => {
    try {
      console.log("User disconnected:", socket.id);

      // Remove user name
      userNames.delete(socket.id);

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
    } catch (error) {
      console.error(`Error in disconnect handler for ${socket.id}:`, error);
    }
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
  const networkInterfaces = os.networkInterfaces();

  console.log("\nAvailable on your network:");
  Object.keys(networkInterfaces).forEach((interfaceName) => {
    networkInterfaces[interfaceName].forEach((iface) => {
      if (iface.family === "IPv4" && !iface.internal) {
        console.log(`  https://${iface.address}:${PORT}`);
      }
    });
  });
});
