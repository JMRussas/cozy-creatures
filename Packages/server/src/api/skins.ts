// Cozy Creatures - Skins API
//
// REST endpoints for browsing skins, reading player inventory, and equipping.
//
// Depends on: express, @cozy/shared (SKINS, SKIN_SETS),
//             db/playerQueries.ts, db/inventoryQueries.ts
// Used by:    index.ts (Express router mount)

import { Router, type IRouter } from "express";
import { SKINS, SKIN_SETS } from "@cozy/shared";
import { playerExists, getEquippedSkin, setEquippedSkin } from "../db/playerQueries.js";
import { getPlayerInventory, playerOwnsSkin } from "../db/inventoryQueries.js";
import { getDb } from "../db/database.js";

export const skinsRouter: IRouter = Router();

/** GET /api/skins — list all skin definitions and sets. */
skinsRouter.get("/skins", (_req, res) => {
  res.json({
    skins: Object.values(SKINS),
    sets: Object.values(SKIN_SETS),
  });
});

/** GET /api/skins/inventory/:playerId — player's owned skins + equipped skin. */
skinsRouter.get("/skins/inventory/:playerId", (req, res) => {
  try {
    const { playerId } = req.params;

    if (!playerId || typeof playerId !== "string") {
      res.status(400).json({ error: "Missing playerId" });
      return;
    }

    // Verify player exists
    if (!playerExists(playerId)) {
      res.status(404).json({ error: "Player not found" });
      return;
    }

    const items = getPlayerInventory(playerId);
    const equippedSkinId = getEquippedSkin(playerId);

    res.json({
      items: items.map((i) => ({ skinId: i.skin_id, acquiredAt: i.acquired_at })),
      equippedSkinId,
    });
  } catch (err) {
    console.error("[api] skins/inventory error:", err);
    res.status(500).json({ error: "Failed to load inventory" });
  }
});

/** POST /api/skins/equip — equip a skin (or null to unequip). */
skinsRouter.post("/skins/equip", (req, res) => {
  try {
    const body = req.body as Record<string, unknown>;
    const { playerId, skinId } = body;

    // Validate playerId
    if (!playerId || typeof playerId !== "string") {
      res.status(400).json({ error: "Missing or invalid playerId" });
      return;
    }

    // skinId can be null (unequip) or a string
    if (skinId !== null && typeof skinId !== "string") {
      res.status(400).json({ error: "skinId must be a string or null" });
      return;
    }

    // Verify player exists
    const db = getDb();
    const player = db
      .prepare("SELECT id, creature_type FROM players WHERE id = ?")
      .get(playerId) as { id: string; creature_type: string } | undefined;

    if (!player) {
      res.status(404).json({ error: "Player not found" });
      return;
    }

    if (skinId === null) {
      // Unequip
      setEquippedSkin(playerId, null);
      res.json({ success: true, equippedSkinId: null });
      return;
    }

    // Validate skin exists
    if (!(skinId in SKINS)) {
      res.status(400).json({ error: "Unknown skin" });
      return;
    }

    // Validate skin matches player's creature type
    const skin = SKINS[skinId as keyof typeof SKINS];
    if (skin.creatureType !== player.creature_type) {
      res.status(400).json({ error: "Skin does not match creature type" });
      return;
    }

    // Validate player owns the skin
    if (!playerOwnsSkin(playerId, skinId)) {
      res.status(403).json({ error: "Player does not own this skin" });
      return;
    }

    setEquippedSkin(playerId, skinId);
    res.json({ success: true, equippedSkinId: skinId });
  } catch (err) {
    console.error("[api] skins/equip error:", err);
    res.status(500).json({ error: "Failed to equip skin" });
  }
});
