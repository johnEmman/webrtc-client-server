// peerSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

// Define the state type
interface PeerState {
  localStream: MediaStream | null;
  peerConnection: RTCPeerConnection | null;
  remoteStream: MediaStream | null;
}

const initialState: PeerState = {
  localStream: null,
  peerConnection: null,
  remoteStream: null,
};

// Create the slice
const peerSlice = createSlice({
  name: "peer",
  initialState,
  reducers: {
    setLocalStream: (state, action: PayloadAction<MediaStream>) => {
      state.localStream = action.payload;
    },
    setPeerConnection: (state, action: PayloadAction<RTCPeerConnection>) => {
      state.peerConnection = action.payload;
    },
    setRemoteStream: (state, action: PayloadAction<MediaStream>) => {
      state.remoteStream = action.payload;
    },
  },
});

// Export actions and reducer
export const { setLocalStream, setPeerConnection, setRemoteStream } =
  peerSlice.actions;
export default peerSlice.reducer;
