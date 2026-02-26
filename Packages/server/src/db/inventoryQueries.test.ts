// Cozy Creatures - Inventory Queries Tests
//
// Tests for skin inventory CRUD operations using in-memory SQLite.
//
// Depends on: db/inventoryQueries.ts, db/playerQueries.ts, db/database.ts
// Used by:    test runner

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getDb, closeDb } from "./database.js";
import { createPlayer } from "./playerQueries.js";
import {
  getPlayerInventory,
  addToInventory,
  playerOwnsSkin,
  removeFromInventory,
  grantDefaultSkins,
} from "./inventoryQueries.js";
import { SKINS, DEFAULT_SKIN_IDS } from "@cozy/shared";

beforeEach(() => {
  getDb(":memory:");
});

afterEach(() => {
  closeDb();
});

describe("getPlayerInventory", () => {
  it("returns empty array for new player", () => {
    createPlayer("p1", "Alice", "otter");
    expect(getPlayerInventory("p1")).toEqual([]);
  });
});

describe("addToInventory", () => {
  it("inserts a skin record", () => {
    createPlayer("p1", "Alice", "otter");
    addToInventory("p1", "otter-cocoa");
    const items = getPlayerInventory("p1");
    expect(items).toHaveLength(1);
    expect(items[0]!.skin_id).toBe("otter-cocoa");
  });

  it("is idempotent (no duplicate error)", () => {
    createPlayer("p1", "Alice", "otter");
    addToInventory("p1", "otter-cocoa");
    addToInventory("p1", "otter-cocoa"); // Should not throw
    expect(getPlayerInventory("p1")).toHaveLength(1);
  });
});

describe("playerOwnsSkin", () => {
  it("returns false when skin not owned", () => {
    createPlayer("p1", "Alice", "otter");
    expect(playerOwnsSkin("p1", "otter-cocoa")).toBe(false);
  });

  it("returns true when skin is owned", () => {
    createPlayer("p1", "Alice", "otter");
    addToInventory("p1", "otter-cocoa");
    expect(playerOwnsSkin("p1", "otter-cocoa")).toBe(true);
  });
});

describe("removeFromInventory", () => {
  it("removes existing skin and returns true", () => {
    createPlayer("p1", "Alice", "otter");
    addToInventory("p1", "otter-cocoa");
    expect(removeFromInventory("p1", "otter-cocoa")).toBe(true);
    expect(getPlayerInventory("p1")).toHaveLength(0);
  });

  it("returns false when skin not owned", () => {
    createPlayer("p1", "Alice", "otter");
    expect(removeFromInventory("p1", "otter-cocoa")).toBe(false);
  });
});

describe("grantDefaultSkins", () => {
  it("grants all Common skins for the creature type", () => {
    createPlayer("p1", "Alice", "otter");
    grantDefaultSkins("p1", "otter");

    const items = getPlayerInventory("p1");
    const expectedCount = DEFAULT_SKIN_IDS.filter(
      (id) => SKINS[id].creatureType === "otter",
    ).length;
    expect(items).toHaveLength(expectedCount);
    expect(expectedCount).toBeGreaterThanOrEqual(2);
  });

  it("does not grant skins for other creature types", () => {
    createPlayer("p1", "Alice", "otter");
    grantDefaultSkins("p1", "otter");

    const items = getPlayerInventory("p1");
    for (const item of items) {
      const skin = SKINS[item.skin_id as keyof typeof SKINS];
      expect(skin.creatureType).toBe("otter");
    }
  });

  it("is idempotent (running twice does not duplicate)", () => {
    createPlayer("p1", "Alice", "otter");
    grantDefaultSkins("p1", "otter");
    grantDefaultSkins("p1", "otter"); // Should not throw or duplicate
    const items = getPlayerInventory("p1");
    const expectedCount = DEFAULT_SKIN_IDS.filter(
      (id) => SKINS[id].creatureType === "otter",
    ).length;
    expect(items).toHaveLength(expectedCount);
  });
});
