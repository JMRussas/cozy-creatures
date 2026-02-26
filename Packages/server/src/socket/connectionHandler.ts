// Cozy Creatures - Socket Connection Handler
//
// Registers Socket.io event listeners for player join/move/leave and room listing.
// All handlers are wrapped in try-catch and inputs are validated/sanitized.
//
// Depends on: @cozy/shared (event types, Player, CREATURES, DEFAULT_ROOM, MAX_PLAYER_NAME),
//             socket/validation.ts, rooms/RoomManager.ts, config.ts
// Used by:    index.ts

import { Server, Socket } from "socket.io";
import { randomUUID } from "crypto";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
  Player,
} from "@cozy/shared";
import {
  CREATURES,
  DEFAULT_CREATURE,
  ROOMS,
  DEFAULT_ROOM,
  MAX_PLAYER_NAME,
} from "@cozy/shared";
import type { CreatureTypeId, RoomId } from "@cozy/shared";
import type { RoomManager } from "../rooms/RoomManager.js";
import { config } from "../config.js";
import { sanitizePosition, stripControlChars, createRateLimiter } from "./validation.js";

type TypedServer = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

type TypedSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

// --- Rate limiting ---

const moveLimiter = createRateLimiter(config.moveRateMs);

// Sweep stale rate-limiter entries every 60s (catches missed disconnects)
const SWEEP_INTERVAL_MS = 60_000;
const SWEEP_MAX_AGE_MS = 30_000;
setInterval(() => moveLimiter.sweep(SWEEP_MAX_AGE_MS), SWEEP_INTERVAL_MS).unref();

// --- Main handler ---

export function registerConnectionHandler(
  io: TypedServer,
  roomManager: RoomManager,
): void {
  io.on("connection", (socket: TypedSocket) => {
    console.log(`[socket] connected: ${socket.id}`);

    // --- player:join ---
    socket.on("player:join", (data, callback) => {
      try {
        if (typeof callback !== "function") return;

        // Guard: already joined
        if (socket.data.playerId) {
          callback({ success: false, error: "Already joined" });
          return;
        }

        // Type guards — reject non-string payloads before calling string methods
        if (
          typeof data.name !== "string" ||
          typeof data.creatureType !== "string" ||
          typeof data.roomId !== "string"
        ) {
          callback({ success: false, error: "Invalid join data" });
          return;
        }

        const { name, creatureType, roomId } = data;

        // Validate & sanitize
        const safeName =
          stripControlChars(name).trim().slice(0, MAX_PLAYER_NAME) || "Creature";
        const safeCreature: CreatureTypeId =
          creatureType in CREATURES
            ? (creatureType as CreatureTypeId)
            : DEFAULT_CREATURE;
        const safeRoomId: RoomId =
          roomId in ROOMS ? (roomId as RoomId) : DEFAULT_ROOM;

        const playerId = randomUUID();

        const player: Player = {
          id: playerId,
          name: safeName,
          creatureType: safeCreature,
          position: { x: 0, y: 0, z: 0 },
          roomId: safeRoomId,
        };

        const room = roomManager.joinRoom(safeRoomId, player);
        if (!room) {
          const exists = roomManager.getRoom(safeRoomId) !== undefined;
          const errorMsg = exists ? "Room is full" : "Room not found";
          console.log(
            `[socket] ${safeName} failed to join ${safeRoomId}: ${errorMsg}`,
          );
          callback({ success: false, error: errorMsg });
          return;
        }

        // Store player info on the socket
        socket.data.playerId = playerId;
        socket.data.playerName = safeName;
        socket.data.roomId = safeRoomId;

        // Join the Socket.io room
        socket.join(safeRoomId);

        // Tell the client their assigned player ID
        callback({ success: true, playerId });

        // Send full room state to the joining player
        socket.emit("room:state", room.getState());

        // Notify others in the room
        socket.to(safeRoomId).emit("player:joined", player);

        console.log(
          `[socket] ${safeName} (${playerId}) joined ${safeRoomId}`,
        );
      } catch (err) {
        console.error("[socket] player:join error:", err);
        callback({ success: false, error: "Internal server error" });
      }
    });

    // --- player:move ---
    socket.on("player:move", (data) => {
      try {
        const { playerId, roomId } = socket.data;
        if (!playerId || !roomId) return;

        // Rate limit
        if (moveLimiter.isRateLimited(socket.id)) return;

        const position = sanitizePosition(data.position);

        const room = roomManager.getRoom(roomId);
        if (!room) return;

        // Verify the player actually exists in this room
        if (!room.getPlayer(playerId)) return;

        room.updatePlayerPosition(playerId, position);

        // Broadcast to others in the room (not back to sender)
        socket.to(roomId).emit("player:moved", { id: playerId, position });
      } catch (err) {
        console.error("[socket] player:move error:", err);
      }
    });

    // --- player:leave ---
    socket.on("player:leave", () => {
      try {
        handleLeave(socket, roomManager);
      } catch (err) {
        console.error("[socket] player:leave error:", err);
      }
    });

    // --- room:list ---
    socket.on("room:list", (callback) => {
      try {
        if (typeof callback !== "function") return;
        callback(roomManager.listRooms());
      } catch (err) {
        console.error("[socket] room:list error:", err);
      }
    });

    // --- disconnect ---
    socket.on("disconnect", (reason) => {
      try {
        console.log(`[socket] disconnected: ${socket.id} (${reason})`);
        handleLeave(socket, roomManager);
        moveLimiter.clear(socket.id);
      } catch (err) {
        console.error("[socket] disconnect cleanup error:", err);
      }
    });
  });
}

function handleLeave(
  socket: TypedSocket,
  roomManager: { leaveRoom(roomId: string, playerId: string): void },
): void {
  const { playerId, roomId, playerName } = socket.data;
  if (!playerId || !roomId) return;

  roomManager.leaveRoom(roomId, playerId);
  socket.to(roomId).emit("player:left", { id: playerId });
  socket.leave(roomId);

  console.log(`[socket] ${playerName} (${playerId}) left ${roomId}`);

  // Clear socket data so we don't double-leave
  socket.data.playerId = undefined;
  socket.data.roomId = undefined;
  socket.data.playerName = undefined;
}
