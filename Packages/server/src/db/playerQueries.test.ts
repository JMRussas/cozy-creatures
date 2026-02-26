// Cozy Creatures - Player Queries Tests
//
// Depends on: db/playerQueries.ts, db/database.ts
// Used by:    test runner

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getDb, closeDb } from "./database.js";
import {
  findPlayerByName,
  createPlayer,
  updatePlayerOnJoin,
} from "./playerQueries.js";

beforeEach(() => {
  // Fresh in-memory DB for each test
  getDb(":memory:");
});

afterEach(() => {
  closeDb();
});

describe("createPlayer", () => {
  it("inserts a new player", () => {
    createPlayer("id-1", "Alice", "otter");
    const row = findPlayerByName("Alice");
    expect(row).toBeDefined();
    expect(row!.id).toBe("id-1");
    expect(row!.name).toBe("Alice");
    expect(row!.creature_type).toBe("otter");
  });

  it("sets created_at and last_seen timestamps", () => {
    createPlayer("id-1", "Alice", "sloth");
    const row = findPlayerByName("Alice")!;
    expect(row.created_at).toBeGreaterThan(0);
    expect(row.last_seen).toBeGreaterThan(0);
  });
});

describe("findPlayerByName", () => {
  it("returns undefined for unknown name", () => {
    expect(findPlayerByName("Ghost")).toBeUndefined();
  });

  it("returns the most recently seen match", () => {
    const db = getDb();
    // Insert two players with the same name but different last_seen
    db.prepare("INSERT INTO players (id, name, creature_type, last_seen) VALUES (?, ?, ?, ?)").run(
      "old", "Alice", "otter", 1000,
    );
    db.prepare("INSERT INTO players (id, name, creature_type, last_seen) VALUES (?, ?, ?, ?)").run(
      "new", "Alice", "sloth", 2000,
    );
    const row = findPlayerByName("Alice");
    expect(row!.id).toBe("new");
  });

  it("is case-sensitive", () => {
    createPlayer("id-1", "Alice", "otter");
    expect(findPlayerByName("alice")).toBeUndefined();
  });
});

describe("updatePlayerOnJoin", () => {
  it("updates creature_type and last_seen", () => {
    createPlayer("id-1", "Alice", "otter");
    const before = findPlayerByName("Alice")!;

    updatePlayerOnJoin("id-1", "pangolin");
    const after = findPlayerByName("Alice")!;

    expect(after.creature_type).toBe("pangolin");
    expect(after.last_seen).toBeGreaterThanOrEqual(before.last_seen);
  });
});