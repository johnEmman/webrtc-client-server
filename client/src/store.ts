import { configureStore } from "@reduxjs/toolkit";
import peerReducer from "./features/peerSlice";

export const store = configureStore({
  reducer: {
    peer: peerReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
