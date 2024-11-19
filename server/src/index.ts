import express from "express";
import { createServer } from "https";
import { Server } from "socket.io";
import fs from "fs";
import path from "path";

const app = express();

const server = createServer(
  {
    key: fs.readFileSync(
      path.resolve(__dirname, "../../ssl_certs/private.key")
    ),
    cert: fs.readFileSync(
      path.resolve(__dirname, "../../ssl_certs/certificate.crt")
    ),
  },
  app
);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const rooms = new Map<string, Set<string>>();

io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  // Create room
  socket.on("create-room", () => {
    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    socket.join(roomCode);
    rooms.set(roomCode, new Set([socket.id]));
    socket.emit("room-created", roomCode);
    console.log(`Room created: ${roomCode}`);
  });

  // Join room
  socket.on("join-room", (roomCode) => {
    const room = rooms.get(roomCode);
    if (room) {
      socket.join(roomCode);
      room.add(socket.id);

      // Notify other participants
      socket.to(roomCode).emit("participant-joined", socket.id);
      socket.emit("room-joined", roomCode);
      console.log(`User ${socket.id} joined room ${roomCode}`);
    } else {
      socket.emit("room-error", "Room does not exist");
    }
  });

  // WebRTC signaling
  socket.on("webrtc-signal", (data) => {
    const { type, roomCode, senderId, sdp, candidate } = data;
  
    // Relay WebRTC signal to other participants in the room
    socket.to(roomCode).emit("webrtc-signal", {
      type,
      senderId,
      sdp,
      candidate,
    });
  
    console.log(`WebRTC Signal: ${type} sent in room ${roomCode}`);
  });

  // Handle disconnection
  socket.on("disconnecting", () => {
    socket.rooms.forEach((roomCode) => {
      const room = rooms.get(roomCode);
      if (room) {
        room.delete(socket.id);
        socket.to(roomCode).emit("participant-left", socket.id);
      }
    });
  });
});

const PORT = 8443;
server.listen(PORT, () => {
  console.log(`Signaling server running on port ${PORT}`);
});
