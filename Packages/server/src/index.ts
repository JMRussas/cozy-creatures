// Cozy Creatures - Server Entry Point
//
// Express server with CORS. Socket.io will be added in Stage 2.
//
// Depends on: config.ts
// Used by:    pnpm dev:server

import express from "express";
import cors from "cors";
import { config } from "./config.js";

const app = express();

app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: Date.now() });
});

app.listen(config.port, () => {
  console.log(`[server] listening on http://localhost:${config.port}`);
});
