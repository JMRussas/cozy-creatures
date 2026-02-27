// Cozy Creatures - Room Constants
//
// Predefined room configurations with environment data (bounds, sit spots).
//
// Depends on: types/room.ts, constants/config.ts
// Used by:    client room browser, server room manager,
//             scene/environments/*, creatures/Creature.tsx

import type { RoomConfig } from "../types/room.js";
import { DEFAULT_MAX_PLAYERS } from "./config.js";

export const ROOMS = {
  "cozy-cafe": {
    id: "cozy-cafe",
    name: "Cozy Cafe",
    theme: "cozy-cafe",
    maxPlayers: DEFAULT_MAX_PLAYERS,
    description: "Warm lighting, tiny tables, and the smell of coffee.",
    environment: {
      bounds: { minX: -8, maxX: 8, minZ: -8, maxZ: 8 },
      sitSpots: [
        { id: "cafe-table-1", position: { x: -3, y: 0, z: -2 }, rotation: 0, label: "Table" },
        { id: "cafe-table-2", position: { x: 3, y: 0, z: -2 }, rotation: Math.PI, label: "Table" },
        { id: "cafe-couch", position: { x: 0, y: 0, z: 4 }, rotation: Math.PI, label: "Couch" },
        { id: "cafe-stool-1", position: { x: -5, y: 0, z: 1 }, rotation: Math.PI / 2, label: "Bar Stool" },
        { id: "cafe-stool-2", position: { x: -5, y: 0, z: 3 }, rotation: Math.PI / 2, label: "Bar Stool" },
      ],
    },
  },
  "rooftop-garden": {
    id: "rooftop-garden",
    name: "Rooftop Garden",
    theme: "rooftop-garden",
    maxPlayers: DEFAULT_MAX_PLAYERS,
    description: "Plants, fairy lights, and a sunset view.",
    environment: {
      bounds: { minX: -10, maxX: 10, minZ: -10, maxZ: 10 },
      sitSpots: [
        { id: "garden-bench-1", position: { x: -4, y: 0, z: -5 }, rotation: 0, label: "Bench" },
        { id: "garden-bench-2", position: { x: 4, y: 0, z: -5 }, rotation: 0, label: "Bench" },
        { id: "garden-cushion", position: { x: 0, y: 0, z: 3 }, rotation: Math.PI / 4, label: "Cushion" },
        { id: "garden-swing", position: { x: -6, y: 0, z: 2 }, rotation: -Math.PI / 4, label: "Swing" },
      ],
    },
  },
  "starlight-lounge": {
    id: "starlight-lounge",
    name: "Starlight Lounge",
    theme: "starlight-lounge",
    maxPlayers: DEFAULT_MAX_PLAYERS,
    description: "Dark purple ambiance with constellations on the floor.",
    environment: {
      bounds: { minX: -9, maxX: 9, minZ: -9, maxZ: 9 },
      sitSpots: [
        { id: "lounge-sofa-1", position: { x: -3, y: 0, z: -3 }, rotation: Math.PI / 4, label: "Sofa" },
        { id: "lounge-sofa-2", position: { x: 3, y: 0, z: -3 }, rotation: -Math.PI / 4, label: "Sofa" },
        { id: "lounge-pillow", position: { x: 0, y: 0, z: 5 }, rotation: Math.PI, label: "Pillow" },
        { id: "lounge-bar", position: { x: 6, y: 0, z: 0 }, rotation: -Math.PI / 2, label: "Bar Seat" },
      ],
    },
  },
} satisfies Record<string, RoomConfig>;

/** Union of valid room IDs (e.g. "cozy-cafe" | "rooftop-garden" | "starlight-lounge"). */
export type RoomId = keyof typeof ROOMS;

export const DEFAULT_ROOM: RoomId = "cozy-cafe";
