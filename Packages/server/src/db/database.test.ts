// Cozy Creatures - Database Module Tests
//
// Depends on: db/database.ts
// Used by:    test runner

import { describe, it, expect, afterEach } from "vitest";
import { getDb, closeDb } from "./database.js";

afterEach(() => {
  closeDb();
});

describe("database", () => {
  it("creates an in-memory database", () => {
    const db = getDb(":memory:");
    expect(db).toBeDefined();
    expect(db.open).toBe(true);
  });

  it("returns the same singleton on repeated calls", () => {
    const db1 = getDb(":memory:");
    const db2 = getDb();
    expect(db2).toBe(db1);
  });

  it("creates the players table on init", () => {
    const db = getDb(":memory:");
    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='players'")
      .all();
    expect(tables).toHaveLength(1);
  });

  it("creates an index on players.name", () => {
    const db = getDb(":memory:");
    const indexes = db
      .prepare("SELECT name FROM sqlite_master WHERE type='index' AND name='idx_players_name'")
      .all();
    expect(indexes).toHaveLength(1);
  });

  it("closes and allows reopening", () => {
    const db1 = getDb(":memory:");
    expect(db1.open).toBe(true);
    closeDb();
    // After close, getDb creates a fresh connection
    const db2 = getDb(":memory:");
    expect(db2).not.toBe(db1);
    expect(db2.open).toBe(true);
  });
});
