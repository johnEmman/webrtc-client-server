import { useEffect, useRef, useState } from "react";
import io, { Socket } from "socket.io-client";

const SERVER_URL = "https://192.168.212.126:4000"; // Update with your server URL

export default function VideoCall() {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const userVideo = useRef<HTMLVideoElement>(null);
  const remoteVideo = useRef<HTMLVideoElement>(null);

  const socketRef = useRef<Socket | null>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);

  useEffect(() => {
    socketRef.current = io(SERVER_URL);

    socketRef.current.on("callOffer", async (offer) => {
      console.log("Received call offer:", offer);
      await peerRef.current?.setRemoteDescription(offer);
      const answer = await peerRef.current?.createAnswer();
      await peerRef.current?.setLocalDescription(answer);
      socketRef.current?.emit("callAnswer", { answer, roomId });
    });

    socketRef.current.on("callAnswer", async (answer) => {
      console.log("Received call answer:", answer);
      await peerRef.current?.setRemoteDescription(answer);
    });

    socketRef.current.on("iceCandidate", (candidate) => {
      console.log("Received ICE candidate:", candidate);
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
        console.log("Sending ICE candidate");
        socketRef.current?.emit("iceCandidate", { candidate: event.candidate, roomId });
      }
    };

    peer.ontrack = (event) => {
      console.log("Remote stream received");
      if (remoteVideo.current) {
        remoteVideo.current.srcObject = event.streams[0];
      }
    };

    return peer;
  };

  const createRoom = async () => {
    const id = `room-${Math.random().toString(36).substr(2, 9)}`;
    setRoomId(id);
    socketRef.current?.emit("createRoom", id);
    console.log("Room created:", id);
  };

  const joinRoom = async () => {
    socketRef.current?.emit("joinRoom", roomId);
    console.log("Joined room:", roomId);
  };

  const startCall = async () => {
    const localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    setStream(localStream);

    if (userVideo.current) {
      userVideo.current.srcObject = localStream;
    }

    peerRef.current = setupPeerConnection(localStream);
    const offer = await peerRef.current.createOffer();
    await peerRef.current.setLocalDescription(offer);
    socketRef.current?.emit("callOffer", { offer, roomId });
  };

  return (
    <div>
      <h2>Simple Video Call</h2>
      <div>
        <button style={styles.button} onClick={createRoom}>
          Create Room
        </button>
        <input
          style={styles.input}
          type="text"
          placeholder="Enter Room ID"
          value={roomId || ""}
          onChange={(e) => setRoomId(e.target.value)}
        />
        <button style={styles.button} onClick={joinRoom}>
          Join Room
        </button>
      </div>
      <button style={styles.button} onClick={startCall}>
        Start Call
      </button>
      <div style={styles.videoContainer}>
        <div>
          <h3>Your Video</h3>
          <video ref={userVideo} autoPlay muted style={styles.video} />
        </div>
        <div>
          <h3>Remote Video</h3>
          <video ref={remoteVideo} autoPlay style={styles.video} />
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { textAlign: "center", padding: "20px" },
  button: { padding: "10px 20px", margin: "10px" },
  input: { padding: "10px", margin: "10px" },
  videoContainer: { display: "flex", justifyContent: "space-around", margin: "20px" },
  video: { width: "300px", height: "200px", border: "1px solid #ddd" },
};
