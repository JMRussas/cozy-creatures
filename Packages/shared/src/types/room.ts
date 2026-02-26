// Cozy Creatures - Room Types
//
// Room data structures for lobby, room browser, and room state.
//
// Depends on: player.ts
// Used by:    client room store, server room manager

import type { Player } from "./player.js";

export interface RoomInfo {
  id: string;
  name: string;
  theme: string;
  playerCount: number;
  maxPlayers: number;
  thumbnailPath?: string;
}

export interface RoomState {
  id: string;
  name: string;
  theme: string;
  maxPlayers: number;
  players: Record<string, Player>;
}
