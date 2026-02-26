// Cozy Creatures - Player Database Queries
//
// Prepared statements for player CRUD operations.
// All functions are synchronous (better-sqlite3 is sync by design).
//
// Depends on: db/database.ts, @cozy/shared (CreatureTypeId)
// Used by:    socket/connectionHandler.ts

import type { CreatureTypeId } from "@cozy/shared";
import { getDb } from "./database.js";

export interface StoredPlayer {
  id: string;
  name: string;
  creature_type: string;
  created_at: number;
  last_seen: number;
}

/**
 * Look up a player by name. Returns the most recently seen match,
 * or undefined if no player with that name exists.
 */
export function findPlayerByName(name: string): StoredPlayer | undefined {
  const db = getDb();
  return db
    .prepare("SELECT * FROM players WHERE name = ? ORDER BY last_seen DESC LIMIT 1")
    .get(name) as StoredPlayer | undefined;
}

/** Create a new player record. */
export function createPlayer(
  id: string,
  name: string,
  creatureType: CreatureTypeId,
): void {
  const db = getDb();
  db.prepare("INSERT INTO players (id, name, creature_type) VALUES (?, ?, ?)").run(
    id,
    name,
    creatureType,
  );
}

/** Update a returning player's last_seen timestamp and creature type. */
export function updatePlayerOnJoin(id: string, creatureType: CreatureTypeId): void {
  const db = getDb();
  db.prepare(
    "UPDATE players SET creature_type = ?, last_seen = unixepoch() WHERE id = ?",
  ).run(creatureType, id);
}