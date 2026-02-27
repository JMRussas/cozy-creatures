// Cozy Creatures - Vite Config
//
// Dev server config with proxy to backend and React plugin.
//
// Depends on: nothing
// Used by:    vite dev/build commands

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import basicSsl from "@vitejs/plugin-basic-ssl";

export default defineConfig({
  plugins: [react(), basicSsl()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
        xfwd: true,
      },
      "/socket.io": {
        target: "http://localhost:3001",
        changeOrigin: true,
        ws: true,
      },
      "/livekit": {
        target: "http://localhost:7880",
        ws: true,
        rewrite: (path) => path.replace(/^\/livekit/, ""),
      },
    },
  },
});
