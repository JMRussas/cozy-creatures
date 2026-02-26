// Cozy Creatures - Room Constants
//
// Predefined room configurations.
//
// Depends on: types/room.ts, constants/config.ts
// Used by:    client room browser, server room manager

import type { RoomConfig } from "../types/room.js";
import { DEFAULT_MAX_PLAYERS } from "./config.js";

export const ROOMS = {
  "cozy-cafe": {
    id: "cozy-cafe",
    name: "Cozy Cafe",
    theme: "cozy-cafe",
    maxPlayers: DEFAULT_MAX_PLAYERS,
    description: "Warm lighting, tiny tables, and the smell of coffee.",
  },
  "rooftop-garden": {
    id: "rooftop-garden",
    name: "Rooftop Garden",
    theme: "rooftop-garden",
    maxPlayers: DEFAULT_MAX_PLAYERS,
    description: "Plants, fairy lights, and a sunset view.",
  },
  "starlight-lounge": {
    id: "starlight-lounge",
    name: "Starlight Lounge",
    theme: "starlight-lounge",
    maxPlayers: DEFAULT_MAX_PLAYERS,
    description: "Dark purple ambiance with constellations on the floor.",
  },
} satisfies Record<string, RoomConfig>;

/** Union of valid room IDs (e.g. "cozy-cafe" | "rooftop-garden" | "starlight-lounge"). */
export type RoomId = keyof typeof ROOMS;

export const DEFAULT_ROOM: RoomId = "cozy-cafe";
