// Cozy Creatures - Socket Connection Handler
//
// Registers Socket.io event listeners for player join/move/leave/switch-room,
// sit/stand, and room listing. All handlers are wrapped in try-catch and
// inputs are validated/sanitized.
//
// Depends on: @cozy/shared (event types, Player, CREATURES, SKINS, ROOMS,
//             DEFAULT_ROOM, MAX_PLAYER_NAME, ROOM_SWITCH_COOLDOWN_MS),
//             socket/types.ts, socket/validation.ts, socket/chatHandler.ts,
//             socket/voiceHandler.ts, rooms/RoomManager.ts, config.ts,
//             db/playerQueries.ts, db/inventoryQueries.ts
// Used by:    index.ts

import { randomUUID } from "crypto";
import type { Player, RoomConfig } from "@cozy/shared";
import {
  CREATURES,
  DEFAULT_CREATURE,
  ROOMS,
  DEFAULT_ROOM,
  MAX_PLAYER_NAME,
  SKINS,
  ROOM_SWITCH_COOLDOWN_MS,
} from "@cozy/shared";
import type { CreatureTypeId, RoomId, SkinId } from "@cozy/shared";
import type { RoomManager } from "../rooms/RoomManager.js";
import type { Room } from "../rooms/Room.js";
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
const switchRoomLimiter = createRateLimiter(ROOM_SWITCH_COOLDOWN_MS);
const sitLimiter = createRateLimiter(500);

