// Cozy Creatures - Skins API Tests
//
// Tests for GET /api/skins, GET /api/skins/inventory/:playerId, and
// POST /api/skins/equip endpoints.
//
// Depends on: api/skins.ts, db/database.ts, db/playerQueries.ts, db/inventoryQueries.ts
// Used by:    test runner

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import express from "express";
import { skinsRouter } from "./skins.js";
import { getDb, closeDb } from "../db/database.js";
import { createPlayer } from "../db/playerQueries.js";
import { addToInventory } from "../db/inventoryQueries.js";
import { SKINS, SKIN_SETS } from "@cozy/shared";

function createApp() {
  const app = express();
  app.use(express.json());
  app.use("/api", skinsRouter);
  return app;
}

async function request(
  app: ReturnType<typeof createApp>,
  method: "GET" | "POST",
  path: string,
  body?: unknown,
): Promise<{ status: number; body: Record<string, unknown> }> {
  const { createServer } = await import("http");

  return new Promise((resolve, reject) => {
    const server = createServer(app);
    server.listen(0, async () => {
      try {
        const addr = server.address();
        if (!addr || typeof addr === "string") throw new Error("No address");

        const opts: RequestInit = {
          method,
          headers: { "Content-Type": "application/json" },
        };
        if (body !== undefined) {
          opts.body = JSON.stringify(body);
        }

        const res = await fetch(`http://127.0.0.1:${addr.port}${path}`, opts);
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

beforeEach(() => {
  getDb(":memory:");
});

afterEach(() => {
  closeDb();
});

describe("GET /api/skins", () => {
  it("returns all skins and sets", async () => {
    const app = createApp();
    const res = await request(app, "GET", "/api/skins");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.skins)).toBe(true);
    expect(Array.isArray(res.body.sets)).toBe(true);
    expect((res.body.skins as unknown[]).length).toBe(Object.keys(SKINS).length);
    expect((res.body.sets as unknown[]).length).toBe(Object.keys(SKIN_SETS).length);
  });
});

describe("GET /api/skins/inventory/:playerId", () => {
  it("returns 404 for unknown player", async () => {
    const app = createApp();
    const res = await request(app, "GET", "/api/skins/inventory/unknown-id");
    expect(res.status).toBe(404);
  });

  it("returns empty inventory for new player", async () => {
    createPlayer("p1", "Alice", "otter");
    const app = createApp();
    const res = await request(app, "GET", "/api/skins/inventory/p1");
    expect(res.status).toBe(200);
    expect(res.body.items).toEqual([]);
    expect(res.body.equippedSkinId).toBeNull();
  });

  it("returns owned skins", async () => {
    createPlayer("p1", "Alice", "otter");
    addToInventory("p1", "otter-cocoa");
    const app = createApp();
    const res = await request(app, "GET", "/api/skins/inventory/p1");
    expect(res.status).toBe(200);
    const items = res.body.items as { skinId: string }[];
    expect(items).toHaveLength(1);
    expect(items[0]!.skinId).toBe("otter-cocoa");
  });
});

describe("POST /api/skins/equip", () => {
  it("returns 400 for missing fields", async () => {
    const app = createApp();
    const res = await request(app, "POST", "/api/skins/equip", {});
    expect(res.status).toBe(400);
  });

  it("returns 404 for unknown player", async () => {
    const app = createApp();
    const res = await request(app, "POST", "/api/skins/equip", {
      playerId: "unknown",
      skinId: "otter-cocoa",
    });
    expect(res.status).toBe(404);
  });

  it("returns 400 for unknown skinId", async () => {
    createPlayer("p1", "Alice", "otter");
    const app = createApp();
    const res = await request(app, "POST", "/api/skins/equip", {
      playerId: "p1",
      skinId: "nonexistent-skin",
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("Unknown skin");
  });

  it("returns 403 when player does not own skin", async () => {
    createPlayer("p1", "Alice", "otter");
    const app = createApp();
    const res = await request(app, "POST", "/api/skins/equip", {
      playerId: "p1",
      skinId: "otter-cocoa",
    });
    expect(res.status).toBe(403);
  });

  it("returns 400 when skin does not match creature type", async () => {
    createPlayer("p1", "Alice", "otter");
    addToInventory("p1", "red-panda-cherry");
    const app = createApp();
    const res = await request(app, "POST", "/api/skins/equip", {
      playerId: "p1",
      skinId: "red-panda-cherry",
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("creature type");
  });

  it("returns 200 on successful equip", async () => {
    createPlayer("p1", "Alice", "otter");
    addToInventory("p1", "otter-cocoa");
    const app = createApp();
    const res = await request(app, "POST", "/api/skins/equip", {
      playerId: "p1",
      skinId: "otter-cocoa",
    });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.equippedSkinId).toBe("otter-cocoa");
  });

  it("allows unequip with null skinId", async () => {
    createPlayer("p1", "Alice", "otter");
    const app = createApp();
    const res = await request(app, "POST", "/api/skins/equip", {
      playerId: "p1",
      skinId: null,
    });
    expect(res.status).toBe(200);
    expect(res.body.equippedSkinId).toBeNull();
  });
});
