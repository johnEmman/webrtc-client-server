import { Routes, Route, Link, Router } from "react-router-dom";
// import UserNamePage from "./pages/UserNamePage";
import AudioCall from "./pages/AudioCall";
import VideoCall from "./pages/VideoCall";
// import WebRTCApp from "./pages/WebRTCApp";
// import PeerConnection from "./components/PeerConnection";

function App() {
  return (
    <div>
      Hello, World!
      {/* <WebRTCApp /> */}
      {/* <AudioCall/> */}
      <VideoCall/>
      {/* <Routes>
        <Route path="/" element={<UserNamePage />} />
      </Routes> */}
      {/* <PeerConnection /> */}
    </div>
  );
}

export default App;
