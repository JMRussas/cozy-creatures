// Cozy Creatures - Room Constants
//
// Predefined room configurations with environment data (bounds, sit spots,
// obstacle collision shapes).
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
        // Table 1 chairs (4 around table at [-3, -2])
        { id: "cafe-table-1-n", position: { x: -3, y: 0, z: -2.85 }, rotation: 0, label: "Chair", animation: "eat" },
        { id: "cafe-table-1-s", position: { x: -3, y: 0, z: -1.15 }, rotation: Math.PI, label: "Chair", animation: "eat" },
        { id: "cafe-table-1-e", position: { x: -2.15, y: 0, z: -2 }, rotation: -Math.PI / 2, label: "Chair", animation: "eat" },
        { id: "cafe-table-1-w", position: { x: -3.85, y: 0, z: -2 }, rotation: Math.PI / 2, label: "Chair", animation: "eat" },
        // Table 2 chairs (4 around table at [3, -2])
        { id: "cafe-table-2-n", position: { x: 3, y: 0, z: -2.85 }, rotation: 0, label: "Chair", animation: "eat" },
        { id: "cafe-table-2-s", position: { x: 3, y: 0, z: -1.15 }, rotation: Math.PI, label: "Chair", animation: "eat" },
        { id: "cafe-table-2-e", position: { x: 3.85, y: 0, z: -2 }, rotation: -Math.PI / 2, label: "Chair", animation: "eat" },
        { id: "cafe-table-2-w", position: { x: 2.15, y: 0, z: -2 }, rotation: Math.PI / 2, label: "Chair", animation: "eat" },
        // Couch (3 seats across the 3-unit-wide couch, creature rests ON the surface)
        { id: "cafe-couch-l", position: { x: -1, y: 0.2, z: 4.3 }, rotation: Math.PI, label: "Couch", animation: "rest" },
        { id: "cafe-couch-c", position: { x: 0, y: 0.2, z: 4.3 }, rotation: Math.PI, label: "Couch", animation: "rest" },
        { id: "cafe-couch-r", position: { x: 1, y: 0.2, z: 4.3 }, rotation: Math.PI, label: "Couch", animation: "rest" },
        // Bar stools (in front of bar counter)
        { id: "cafe-stool-1", position: { x: -4.3, y: 0, z: 1 }, rotation: Math.PI / 2, label: "Bar Stool", animation: "idle" },
        { id: "cafe-stool-2", position: { x: -4.3, y: 0, z: 3 }, rotation: Math.PI / 2, label: "Bar Stool", animation: "idle" },
      ],
      obstacles: [
        // Round tables + chairs (expanded radius to cover chairs)
        { type: "circle", x: -3, z: -2, radius: 1.1 },
        { type: "circle", x: 3, z: -2, radius: 1.1 },
        // Bar counter (box 1×4 at [-5.5, 0, 2])
        { type: "aabb", minX: -6.0, maxX: -5.0, minZ: 0.0, maxZ: 4.0 },
        // Couch (box 3×0.8 at [0, 0.2, 4.3] + back)
        { type: "aabb", minX: -1.5, maxX: 1.5, minZ: 3.9, maxZ: 4.7 },
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
      obstacles: [
        // Benches (box 1.5×0.5)
        { type: "aabb", minX: -4.75, maxX: -3.25, minZ: -5.25, maxZ: -4.75 },
        { type: "aabb", minX: 3.25, maxX: 4.75, minZ: -5.25, maxZ: -4.75 },
        // Swing frame (legs ~1.2 wide, seat 0.8×0.4 at [-6, 0, 2])
        { type: "aabb", minX: -6.6, maxX: -5.4, minZ: 1.8, maxZ: 2.2 },
        // Interior potted plants (pot r=0.2, foliage r=0.3)
        { type: "circle", x: 0, z: -8, radius: 0.3 },
        { type: "circle", x: -5, z: 6, radius: 0.3 },
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
      obstacles: [
        // Rotated sofas (1.8×0.8 at ±π/4 — circular approximation)
        { type: "circle", x: -3, z: -3, radius: 1.0 },
        { type: "circle", x: 3, z: -3, radius: 1.0 },
        // Floor pillow (cylinder r=0.5 at [0, 0.1, 5])
        { type: "circle", x: 0, z: 5, radius: 0.5 },
        // Bar counter (box 0.8×3 at [6.5, 0, 0])
        { type: "aabb", minX: 6.1, maxX: 6.9, minZ: -1.5, maxZ: 1.5 },
      ],
    },
  },
} satisfies Record<string, RoomConfig>;

/** Union of valid room IDs (e.g. "cozy-cafe" | "rooftop-garden" | "starlight-lounge"). */
export type RoomId = keyof typeof ROOMS;

export const DEFAULT_ROOM: RoomId = "cozy-cafe";
