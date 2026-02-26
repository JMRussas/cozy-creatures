// Cozy Creatures - Voice Token API
//
// POST /api/voice/token — generates a LiveKit access token scoped to
// the player's current room. The client calls this after joining a room
// via Socket.io, then uses the token to connect to LiveKit.
//
// Depends on: livekit-server-sdk, config.ts, rooms/RoomManager.ts,
//             @cozy/shared (VoiceTokenResponse, MAX_PLAYER_NAME)
// Used by:    index.ts (Express router mount)

import { Router, type IRouter } from "express";
import { AccessToken } from "livekit-server-sdk";
import { config } from "../config.js";
import { roomManager } from "../rooms/RoomManager.js";
import { MAX_PLAYER_NAME } from "@cozy/shared";
import type { VoiceTokenResponse } from "@cozy/shared";

export const voiceRouter: IRouter = Router();

voiceRouter.post("/voice/token", async (req, res) => {
  try {
    const body = req.body as Record<string, unknown>;
    const { playerId, playerName, roomId } = body;

    // Validate required fields
    if (!playerId || !playerName || !roomId) {
      res
        .status(400)
        .json({ error: "Missing required fields: playerId, playerName, roomId" });
      return;
    }

    if (
      typeof playerId !== "string" ||
      typeof playerName !== "string" ||
      typeof roomId !== "string"
    ) {
      res.status(400).json({ error: "All fields must be strings" });
      return;
    }

    // Reject whitespace-only strings and enforce length limits
    const trimmedPlayer = playerId.trim();
    const trimmedName = playerName.trim();
    const trimmedRoom = roomId.trim();

    if (!trimmedPlayer || !trimmedName || !trimmedRoom) {
      res.status(400).json({ error: "Fields must not be empty or whitespace-only" });
      return;
    }

    if (trimmedName.length > MAX_PLAYER_NAME) {
      res
        .status(400)
        .json({ error: `playerName must be <= ${MAX_PLAYER_NAME} characters` });
      return;
    }

    // Verify the player is actually in this room (prevents forged token requests)
    const room = roomManager.getRoom(roomId);
    if (!room) {
      res.status(404).json({ error: "Room not found" });
      return;
    }

    const player = room.getPlayer(playerId);
    if (!player) {
      res.status(403).json({ error: "Player not in room" });
      return;
    }

    const at = new AccessToken(config.livekitApiKey, config.livekitApiSecret, {
      identity: playerId,
      name: playerName,
      metadata: JSON.stringify({ roomId }),
      ttl: "1h",
    });

    at.addGrant({
      roomJoin: true,
      room: roomId,
      canPublish: true,
      canSubscribe: true,
    });

    const token = await at.toJwt();

    const response: VoiceTokenResponse = {
      token,
      url: config.livekitWsUrl,
    };

    res.json(response);
  } catch (err) {
    console.error("[api] voice/token error:", err);
    res.status(500).json({ error: "Failed to generate voice token" });
  }
});
