// Cozy Creatures - Inventory Database Queries
//
// CRUD operations for the player_inventory table. Manages skin ownership
// and default skin grants.
//
// Depends on: db/database.ts, @cozy/shared (SKINS, DEFAULT_SKIN_IDS, CreatureTypeId)
// Used by:    api/skins.ts, socket/connectionHandler.ts

import { getDb } from "./database.js";
import { SKINS, DEFAULT_SKIN_IDS } from "@cozy/shared";
import type { CreatureTypeId } from "@cozy/shared";

export interface StoredInventoryItem {
  player_id: string;
  skin_id: string;
  acquired_at: number;
}

/** Get all skins owned by a player. */
export function getPlayerInventory(playerId: string): StoredInventoryItem[] {
  const db = getDb();
  return db
    .prepare("SELECT * FROM player_inventory WHERE player_id = ? ORDER BY acquired_at")
    .all(playerId) as StoredInventoryItem[];
}

/** Add a skin to a player's inventory (idempotent — ignores duplicates). */
export function addToInventory(playerId: string, skinId: string): void {
  const db = getDb();
  db.prepare(
    "INSERT OR IGNORE INTO player_inventory (player_id, skin_id) VALUES (?, ?)",
  ).run(playerId, skinId);
}

/** Check if a player owns a specific skin. */
export function playerOwnsSkin(playerId: string, skinId: string): boolean {
  const db = getDb();
  const row = db
    .prepare("SELECT 1 FROM player_inventory WHERE player_id = ? AND skin_id = ?")
    .get(playerId, skinId);
  return row !== undefined;
}

/** Remove a skin from a player's inventory. Returns true if the row existed. */
export function removeFromInventory(playerId: string, skinId: string): boolean {
  const db = getDb();
  const result = db
    .prepare("DELETE FROM player_inventory WHERE player_id = ? AND skin_id = ?")
    .run(playerId, skinId);
  return result.changes > 0;
}

/**
 * Grant all Common skins for a creature type to a player.
 * Called when a new player is created so they start with some skins.
 */
export function grantDefaultSkins(playerId: string, creatureType: CreatureTypeId): void {
  const db = getDb();
  const stmt = db.prepare(
    "INSERT OR IGNORE INTO player_inventory (player_id, skin_id) VALUES (?, ?)",
  );
  const grantAll = db.transaction(() => {
    for (const skinId of DEFAULT_SKIN_IDS) {
      if (SKINS[skinId].creatureType === creatureType) {
        stmt.run(playerId, skinId);
      }
    }
  });
  grantAll();
}
