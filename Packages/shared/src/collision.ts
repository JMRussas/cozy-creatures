// Cozy Creatures - Collision Detection
//
// Pure functions for obstacle collision testing and resolution.
// Used by the client for movement clamping and click targets.
//
// Depends on: types/room.ts (Obstacle, CircleObstacle, AABBObstacle, WalkableBounds)
// Used by:    client (Creature.tsx, ClickPlane.tsx)

import type {
  Obstacle,
  CircleObstacle,
  AABBObstacle,
  WalkableBounds,
} from "./types/room.js";

/** Creature body collision radius (slightly larger than visual). */
export const CREATURE_COLLISION_RADIUS = 0.35;

/** Small epsilon to push resolved positions just outside the boundary. */
const RESOLVE_EPSILON = 0.01;

/**
 * Resolve a circle obstacle collision. Returns the nearest point on the
 * expanded circle boundary, or null if no collision.
 */
function resolveCircle(
  px: number,
  pz: number,
  obs: CircleObstacle,
  creatureRadius: number,
): { x: number; z: number } | null {
  const dx = px - obs.x;
  const dz = pz - obs.z;
  const distSq = dx * dx + dz * dz;
  const totalRadius = obs.radius + creatureRadius;

  if (distSq >= totalRadius * totalRadius) return null;

  const dist = Math.sqrt(distSq);
  if (dist < 0.0001) {
    // Dead center — push along +X arbitrarily
    return { x: obs.x + totalRadius + RESOLVE_EPSILON, z: obs.z };
  }

  const nx = dx / dist;
  const nz = dz / dist;
  return {
    x: obs.x + nx * (totalRadius + RESOLVE_EPSILON),
    z: obs.z + nz * (totalRadius + RESOLVE_EPSILON),
  };
}

/**
 * Resolve an AABB obstacle collision. Returns the nearest point on the
 * expanded AABB boundary, or null if no collision.
 */
function resolveAABB(
  px: number,
  pz: number,
  obs: AABBObstacle,
  creatureRadius: number,
): { x: number; z: number } | null {
  const eMinX = obs.minX - creatureRadius;
  const eMaxX = obs.maxX + creatureRadius;
  const eMinZ = obs.minZ - creatureRadius;
  const eMaxZ = obs.maxZ + creatureRadius;

  if (px < eMinX || px > eMaxX || pz < eMinZ || pz > eMaxZ) return null;

  // Push toward the nearest edge
  const dLeft = px - eMinX;
  const dRight = eMaxX - px;
  const dTop = pz - eMinZ;
  const dBottom = eMaxZ - pz;
  const minD = Math.min(dLeft, dRight, dTop, dBottom);

  if (minD === dLeft) return { x: eMinX - RESOLVE_EPSILON, z: pz };
  if (minD === dRight) return { x: eMaxX + RESOLVE_EPSILON, z: pz };
  if (minD === dTop) return { x: px, z: eMinZ - RESOLVE_EPSILON };
  return { x: px, z: eMaxZ + RESOLVE_EPSILON };
}

/**
 * Resolve all obstacle collisions for a position. Iterates obstacles and
 * pushes the point out of any it overlaps. Multiple passes handle cases
 * where resolving one collision pushes into another.
 */
export function resolveCollisions(
  px: number,
  pz: number,
  obstacles: readonly Obstacle[],
  creatureRadius: number = CREATURE_COLLISION_RADIUS,
): { x: number; z: number } {
  let x = px;
  let z = pz;

  for (let pass = 0; pass < 3; pass++) {
    let resolved = false;
    for (const obs of obstacles) {
      const result =
        obs.type === "circle"
          ? resolveCircle(x, z, obs, creatureRadius)
          : resolveAABB(x, z, obs, creatureRadius);
      if (result) {
        x = result.x;
        z = result.z;
        resolved = true;
      }
    }
    if (!resolved) break;
  }

  return { x, z };
}

/**
 * Clamp a position to room bounds AND resolve obstacle collisions.
 */
export function clampAndResolve(
  px: number,
  pz: number,
  bounds: WalkableBounds,
  obstacles: readonly Obstacle[],
  creatureRadius: number = CREATURE_COLLISION_RADIUS,
): { x: number; z: number } {
  // Clamp to bounds first
  let x = Math.max(bounds.minX, Math.min(bounds.maxX, px));
  let z = Math.max(bounds.minZ, Math.min(bounds.maxZ, pz));

  // Resolve obstacles
  const resolved = resolveCollisions(x, z, obstacles, creatureRadius);
  x = resolved.x;
  z = resolved.z;

  // Re-clamp to bounds (obstacle resolution may push outside)
  x = Math.max(bounds.minX, Math.min(bounds.maxX, x));
  z = Math.max(bounds.minZ, Math.min(bounds.maxZ, z));

  return { x, z };
}
