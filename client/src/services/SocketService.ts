import { useEffect, useState } from 'react';
import io, { Socket } from 'socket.io-client';

// Make sure the URL matches your backend server URL
const SERVER_URL = 'https://192.168.212.126:8443'; // or the appropriate URL for production

export const socket: Socket = io(SERVER_URL, {
  transports: ['websocket'],
  reconnection: true,
  reconnectionAttempts: 5,
});

export const SocketService = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [roomCode, setRoomCode] = useState<string | null>(null);

  useEffect(() => {
    // Initialize socket connection
    const socketInstance = io(SERVER_URL, {
      transports: ['websocket'],
      secure: true,  // For SSL/TLS support
      rejectUnauthorized: false, // Needed if using self-signed certificates
    });

    setSocket(socketInstance);

    socketInstance.on('connect', () => {
      setConnected(true);
      console.log('Connected to server');
    });

    socketInstance.on('disconnect', () => {
      setConnected(false);
      console.log('Disconnected from server');
    });

    // Listen for room creation event
    socketInstance.on('room-created', (roomCode: string) => {
      setRoomCode(roomCode);
      console.log('Room created:', roomCode);
    });

    // Listen for room join event
    socketInstance.on('room-joined', (roomCode: string) => {
      console.log('Joined room:', roomCode);
    });

    socketInstance.on('participant-joined', (participantId: string) => {
      console.log('Participant joined:', participantId);
    });

    socketInstance.on('participant-left', (participantId: string) => {
      console.log('Participant left:', participantId);
    });

    socketInstance.on('webrtc-signal', (data: any) => {
      console.log('WebRTC signal:', data);
    });

    // Cleanup socket connection on component unmount
    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const createRoom = () => {
    if (socket) {
      socket.emit('create-room');
    }
  };

  const joinRoom = (roomCode: string) => {
    if (socket) {
      socket.emit('join-room', roomCode);
    }
  };

  const sendWebRTCSignal = (data: any) => {
    if (socket) {
      socket.emit('webrtc-signal', data);
    }
  };

  return {
    socket,
    connected,
    roomCode,
    createRoom,
    joinRoom,
    sendWebRTCSignal,
  };
};
