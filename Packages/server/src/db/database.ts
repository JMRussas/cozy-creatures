// Cozy Creatures - Database Module
//
// SQLite database initialization and connection management.
// Uses better-sqlite3 for synchronous, high-performance access.
// WAL mode for crash safety; schema auto-created on first run.
//
// Depends on: better-sqlite3, config.ts
// Used by:    db/playerQueries.ts, index.ts

import Database from "better-sqlite3";
import { config } from "../config.js";

let db: Database.Database | null = null;

/**
 * Get the singleton database connection. Creates and initializes
 * the database on first call.
 *
 * @param dbPath - Override path (used by tests with ":memory:").
 */
export function getDb(dbPath?: string): Database.Database {
  if (!db) {
    db = new Database(dbPath ?? config.dbPath);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    initSchema(db);
  }
  return db;
}

function initSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS players (
      id            TEXT PRIMARY KEY,
      name          TEXT NOT NULL,
      creature_type TEXT NOT NULL DEFAULT 'otter',
      created_at    INTEGER NOT NULL DEFAULT (unixepoch()),
      last_seen     INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE INDEX IF NOT EXISTS idx_players_name ON players(name);
  `);
  console.log("[db] schema initialized");
}

/** Close the database connection. Call on graceful shutdown. */
export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
    console.log("[db] closed");
  }
}
