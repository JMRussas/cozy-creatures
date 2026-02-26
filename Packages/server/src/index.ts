// Cozy Creatures - Server Entry Point
//
// Express + Socket.io server. Handles HTTP routes and real-time connections.
//
// Depends on: config.ts, socket/connectionHandler.ts, rooms/RoomManager.ts
// Used by:    pnpm dev:server

import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from "@cozy/shared";
import { config } from "./config.js";
import { roomManager } from "./rooms/RoomManager.js";
import { registerConnectionHandler } from "./socket/connectionHandler.js";

const app = express();
const httpServer = createServer(app);

const io = new Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>(httpServer, {
  cors: {
    origin: config.corsOrigin,
    methods: ["GET", "POST"],
  },
  maxHttpBufferSize: config.maxHttpBufferSize,
});

app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: Date.now() });
});

// --- Connection rate limiting per IP ---
const connectionsPerIp = new Map<string, number>();

io.use((socket, next) => {
  const ip = socket.handshake.address;
  const count = connectionsPerIp.get(ip) ?? 0;
  if (count >= config.maxConnectionsPerIp) {
    next(new Error("Too many connections from this IP"));
    return;
  }
  connectionsPerIp.set(ip, count + 1);

  socket.on("disconnect", () => {
    const current = connectionsPerIp.get(ip) ?? 1;
    if (current <= 1) {
      connectionsPerIp.delete(ip);
    } else {
      connectionsPerIp.set(ip, current - 1);
    }
  });

  next();
});

// Periodic sweep: rebuild connectionsPerIp from actual connected sockets
// to prevent stale entries from missed disconnect events.
const IP_SWEEP_INTERVAL_MS = 60_000;
setInterval(() => {
  connectionsPerIp.clear();
  for (const [, socket] of io.sockets.sockets) {
    const ip = socket.handshake.address;
    connectionsPerIp.set(ip, (connectionsPerIp.get(ip) ?? 0) + 1);
  }
}, IP_SWEEP_INTERVAL_MS).unref();

registerConnectionHandler(io, roomManager);

// --- Graceful shutdown ---
function shutdown() {
  console.log("[server] shutting down...");
  io.close(() => {
    httpServer.close(() => {
      console.log("[server] stopped");
      process.exit(0);
    });
  });
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

httpServer.listen(config.port, () => {
  console.log(`[server] listening on http://localhost:${config.port}`);
  console.log(`[server] rooms: ${roomManager.listRooms().map((r) => r.name).join(", ")}`);
});
