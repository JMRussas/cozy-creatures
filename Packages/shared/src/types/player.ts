// Cozy Creatures - Player Types
//
// Core player data structures shared between client and server.
//
// Depends on: constants/creatures.ts, constants/rooms.ts
// Used by:    client stores, server room management

import type { CreatureTypeId } from "../constants/creatures.js";
import type { RoomId } from "../constants/rooms.js";

export interface Position {
  x: number;
  y: number;
  z: number;
}

export interface Player {
  id: string;
  name: string;
  creatureType: CreatureTypeId;
  position: Position;
  roomId: RoomId;
  skinId?: string;
}

export interface PlayerProfile {
  id: string;
  name: string;
  creatureType: CreatureTypeId;
  equippedSkinId?: string;
  createdAt: number;
}
