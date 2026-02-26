// Cozy Creatures - Room Types
//
// Room data structures for lobby, room browser, room state, and room config.
//
// Depends on: player.ts
// Used by:    client room store, server room manager, constants/rooms.ts

import type { Player } from "./player.js";

/** Shared base fields for all room representations. */
export interface RoomBase {
  id: string;
  name: string;
  theme: string;
  maxPlayers: number;
}

/** Static room definition used in the ROOMS constant. */
export interface RoomConfig extends RoomBase {
  description: string;
}

export interface RoomInfo extends RoomBase {
  playerCount: number;
  thumbnailPath?: string;
}

export interface RoomState extends RoomBase {
  players: Record<string, Player>;
}