// Sweep stale rate-limiter entries periodically (catches missed disconnects)
setInterval(() => {
  moveLimiter.sweep(config.sweepMaxAgeMs);
  equipSkinLimiter.sweep(config.sweepMaxAgeMs);
  switchRoomLimiter.sweep(config.sweepMaxAgeMs);
  sitLimiter.sweep(config.sweepMaxAgeMs);
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

        let joinResult = roomManager.joinRoom(safeRoomId, player);

        // If duplicate, evict the stale session and retry once
        if ("error" in joinResult && joinResult.error === "duplicate") {
          console.log(
            `[socket] ${safeName} duplicate in ${safeRoomId} — evicting stale session`,
          );
          evictPlayer(io, roomManager, playerId, safeRoomId);
          joinResult = roomManager.joinRoom(safeRoomId, player);
        }

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

        // Broadcast updated player count
        broadcastRoomCount(io, roomManager, safeRoomId);

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

        // Clamp to room bounds (obstacle collision is client-side UX only —
        // the server can't know if the player is walking to a sit spot inside
        // an obstacle zone, so we just enforce the outer bounds here)
        const roomConfig: RoomConfig | undefined =
          roomId in ROOMS ? ROOMS[roomId as RoomId] : undefined;
        if (roomConfig) {
          const { bounds } = roomConfig.environment;
          position.x = Math.max(bounds.minX, Math.min(bounds.maxX, position.x));
          position.z = Math.max(bounds.minZ, Math.min(bounds.maxZ, position.z));
        }

        const room = roomManager.getRoom(roomId);
        if (!room) return;

        // Verify the player actually exists in this room
        const movingPlayer = room.getPlayer(playerId);
        if (!movingPlayer) return;

        // Reject movement while sitting (client suppresses this, but validate server-side)
        if (movingPlayer.sitSpotId) return;

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
        handleLeave(io, socket, roomManager);
        clearAllLimiters(socket.id);
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

    // --- player:switch-room ---
    socket.on("player:switch-room", (data, callback) => {
      try {
        if (typeof callback !== "function") return;

        const { playerId, roomId: currentRoomId, playerName } = socket.data;
        if (!playerId || !currentRoomId || !playerName) {
          callback({ success: false, error: "Not in a room" });
          return;
        }

        if (switchRoomLimiter.isRateLimited(socket.id)) {
          callback({ success: false, error: "Switching too fast" });
          return;
        }

        if (typeof data.roomId !== "string") {
          callback({ success: false, error: "Invalid room ID" });
          return;
        }

        if (!(data.roomId in ROOMS)) {
          callback({ success: false, error: "Room not found" });
          return;
        }
        const targetRoomId = data.roomId as RoomId;

        if (targetRoomId === currentRoomId) {
          callback({ success: false, error: "Already in this room" });
          return;
        }

        // Get the current player data before leaving
        const currentRoom = roomManager.getRoom(currentRoomId);
        const currentPlayer = currentRoom?.getPlayer(playerId);
        if (!currentRoom || !currentPlayer) {
          callback({ success: false, error: "Player not found" });
          return;
        }

        // Pre-check: verify target room has capacity before leaving current room
        // This prevents the player being left in limbo if the join fails (C1 fix)
        const targetRoom = roomManager.getRoom(targetRoomId);
        if (!targetRoom || targetRoom.isFull()) {
          callback({ success: false, error: "Room is full" });
          return;
        }

        // Preserve player data for the new room
        const player: Player = {
          id: currentPlayer.id,
          name: currentPlayer.name,
          creatureType: currentPlayer.creatureType,
          position: { x: 0, y: 0, z: 0 },
          roomId: targetRoomId,
          ...(currentPlayer.skinId ? { skinId: currentPlayer.skinId } : {}),
        };

        // Leave current room (broadcasts player:left, releases sit spot)
        handleLeave(io, socket, roomManager);

        // Join new room (should succeed — we pre-checked capacity)
        const joinResult = roomManager.joinRoom(targetRoomId, player);
        if ("error" in joinResult) {
          const errorMessages = {
            not_found: "Room not found",
            full: "Room is full",
            duplicate: "Already in this room",
          } as const;
          callback({ success: false, error: errorMessages[joinResult.error] });
          return;
        }

        // Update socket metadata
        socket.data.playerId = playerId;
        socket.data.playerName = playerName;
        socket.data.roomId = targetRoomId;
        socket.join(targetRoomId);

        const { room } = joinResult;

        callback({ success: true, playerId });

        // Send full room state
        socket.emit("room:state", room.getState());

        // Notify others in new room
        socket.to(targetRoomId).emit("player:joined", player);

        // Send chat history for new room
        sendChatHistory(socket, targetRoomId);

        // Broadcast updated player counts for both rooms
        broadcastRoomCount(io, roomManager, currentRoomId);
        broadcastRoomCount(io, roomManager, targetRoomId);

        console.log(
          `[socket] ${playerName} (${playerId}) switched ${currentRoomId} → ${targetRoomId}`,
        );
      } catch (err) {
        console.error("[socket] player:switch-room error:", err);
        callback({ success: false, error: "Internal server error" });
      }
    });

    // --- player:sit ---
    socket.on("player:sit", (data, callback) => {
      try {
        if (typeof callback !== "function") return;

        const { playerId, roomId } = socket.data;
        if (!playerId || !roomId) {
          callback({ success: false, error: "Not in a room" });
          return;
        }

        if (sitLimiter.isRateLimited(socket.id)) {
          callback({ success: false, error: "Too fast" });
          return;
        }

        if (typeof data.sitSpotId !== "string") {
          callback({ success: false, error: "Invalid sit spot" });
          return;
        }

        // Validate sit spot exists in this room's config
        const roomConfig: RoomConfig | undefined =
          roomId in ROOMS ? ROOMS[roomId as RoomId] : undefined;
        if (!roomConfig) {
          callback({ success: false, error: "Room not found" });
          return;
        }

        const sitSpot = roomConfig.environment.sitSpots.find(
          (s) => s.id === data.sitSpotId,
        );
        if (!sitSpot) {
          callback({ success: false, error: "Unknown sit spot" });
          return;
        }

        const room = roomManager.getRoom(roomId);
        if (!room) {
          callback({ success: false, error: "Room not found" });
          return;
        }

        // Try to claim the spot
        if (!room.occupySitSpot(playerId, data.sitSpotId)) {
          callback({ success: false, error: "Spot is taken" });
          return;
        }

        // Snap player position to the sit spot
        room.updatePlayerPosition(playerId, sitSpot.position);

        callback({ success: true });

        // Broadcast to room
        io.to(roomId).emit("player:sat", {
          id: playerId,
          sitSpotId: data.sitSpotId,
          position: sitSpot.position,
        });

        console.log(`[socket] ${playerId} sat at ${data.sitSpotId} in ${roomId}`);
      } catch (err) {
        console.error("[socket] player:sit error:", err);
        callback({ success: false, error: "Internal server error" });
      }
    });

    // --- player:stand ---
    socket.on("player:stand", () => {
      try {
        const { playerId, roomId } = socket.data;
        if (!playerId || !roomId) return;

        const room = roomManager.getRoom(roomId);
        if (!room) return;

        const released = room.releaseSitSpot(playerId);
        if (released) {
          io.to(roomId).emit("player:stood", { id: playerId });
          console.log(`[socket] ${playerId} stood up in ${roomId}`);
        }
      } catch (err) {
        console.error("[socket] player:stand error:", err);
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
        handleLeave(io, socket, roomManager);
        clearAllLimiters(socket.id);
        cleanupChat(socket.id);
        cleanupVoice(socket.id);
      } catch (err) {
        console.error("[socket] disconnect cleanup error:", err);
      }
    });
  });
}

