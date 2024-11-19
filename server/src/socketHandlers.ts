import { Server, Socket } from "socket.io";

const rooms = new Map<string, Set<string>>();

const generateRoomCode = (): string => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

const handleCreateRoom = (socket: Socket) => {
  const roomCode = generateRoomCode();
  socket.join(roomCode);
  rooms.set(roomCode, new Set([socket.id]));
  socket.emit("room-created", roomCode);
  console.log(`Room created: ${roomCode}`);
};

const handleJoinRoom = (socket: Socket, roomCode: string) => {
  const room = rooms.get(roomCode);
  if (room) {
    socket.join(roomCode);
    room.add(socket.id);
    socket.to(roomCode).emit("participant-joined", socket.id);
    socket.emit("room-joined", roomCode);
    console.log(`User ${socket.id} joined room ${roomCode}`);
  } else {
    socket.emit("room-error", "Room does not exist");
  }
};

const handleWebRTCSignal = (socket: Socket, data: any) => {
  console.log("WebRTC Signal:", data.type);
  socket.to(data.roomCode).emit("webrtc-signal", {
    ...data,
    senderId: socket.id,
  });
};

const handleDisconnecting = (socket: Socket) => {
  socket.rooms.forEach((roomCode) => {
    const room = rooms.get(roomCode);
    if (room) {
      room.delete(socket.id);
      socket.to(roomCode).emit("participant-left", socket.id);
    }
  });
};

export const setupSocketHandlers = (io: Server) => {
  io.on("connection", (socket) => {
    console.log("New client connected:", socket.id);

    socket.on("create-room", () => handleCreateRoom(socket));
    socket.on("join-room", (roomCode) => handleJoinRoom(socket, roomCode));
    socket.on("webrtc-signal", (data) => handleWebRTCSignal(socket, data));
    socket.on("disconnecting", () => handleDisconnecting(socket));
  });
};