// Cozy Creatures - Room Types
//
// Room data structures for lobby, room browser, room state, and room config.
// Includes environment definitions (walkable bounds, sit spots) for Stage 6.
//
// Depends on: player.ts
// Used by:    client room store, server room manager, constants/rooms.ts,
//             scene/environments/*, creatures/Creature.tsx

import type { Player, Position } from "./player.js";

/** Shared base fields for all room representations. */
export interface RoomBase {
  id: string;
  name: string;
  theme: string;
  maxPlayers: number;
}

/** Axis-aligned rectangular walkable boundary. */
export interface WalkableBounds {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

/** A designated spot where a creature can sit. */
export interface SitSpot {
  id: string;
  position: Position;
  /** Y-axis rotation (radians) the creature faces when sitting. */
  rotation: number;
  /** Display label shown on hover (e.g. "Table", "Bench"). */
  label: string;
  /** Animation to play when sitting (defaults to "rest"). */
  animation?: string;
}

/** Circular obstacle (tables, pillows, rotated sofas). */
export interface CircleObstacle {
  type: "circle";
  x: number;
  z: number;
  radius: number;
}

/** Axis-aligned box obstacle (bars, couches, benches). */
export interface AABBObstacle {
  type: "aabb";
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

/** A ground-level furniture collision shape. */
export type Obstacle = CircleObstacle | AABBObstacle;

/** Per-room environment data used by the client to render the 3D scene. */
export interface RoomEnvironment {
  /** Walkable boundary rectangle. Movement is clamped to this area. */
  bounds: WalkableBounds;
  /** Interactive sit spots in this room. */
  sitSpots: SitSpot[];
  /** Ground-level furniture collision shapes. */
  obstacles: Obstacle[];
}

/** Static room definition used in the ROOMS constant. */
export interface RoomConfig extends RoomBase {
  description: string;
  environment: RoomEnvironment;
}

export interface RoomInfo extends RoomBase {
  playerCount: number;
  thumbnailPath?: string;
}

export interface RoomState extends RoomBase {
  players: Record<string, Player>;
}
