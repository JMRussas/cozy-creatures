// Cozy Creatures - Voice Token API Tests
//
// Tests for POST /api/voice/token endpoint validation and token generation.
//
// Depends on: api/voice.ts, rooms/RoomManager.ts, express
// Used by:    test runner

import { describe, it, expect, beforeEach, vi } from "vitest";
import express from "express";
import { voiceRouter } from "./voice.js";
import { roomManager } from "../rooms/RoomManager.js";

/** Create a minimal Express app with the voice router mounted. */
function createApp() {
  const app = express();
  app.use(express.json());
  app.use("/api", voiceRouter);
  return app;
}

/** Helper to make a POST request to the test app. */
async function postToken(
  app: ReturnType<typeof createApp>,
  body: unknown,
): Promise<{ status: number; body: Record<string, unknown> }> {
  const { createServer } = await import("http");

  return new Promise((resolve, reject) => {
    const server = createServer(app);
    server.listen(0, async () => {
      try {
        const addr = server.address();
        if (!addr || typeof addr === "string") throw new Error("No address");

        const res = await fetch(
          `http://127.0.0.1:${addr.port}/api/voice/token`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          },
        );
        const json = (await res.json()) as Record<string, unknown>;
        resolve({ status: res.status, body: json });
      } catch (err) {
        reject(err);
      } finally {
        server.close();
      }
    });
  });
}

/** Seed a test player into a room so the auth check passes. */
function seedPlayer(roomId: string, playerId: string, playerName: string) {
  const room = roomManager.getRoom(roomId);
  if (!room) throw new Error(`Room ${roomId} not found in test setup`);
  room.addPlayer({
    id: playerId,
    name: playerName,
    creatureType: "otter",
    position: { x: 0, y: 0, z: 0 },
    roomId: roomId as import("@cozy/shared").RoomId,
  });
}

describe("POST /api/voice/token", () => {
  const app = createApp();

  beforeEach(() => {
    // Reset room state between tests by removing any seeded players
    for (const info of roomManager.listRooms()) {
      const room = roomManager.getRoom(info.id);
      if (room) {
        // Remove all players via Room's public API
        const state = room.getState();
        for (const id of Object.keys(state.players)) {
          room.removePlayer(id);
        }
      }
    }
  });

  // --- Validation tests (no room setup needed) ---

  it("returns 400 when body is empty", async () => {
    const { status, body } = await postToken(app, {});
    expect(status).toBe(400);
    expect(body.error).toContain("Missing required fields");
  });

  it("returns 400 when playerId is missing", async () => {
    const { status, body } = await postToken(app, {
      playerName: "Test",
      roomId: "cozy-cafe",
    });
    expect(status).toBe(400);
    expect(body.error).toContain("Missing required fields");
  });

  it("returns 400 when playerName is missing", async () => {
    const { status, body } = await postToken(app, {
      playerId: "p1",
      roomId: "cozy-cafe",
    });
    expect(status).toBe(400);
    expect(body.error).toContain("Missing required fields");
  });

  it("returns 400 when roomId is missing", async () => {
    const { status, body } = await postToken(app, {
      playerId: "p1",
      playerName: "Test",
    });
    expect(status).toBe(400);
    expect(body.error).toContain("Missing required fields");
  });

  it("returns 400 when fields are not strings", async () => {
    const { status, body } = await postToken(app, {
      playerId: 123,
      playerName: "Test",
      roomId: "cozy-cafe",
    });
    expect(status).toBe(400);
    expect(body.error).toContain("must be strings");
  });

  it("returns 400 for whitespace-only playerName", async () => {
    const { status, body } = await postToken(app, {
      playerId: "p1",
      playerName: "   ",
      roomId: "cozy-cafe",
    });
    expect(status).toBe(400);
    expect(body.error).toContain("empty or whitespace");
  });

  it("returns 400 when playerName exceeds MAX_PLAYER_NAME", async () => {
    const { status, body } = await postToken(app, {
      playerId: "p1",
      playerName: "a".repeat(100),
      roomId: "cozy-cafe",
    });
    expect(status).toBe(400);
    expect(body.error).toContain("playerName must be <=");
  });

  // --- Auth tests ---

  it("returns 404 for unknown roomId", async () => {
    const { status, body } = await postToken(app, {
      playerId: "p1",
      playerName: "Test",
      roomId: "nonexistent-room",
    });
    expect(status).toBe(404);
    expect(body.error).toContain("Room not found");
  });

  it("returns 403 when player is not in room", async () => {
    const { status, body } = await postToken(app, {
      playerId: "fake-player",
      playerName: "Faker",
      roomId: "cozy-cafe",
    });
    expect(status).toBe(403);
    expect(body.error).toContain("not in room");
  });

  // --- Success tests (require seeded player) ---

  it("returns 200 with token and url for valid request", async () => {
    seedPlayer("cozy-cafe", "player-1", "TestPlayer");

    const { status, body } = await postToken(app, {
      playerId: "player-1",
      playerName: "TestPlayer",
      roomId: "cozy-cafe",
    });
    expect(status).toBe(200);
    expect(body.token).toBeDefined();
    expect(typeof body.token).toBe("string");
    expect((body.token as string).length).toBeGreaterThan(0);
    expect(body.url).toBeDefined();
    expect(typeof body.url).toBe("string");
  });

  it("token is a valid JWT (3 dot-separated parts)", async () => {
    seedPlayer("rooftop-garden", "player-2", "Another");

    const { body } = await postToken(app, {
      playerId: "player-2",
      playerName: "Another",
      roomId: "rooftop-garden",
    });
    const parts = (body.token as string).split(".");
    expect(parts.length).toBe(3);
  });
});
