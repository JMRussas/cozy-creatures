// Cozy Creatures - Player Types
//
// Core player data structures shared between client and server.
//
// Depends on: constants/creatures.ts, constants/rooms.ts
// Used by:    client stores, server room management

import type { CreatureTypeId } from "../constants/creatures.js";
import type { RoomId } from "../constants/rooms.js";
import type { SkinId } from "../constants/skins.js";

/** 3D world-space position. */
export interface Position {
  x: number;
  y: number;
  z: number;
}

/** Runtime player state — one per connected socket. */
export interface Player {
  id: string;
  name: string;
  creatureType: CreatureTypeId;
  position: Position;
  roomId: RoomId;
  /** Stage 4+ — cosmetic skin override. */
  skinId?: SkinId;
}

/** Persistent player profile — Stage 4+ (user account system). */
export interface PlayerProfile {
  id: string;
  name: string;
  creatureType: CreatureTypeId;
  equippedSkinId?: SkinId;
  createdAt: number;
}
