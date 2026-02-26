// Cozy Creatures - Server Entry Point
//
// Express + Socket.io server. Handles HTTP routes and real-time connections.
//
// Depends on: config.ts, socket/connectionHandler.ts, socket/chatHandler.ts,
//             socket/voiceHandler.ts, socket/validation.ts, api/voice.ts, api/skins.ts,
//             rooms/RoomManager.ts, db/database.ts
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
import { registerChatHandler } from "./socket/chatHandler.js";
import { registerVoiceHandler } from "./socket/voiceHandler.js";
import { voiceRouter } from "./api/voice.js";
import { skinsRouter } from "./api/skins.js";
import { getDb, closeDb } from "./db/database.js";
import { createRateLimiter } from "./socket/validation.js";

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

// --- REST API rate limiting per IP ---
const apiLimiter = createRateLimiter(config.apiRateMs);
setInterval(() => apiLimiter.sweep(config.sweepMaxAgeMs), config.sweepIntervalMs).unref();

app.use("/api", (req, res, next) => {
  // Health check is exempt
  if (req.path === "/health") { next(); return; }
  const ip = req.ip ?? req.socket.remoteAddress ?? "unknown";
  if (apiLimiter.isRateLimited(ip)) {
    res.status(429).json({ error: "Too many requests" });
    return;
  }
  next();
});

app.use("/api", voiceRouter);
app.use("/api", skinsRouter);

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
// Build into a fresh map first, then swap — avoids a brief window with
// an empty map (harmless in single-threaded Node but cleaner semantics).
setInterval(() => {
  const fresh = new Map<string, number>();
  for (const [, socket] of io.sockets.sockets) {
    const ip = socket.handshake.address;
    fresh.set(ip, (fresh.get(ip) ?? 0) + 1);
  }
  connectionsPerIp.clear();
  for (const [ip, count] of fresh) {
    connectionsPerIp.set(ip, count);
  }
}, config.sweepIntervalMs).unref();

// Both handlers call io.on("connection") independently — Socket.io supports
// multiple connection listeners and fires them in registration order.
// connectionHandler must be registered first: it sets socket.data fields
// (playerId, playerName, roomId) that chatHandler reads.
registerConnectionHandler(io, roomManager);
registerChatHandler(io);
registerVoiceHandler(io);

// --- Initialize database ---
getDb();

// --- Graceful shutdown ---
function shutdown() {
  console.log("[server] shutting down...");
  closeDb();
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
