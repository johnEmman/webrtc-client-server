import { io, Socket } from "socket.io-client";

const SERVER_URL = "https://192.168.212.126:4000";
let socket: Socket | null = null;
let peerConnection: RTCPeerConnection | null = null;

export const initSocket = () => {
  if (!socket) {
    socket = io(SERVER_URL);
  }
  return socket;
};

export const createPeerConnection = (
  localStream: MediaStream,
  onRemoteStream: (stream: MediaStream) => void
) => {
  peerConnection = new RTCPeerConnection();

  // Add local tracks to peer connection
  localStream.getTracks().forEach((track) => peerConnection?.addTrack(track, localStream));

  // Handle incoming remote stream
  peerConnection.ontrack = (event) => {
    if (event.streams[0]) {
      onRemoteStream(event.streams[0]);
    }
  };

  // ICE candidate handling
  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      socket?.emit("iceCandidate", { candidate: event.candidate });
    }
  };

  return peerConnection;
};

export const handleCallOffer = async (offer: RTCSessionDescriptionInit, roomId: string) => {
  if (!peerConnection) return;

  await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  socket?.emit("callAnswer", { answer, roomId });
};

export const handleCallAnswer = async (answer: RTCSessionDescriptionInit) => {
  if (peerConnection) {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
  }
};

export const addIceCandidate = (candidate: RTCIceCandidateInit) => {
  if (peerConnection) {
    peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
  }
};

export const startCall = async (roomId: string, localStream: MediaStream) => {
  if (!peerConnection) return;

  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  socket?.emit("callOffer", { offer, roomId });
};

export const cleanup = () => {
  peerConnection?.close();
  peerConnection = null;
  socket?.disconnect();
  socket = null;
};
