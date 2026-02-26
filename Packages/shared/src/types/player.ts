// Cozy Creatures - Player Types
//
// Core player data structures shared between client and server.
//
// Depends on: creature.ts
// Used by:    client stores, server room management

export interface Position {
  x: number;
  y: number;
  z: number;
}

export interface Player {
  id: string;
  name: string;
  creatureType: string;
  position: Position;
  roomId: string;
  skinId?: string;
}

export interface PlayerProfile {
  id: string;
  name: string;
  creatureType: string;
  equippedSkinId?: string;
  createdAt: number;
}
