import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import fs from "fs";
import path from "path";

// Set up the path to the external certs directory
const certsPath = path.resolve(__dirname, "../ssl_certs");

export default defineConfig({
  plugins: [react()],
  server: {
    https: {
      key: fs.readFileSync(path.join(certsPath, "private.key")),
      cert: fs.readFileSync(path.join(certsPath, "certificate.crt")),
    },
    host: "192.168.212.126",
  },
});
