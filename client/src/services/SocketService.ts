import { io, Socket } from "socket.io-client";

class SocketService {
  socket: Socket;

  constructor() {
    this.socket = io("https://192.168.1.20:443"); // Backend WebSocket URL
  }

  // Emit signaling data to backend (e.g., sending offer, answer, or candidate)
  sendSignal(data: any) {
    this.socket.emit("signal", data);
  }

  // Listen for incoming signals (offer, answer, candidates)
  onSignal(callback: (data: any) => void) {
    this.socket.on("signal", callback);
  }

  // Emit ICE candidates to backend
  sendCandidate(candidate: RTCIceCandidate) {
    this.socket.emit("candidate", candidate);
  }

  // Listen for incoming ICE candidates
  onCandidate(callback: (candidate: RTCIceCandidate) => void) {
    this.socket.on("candidate", callback);
  }

  // Clean up socket listeners when component unmounts
  cleanup() {
    this.socket.off("signal");
    this.socket.off("candidate");
  }
}

const socketService = new SocketService();
export default socketService;
