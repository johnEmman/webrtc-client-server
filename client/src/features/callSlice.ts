import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface CallState {
    roomId: string | null;
    localStreamId: string | null; // Storing stream ID
    remoteStreamId: string | null;
  }
  
  const initialState: CallState = {
    roomId: null,
    localStreamId: null,
    remoteStreamId: null,
  };
  
  const callSlice = createSlice({
    name: "call",
    initialState,
    reducers: {
      setRoomId(state, action: PayloadAction<string | null>) {
        state.roomId = action.payload;
      },
      setLocalStreamId(state, action: PayloadAction<string | null>) {
        state.localStreamId = action.payload;
      },
      setRemoteStreamId(state, action: PayloadAction<string | null>) {
        state.remoteStreamId = action.payload;
      },
      resetCall(state) {
        state.roomId = null;
        state.localStreamId = null;
        state.remoteStreamId = null;
      },
    },
  });
  
  export const { setRoomId, setLocalStreamId, setRemoteStreamId, resetCall } = callSlice.actions;
  export default callSlice.reducer;
  