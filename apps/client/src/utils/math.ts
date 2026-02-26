// Cozy Creatures - Math Utilities
//
// Shared math helpers for 3D scene code.
//
// Depends on: three
// Used by:    creatures/Creature.tsx, creatures/RemoteCreature.tsx

import * as THREE from "three";

/** Angle-aware lerp that always takes the shortest path around the circle. */
export function lerpAngle(current: number, target: number, t: number): number {
  const delta =
    THREE.MathUtils.euclideanModulo(target - current + Math.PI, 2 * Math.PI) -
    Math.PI;
  return current + delta * t;
}
