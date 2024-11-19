import { Socket, io } from 'socket.io-client';

export const socket: Socket = io('https://192.168.212.126:8443');
 // Connect to your signaling server

export const setupWebRTC = (
//   socket: SocketIOClient.Socket,
  setPeerConnection: React.Dispatch<React.SetStateAction<RTCPeerConnection | null>>,
  setLocalStream: React.Dispatch<React.SetStateAction<MediaStream | null>>,
  setRemoteStream: React.Dispatch<React.SetStateAction<MediaStream | null>>,
  roomCode: string
) => {
  const peerConnection = new RTCPeerConnection({
    iceServers: [
      {
        urls: 'stun:stun.l.google.com:19302', // Google's public STUN server
      },
    ],
  });

  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit('webrtc-signal', {
        type: 'ice-candidate',
        candidate: event.candidate,
        roomCode,
      });
    }
  };

  peerConnection.ontrack = (event) => {
    const [stream] = event.streams;
    setRemoteStream(stream);
  };

  setPeerConnection(peerConnection);

  // Listen for incoming signaling messages
  socket.on('webrtc-signal', async (data : any) => {
    const { type, sdp, candidate, senderId } = data;

    if (type === 'offer') {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(sdp));
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      socket.emit('webrtc-signal', { type: 'answer', sdp: answer, roomCode });
    } else if (type === 'answer') {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(sdp));
    } else if (type === 'ice-candidate' && candidate) {
      await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    }
  });

  return peerConnection;
};
