import { Routes, Route, Link, Router } from "react-router-dom";
import UserNamePage from "./pages/UserNamePage";
import WebRTCApp from "./pages/WebRTCApp";
// import PeerConnection from "./components/PeerConnection";

function App() {
  return (
    <div>
      Hello, World!
      <WebRTCApp />
      {/* <Routes>
        <Route path="/" element={<UserNamePage />} />
      </Routes> */}
      {/* <PeerConnection /> */}
    </div>
  );
}

export default App;
