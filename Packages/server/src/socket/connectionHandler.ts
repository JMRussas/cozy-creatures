// Cozy Creatures - Socket Connection Handler
//
// Registers Socket.io event listeners for player join/move/leave and room listing.
// All handlers are wrapped in try-catch and inputs are validated/sanitized.
//
// Depends on: @cozy/shared (event types, Player, CREATURES, SKINS, DEFAULT_ROOM, MAX_PLAYER_NAME),
//             socket/types.ts, socket/validation.ts, socket/chatHandler.ts,
//             socket/voiceHandler.ts, rooms/RoomManager.ts, config.ts, db/playerQueries.ts,
//             db/inventoryQueries.ts
// Used by:    index.ts

import { randomUUID } from "crypto";
import type { Player } from "@cozy/shared";
import {
  CREATURES,
  DEFAULT_CREATURE,
  ROOMS,
  DEFAULT_ROOM,
  MAX_PLAYER_NAME,
  SKINS,
} from "@cozy/shared";
import type { CreatureTypeId, RoomId, SkinId } from "@cozy/shared";
import type { RoomManager } from "../rooms/RoomManager.js";
import { config } from "../config.js";
import type { TypedServer, TypedSocket } from "./types.js";
import { sanitizePosition, stripControlChars, createRateLimiter } from "./validation.js";
import { sendChatHistory, cleanupChat, clearHistory } from "./chatHandler.js";
import { cleanupVoice } from "./voiceHandler.js";
import {
  findPlayerByName,
  createPlayer,
  updatePlayerOnJoin,
  getEquippedSkin,
  setEquippedSkin,
} from "../db/playerQueries.js";
import { grantDefaultSkins, playerOwnsSkin } from "../db/inventoryQueries.js";

// --- Rate limiting ---

const moveLimiter = createRateLimiter(config.moveRateMs);
const equipSkinLimiter = createRateLimiter(500);

// Sweep stale rate-limiter entries periodically (catches missed disconnects)
setInterval(() => {
  moveLimiter.sweep(config.sweepMaxAgeMs);
  equipSkinLimiter.sweep(config.sweepMaxAgeMs);
}, config.sweepIntervalMs).unref();

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

        // Persist to SQLite — lookup by name, create or update.
        // Reuse the existing DB id so the in-memory player matches the DB row.
        const existing = findPlayerByName(safeName);
        const playerId = existing?.id ?? randomUUID();
        if (existing) {
          updatePlayerOnJoin(playerId, safeCreature);
          // Grant default skins for the (possibly new) creature type — idempotent
          grantDefaultSkins(playerId, safeCreature);
        } else {
          createPlayer(playerId, safeName, safeCreature);
          grantDefaultSkins(playerId, safeCreature);
        }

        // Look up equipped skin from DB; clear if stale (wrong creature type)
        const equippedSkin = getEquippedSkin(playerId);
        let skinId: SkinId | undefined;
        if (
          equippedSkin &&
          equippedSkin in SKINS &&
          SKINS[equippedSkin as keyof typeof SKINS].creatureType === safeCreature
        ) {
          skinId = equippedSkin as SkinId;
        } else if (equippedSkin) {
          // Creature type changed — clear the stale skin
          setEquippedSkin(playerId, null);
        }

        const player: Player = {
          id: playerId,
          name: safeName,
          creatureType: safeCreature,
          position: { x: 0, y: 0, z: 0 },
          roomId: safeRoomId,
          ...(skinId ? { skinId } : {}),
        };

        const joinResult = roomManager.joinRoom(safeRoomId, player);
        if ("error" in joinResult) {
          const errorMessages = {
            not_found: "Room not found",
            full: "Room is full",
            duplicate: "Already in this room",
          } as const;
          const errorMsg = errorMessages[joinResult.error];
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

        const { room } = joinResult;

        // Tell the client their assigned player ID
        callback({ success: true, playerId });

        // Send full room state to the joining player
        socket.emit("room:state", room.getState());

        // Notify others in the room
        socket.to(safeRoomId).emit("player:joined", player);

        // Send recent chat history to the new player
        sendChatHistory(socket, safeRoomId);

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
        moveLimiter.clear(socket.id);
        equipSkinLimiter.clear(socket.id);
        cleanupChat(socket.id);
        cleanupVoice(socket.id);
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

    // --- player:equip-skin ---
    socket.on("player:equip-skin", (data, callback) => {
      try {
        if (typeof callback !== "function") return;

        if (equipSkinLimiter.isRateLimited(socket.id)) {
          callback({ success: false, error: "Too fast" });
          return;
        }

        const { playerId, roomId } = socket.data;
        if (!playerId || !roomId) {
          callback({ success: false, error: "Not in a room" });
          return;
        }

        if (typeof data.skinId !== "string") {
          callback({ success: false, error: "Invalid skinId" });
          return;
        }

        const room = roomManager.getRoom(roomId);
        const player = room?.getPlayer(playerId);
        if (!room || !player) {
          callback({ success: false, error: "Player not found in room" });
          return;
        }

        const { skinId } = data;

        // Empty string means unequip
        if (skinId === "") {
          setEquippedSkin(playerId, null);
          player.skinId = undefined;
          callback({ success: true });
          socket.to(roomId).emit("player:skin-changed", { id: playerId, skinId: null });
          return;
        }

        // Validate skin exists
        if (!(skinId in SKINS)) {
          callback({ success: false, error: "Unknown skin" });
          return;
        }

        // Validate creature type match
        const skin = SKINS[skinId as keyof typeof SKINS];
        if (skin.creatureType !== player.creatureType) {
          callback({ success: false, error: "Skin does not match creature type" });
          return;
        }

        // Validate ownership
        if (!playerOwnsSkin(playerId, skinId)) {
          callback({ success: false, error: "Skin not owned" });
          return;
        }

        // Persist and update in-memory state
        setEquippedSkin(playerId, skinId);
        player.skinId = skinId;

        callback({ success: true });

        // Broadcast to room
        socket.to(roomId).emit("player:skin-changed", { id: playerId, skinId });
      } catch (err) {
        console.error("[socket] player:equip-skin error:", err);
        callback({ success: false, error: "Internal server error" });
      }
    });

    // --- disconnect ---
    socket.on("disconnect", (reason) => {
      try {
        console.log(`[socket] disconnected: ${socket.id} (${reason})`);
        handleLeave(socket, roomManager);
        moveLimiter.clear(socket.id);
        equipSkinLimiter.clear(socket.id);
        cleanupChat(socket.id);
        cleanupVoice(socket.id);
      } catch (err) {
        console.error("[socket] disconnect cleanup error:", err);
      }
    });
  });
}

function handleLeave(
  socket: TypedSocket,
  roomManager: RoomManager,
): void {
  const { playerId, roomId, playerName } = socket.data;
  if (!playerId || !roomId) return;

  roomManager.leaveRoom(roomId, playerId);
  socket.to(roomId).emit("player:left", { id: playerId });
  socket.leave(roomId);

  // Free chat history when the last player leaves
  const room = roomManager.getRoom(roomId);
  if (room && room.playerCount === 0) {
    clearHistory(roomId);
  }

  console.log(`[socket] ${playerName} (${playerId}) left ${roomId}`);

  // Clear socket data so we don't double-leave
  socket.data.playerId = undefined;
  socket.data.roomId = undefined;
  socket.data.playerName = undefined;
}
