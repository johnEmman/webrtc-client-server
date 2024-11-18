import React, { useState, useEffect, useRef, useCallback } from "react";
import io from "socket.io-client";

const WebRTCApp: React.FC = () => {
  const [socket, setSocket] = useState<any>(null);
  const [roomCode, setRoomCode] = useState("");
  const [roomInput, setRoomInput] = useState("");

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  // Create peer connection function
  const createPeerConnection = useCallback(() => {
    const configuration = {
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
      ],
    };

    const pc = new RTCPeerConnection(configuration);
    console.log("Peer connection created:", pc);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("ICE Candidate:", event.candidate);
        socket.emit("webrtc-signal", {
          type: "ice-candidate",
          candidate: event.candidate,
          roomCode: roomCode,
        });
      } else {
        console.log("ICE gathering complete.");
      }
    };

    pc.ontrack = (event) => {
      console.log("Track received:", event);
      if (event.streams && event.streams[0]) {
        const remoteStream = event.streams[0];
        console.log("Remote stream received:", remoteStream);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
        }
      } else {
        console.error("No streams found in ontrack event.");
      }
    };
    return pc;
  }, [socket, roomCode]);

  // Memoize the setupWebRTC function to prevent unnecessary re-renders
  const setupWebRTC = useCallback(async () => {
    try {
      console.log("Setting up WebRTC...");

      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      console.log("User media obtained:", stream);

      // Store local stream
      localStreamRef.current = stream;

      // Set local video
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        console.log("Local video set.");
      } else {
        console.error("Local video element not found.");
      }

      // Create peer connection
      const peerConnection = createPeerConnection();

      // Add tracks to peer connection
      stream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, stream);
        console.log("Added track to peer connection:", track);
      });
      peerConnectionRef.current = peerConnection;
    } catch (error) {
      console.error("WebRTC Setup Error:", error);
    }
  }, [createPeerConnection]);

  // Initialize socket and WebRTC
  useEffect(() => {
    if (!socket) {
      const newSocket = io("https://192.168.1.20:8443");
      setSocket(newSocket);
      console.log("Socket initialized:", newSocket);
    }

    if (socket) {
      socket.on("room-created", (code: string) => {
        console.log("Room created with code:", code);
        setRoomCode(code);
        setupWebRTC();
      });

      socket.on("room-joined", (code: string) => {
        console.log("Joined room with code:", code);
        setRoomCode(code);
        setupWebRTC();
      });

      socket.on("participant-joined", async () => {
        console.log("Participant joined.");
        if (peerConnectionRef.current) {
          const offer = await peerConnectionRef.current.createOffer();
          console.log("Offer created:", offer);
          await peerConnectionRef.current.setLocalDescription(offer);

          socket.emit("webrtc-signal", {
            type: "offer",
            offer,
            roomCode,
          });
        }
      });

      socket.on(
        "webrtc-signal",
        async (data: {
          type: string;
          offer: RTCSessionDescriptionInit;
          answer: RTCSessionDescriptionInit;
          candidate: RTCIceCandidateInit | undefined;
        }) => {
          console.log("WebRTC signal received:", data);
          const pc = peerConnectionRef.current;
          if (!pc) return;

          try {
            if (data.type === "offer") {
              await pc.setRemoteDescription(
                new RTCSessionDescription(data.offer)
              );
              console.log("Remote offer set.");
              const answer = await pc.createAnswer();
              console.log("Answer created:", answer);
              await pc.setLocalDescription(answer);

              socket.emit("webrtc-signal", {
                type: "answer",
                answer,
                roomCode,
              });
            } else if (data.type === "answer") {
              await pc.setRemoteDescription(
                new RTCSessionDescription(data.answer)
              );
              console.log("Remote answer set.");
            } else if (data.type === "ice-candidate" && data.candidate) {
              await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
              console.log("ICE candidate added.");
            }
          } catch (error) {
            console.error("WebRTC Signal Error:", error);
          }
        }
      );
    }

    return () => {
      socket?.disconnect();
      console.log("Socket disconnected.");
    };
  }, [socket, setupWebRTC, roomCode]);

  // Room creation and joining
  const createRoom = () => {
    console.log("Creating room...");
    socket?.emit("create-room");
  };

  const joinRoom = () => {
    if (roomInput) {
      console.log("Joining room with code:", roomInput);
      socket?.emit("join-room", roomInput);
    } else {
      console.error("Room code is required to join.");
    }
  };

  return (
    <div>
      {!roomCode ? (
        <div>
          <button onClick={createRoom}>Create Room</button>
          <input
            type="text"
            value={roomInput}
            onChange={(e) => setRoomInput(e.target.value)}
            placeholder="Enter Room Code"
          />
          <button onClick={joinRoom}>Join Room</button>
        </div>
      ) : (
        <div>
          <h2>Room: {roomCode}</h2>
          <div style={{ display: "flex", gap: "20px" }}>
            <div>
              <h3>Local Video</h3>
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                style={{
                  width: "400px",
                  height: "300px",
                  background: "black",
                  border: "2px solid #ccc",
                }}
              />
            </div>
            <div>
              <h3>Remote Video</h3>
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                style={{
                  width: "400px",
                  height: "300px",
                  background: "black",
                  border: "2px solid #ccc",
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WebRTCApp;
