import { useEffect, useRef, useState } from "react";
import io, { Socket } from "socket.io-client";

const SERVER_URL = "https://192.168.212.126:4000"; // Update with your server URL

export default function VideoCall() {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [inCall, setInCall] = useState(false); // Track if the user is in a call

  const userVideo = useRef<HTMLVideoElement>(null);
  const remoteVideo = useRef<HTMLVideoElement>(null);

  const socketRef = useRef<Socket | null>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);

  useEffect(() => {
    socketRef.current = io(SERVER_URL);

    socketRef.current.on("callOffer", async (offer) => {
      await peerRef.current?.setRemoteDescription(offer);
      const answer = await peerRef.current?.createAnswer();
      await peerRef.current?.setLocalDescription(answer);
      socketRef.current?.emit("callAnswer", { answer, roomId });
    });

    socketRef.current.on("callAnswer", async (answer) => {
      await peerRef.current?.setRemoteDescription(answer);
    });

    socketRef.current.on("iceCandidate", (candidate) => {
      peerRef.current?.addIceCandidate(new RTCIceCandidate(candidate));
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [roomId]);

  const setupPeerConnection = (stream: MediaStream) => {
    const peer = new RTCPeerConnection();
    stream.getTracks().forEach((track) => peer.addTrack(track, stream));

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current?.emit("iceCandidate", { candidate: event.candidate, roomId });
      }
    };

    peer.ontrack = (event) => {
      if (remoteVideo.current) {
        remoteVideo.current.srcObject = event.streams[0];
      }
    };

    return peer;
  };

  const createRoom = () => {
    const id = `room-${Math.random().toString(36).substr(2, 9)}`;
    setRoomId(id);
    socketRef.current?.emit("createRoom", id);
  };

  const joinRoom = () => {
    socketRef.current?.emit("joinRoom", roomId);
  };

  const startCall = async () => {
    const localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    setStream(localStream);
    setInCall(true); // Set the user to "in call" state

    if (userVideo.current) {
      userVideo.current.srcObject = localStream;
    }

    peerRef.current = setupPeerConnection(localStream);
    const offer = await peerRef.current.createOffer();
    await peerRef.current.setLocalDescription(offer);
    socketRef.current?.emit("callOffer", { offer, roomId });
  };

  const leaveCall = () => {
    // Stop local video and audio tracks
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    
    // Close peer connection
    if (peerRef.current) {
      peerRef.current.close();
    }

    // Disconnect from socket
    socketRef.current?.emit("leaveRoom", roomId);

    // Reset state
    setStream(null);
    setInCall(false);
  };

  return (
    <div className="flex flex-col items-center bg-gray-800 text-white min-h-screen py-10">
      <h2 className="text-3xl mb-6">Simple Video Call</h2>
      <div className="mb-4">
        <button className="bg-blue-500 text-white px-6 py-2 rounded-lg mr-2" onClick={createRoom}>
          Create Room
        </button>
        <input
          className="p-2 text-black rounded-lg"
          type="text"
          placeholder="Enter Room ID"
          value={roomId || ""}
          onChange={(e) => setRoomId(e.target.value)}
        />
        <button className="bg-green-500 text-white px-6 py-2 rounded-lg ml-2" onClick={joinRoom}>
          Join Room
        </button>
      </div>

      {inCall && (
        <button className="bg-red-500 text-white px-6 py-2 rounded-lg mt-4" onClick={leaveCall}>
          Leave Room
        </button>
      )}

      <button className="bg-blue-500 text-white px-6 py-2 rounded-lg mt-4" onClick={startCall}>
        Start Call
      </button>

      <div className="flex justify-around mt-10 space-x-4">
        <div className="flex flex-col items-center">
          <h3>Your Video</h3>
          <video ref={userVideo} autoPlay muted className="w-64 h-48 bg-black rounded-lg" />
        </div>
        <div className="flex flex-col items-center">
          <h3>Remote Video</h3>
          <video ref={remoteVideo} autoPlay className="w-64 h-48 bg-black rounded-lg" />
        </div>
      </div>
    </div>
  );
}
