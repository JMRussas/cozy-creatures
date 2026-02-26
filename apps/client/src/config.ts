// Cozy Creatures - Client Config
//
// Visual and gameplay constants for the client. Extracted from component files
// to keep magic numbers centralized per project conventions.
//
// Depends on: @cozy/shared (CreatureTypeId)
// Used by:    creatures/*, scene/*, stores/roomStore

import type { CreatureTypeId } from "@cozy/shared";

// --- Movement & Animation ---

/** Local creature movement speed (units/sec). */
export const MOVE_SPEED = 4;

/** Distance at which the creature snaps to its target and stops. */
export const ARRIVAL_THRESHOLD = 0.1;

/** Idle bob oscillation speed (radians/sec). */
export const BOB_SPEED = 2;

/** Idle bob vertical amplitude (units). */
export const BOB_HEIGHT = 0.06;

/** Exponential smoothing speed for local creature rotation. */
export const LOCAL_ROTATION_SPEED = 10;

/** Remote creature position interpolation speed. */
export const REMOTE_LERP_SPEED = 6;

/** Exponential smoothing speed for remote creature rotation. */
export const REMOTE_ROTATION_SPEED = 10;

/** Duration (seconds) of animation crossfade blend between clips. */
export const ANIMATION_CROSSFADE_DURATION = 0.3;

// --- Camera ---

/** Camera offset from the player in isometric view (x, y, z). */
export const CAMERA_OFFSET = { x: 10, y: 10, z: 10 } as const;

/** Camera follow lerp speed. */
export const CAMERA_LERP_SPEED = 3;

/** Camera orthographic zoom level. */
export const CAMERA_ZOOM = 40;

// --- Creature Visuals ---

/** Color palette per creature type (used for UI accents, name tags, etc.). */
export const CREATURE_COLORS: Record<CreatureTypeId, { body: string; accent: string }> = {
  otter: { body: "#8B6F47", accent: "#6B5335" },
  "red-panda": { body: "#C45A3C", accent: "#8B3A2A" },
  sloth: { body: "#9B8B6B", accent: "#7A6D52" },
  chipmunk: { body: "#C49A6C", accent: "#9B7A52" },
  possum: { body: "#B8A088", accent: "#8F7D68" },
  pangolin: { body: "#A89070", accent: "#8B7558" },
};

/** Creature geometry constants. */
export const CREATURE_GEOMETRY = {
  bodyRadius: 0.3,
  bodyLength: 0.3,
  bodyRadialSegments: 8,
  bodyHeightSegments: 16,
  bodyY: 0.5,
  earRadius: 0.08,
  earHeight: 0.25,
  earSegments: 8,
  earY: 1.05,
  earSpacing: 0.15,
  eyeRadius: 0.05,
  eyeSegments: 8,
  eyeY: 0.65,
  eyeZ: 0.28,
  eyeSpacing: 0.1,
  eyeColor: "#2d2d2d",
  roughness: 0.7,
  shadowRadius: 0.3,
  shadowSegments: 16,
  shadowOpacity: 0.15,
} as const;

// --- Ground ---

/** Ground plane size (width and height in world units). */
export const GROUND_SIZE = 50;

/** Grid visual settings. */
export const GRID = {
  cellSize: 1,
  cellThickness: 0.5,
  cellColor: "#4a3f6b",
  sectionSize: 5,
  sectionThickness: 1,
  sectionColor: "#6b5b95",
  fadeDistance: 30,
  fadeStrength: 1,
} as const;

// --- Lighting ---

/** Lighting configuration. */
export const LIGHTING = {
  ambient: { intensity: 0.6, color: "#ffe4c9" },
  main: {
    position: [8, 12, 4] as const,
    intensity: 1.0,
    color: "#fff5e6",
    shadowMapSize: 1024,
    shadowCameraFar: 50,
    shadowCameraExtent: 15,
  },
  fill: {
    position: [-6, 8, -4] as const,
    intensity: 0.3,
    color: "#c9d6ff",
  },
} as const;