/** Clear all rate limiter entries for a socket. */
function clearAllLimiters(socketId: string): void {
  moveLimiter.clear(socketId);
  equipSkinLimiter.clear(socketId);
  switchRoomLimiter.clear(socketId);
  sitLimiter.clear(socketId);
}

/**
 * Evict a stale player from a room. If their socket is still connected,
 * notify them via player:kicked and disconnect it. If it's a ghost entry
 * (socket already gone), just remove them from the room.
 */
function evictPlayer(
  io: TypedServer,
  roomManager: RoomManager,
  playerId: string,
  roomId: RoomId,
): void {
  // Search for an active socket belonging to this player
  for (const [, sock] of io.sockets.sockets) {
    const typed = sock as unknown as TypedSocket;
    if (typed.data.playerId === playerId) {
      // Notify the old client that they've been displaced
      typed.emit("player:kicked", { reason: "Connected from another session" });

      // Clean up exactly like a normal leave + disconnect
      handleLeave(io, typed, roomManager);
      clearAllLimiters(typed.id);
      cleanupChat(typed.id);
      cleanupVoice(typed.id);
      typed.disconnect(true);

      console.log(`[socket] evicted stale socket ${typed.id} for player ${playerId}`);
      return;
    }
  }

  // Ghost entry — no active socket, just remove from room
  roomManager.leaveRoom(roomId, playerId);
  // Broadcast removal to anyone still in the room
  io.to(roomId).emit("player:left", { id: playerId });
  console.log(`[socket] evicted ghost player ${playerId} from ${roomId}`);
}

function handleLeave(
  io: TypedServer,
  socket: TypedSocket,
  roomManager: RoomManager,
): void {
  const { playerId, roomId, playerName } = socket.data;
  if (!playerId || !roomId) return;

  // Release sit spot and notify room if the player was sitting
  const room = roomManager.getRoom(roomId);
  if (room) {
    const releasedSpot = room.releaseSitSpot(playerId);
    if (releasedSpot) {
      io.to(roomId).emit("player:stood", { id: playerId });
    }
  }

  roomManager.leaveRoom(roomId, playerId);
  socket.to(roomId).emit("player:left", { id: playerId });
  socket.leave(roomId);

  // Broadcast updated player count
  broadcastRoomCount(io, roomManager, roomId);

  // Free chat history when the last player leaves
  const updatedRoom = roomManager.getRoom(roomId);
  if (updatedRoom && updatedRoom.playerCount === 0) {
    clearHistory(roomId);
  }

  console.log(`[socket] ${playerName} (${playerId}) left ${roomId}`);

  // Clear socket data so we don't double-leave
  socket.data.playerId = undefined;
  socket.data.roomId = undefined;
  socket.data.playerName = undefined;
}

/** Broadcast the current player count for a room to all connected clients. */
function broadcastRoomCount(
  io: TypedServer,
  roomManager: RoomManager,
  roomId: string,
): void {
  const room = roomManager.getRoom(roomId);
  if (!room) return;
  io.emit("room:player-count", { roomId, playerCount: room.playerCount });
}
