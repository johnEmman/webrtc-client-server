const express = require("express");
const https = require("https");
const fs = require("fs");
const socketIo = require("socket.io");
const path = require("path");

const app = express();

const sslOptions = {
  key: fs.readFileSync(path.resolve(__dirname, "../ssl_certs/private.key")),
  cert: fs.readFileSync(path.resolve(__dirname, "../ssl_certs/certificate.crt")),
};

const server = https.createServer(sslOptions, app);
const io = socketIo(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on("createRoom", (roomId) => {
    console.log(`Room created: ${roomId}`);
    socket.join(roomId);
  });

  socket.on("joinRoom", (roomId) => {
    console.log(`User joined room: ${roomId}`);
    socket.join(roomId);
  });

  socket.on("callOffer", ({ offer, roomId }) => {
    console.log(`Call offer sent to room: ${roomId}`);
    socket.to(roomId).emit("callOffer", offer);
  });

  socket.on("callAnswer", ({ answer, roomId }) => {
    console.log(`Call answer sent to room: ${roomId}`);
    socket.to(roomId).emit("callAnswer", answer);
  });

  socket.on("iceCandidate", ({ candidate, roomId }) => {
    console.log(`ICE Candidate sent to room: ${roomId}`);
    socket.to(roomId).emit("iceCandidate", candidate);
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

server.listen(4000, () => {
  console.log("Server running on https://localhost:4000");
});
