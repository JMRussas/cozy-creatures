// Cozy Creatures - Bone Discovery Utilities
//
// Helpers for finding bones in a glTF skeleton by name pattern. Used by the
// accessory system to attach objects to creature bones at runtime.
//
// Depends on: three
// Used by:    accessories/AccessoryAttacher.tsx

import * as THREE from "three";

/**
 * Find a bone in an Object3D hierarchy by case-insensitive substring match.
 * Returns the first bone whose name contains the pattern.
 */
export function findBoneByPattern(
  root: THREE.Object3D,
  pattern: string,
): THREE.Bone | null {
  const lower = pattern.toLowerCase();
  let found: THREE.Bone | null = null;

  root.traverse((child) => {
    if (found) return;
    if ((child as THREE.Bone).isBone && child.name.toLowerCase().includes(lower)) {
      found = child as THREE.Bone;
    }
  });

  return found;
}

/**
 * Find the Skeleton instance within a scene graph.
 * Returns the first SkinnedMesh's skeleton, or null.
 */
export function findSkeleton(root: THREE.Object3D): THREE.Skeleton | null {
  let skeleton: THREE.Skeleton | null = null;

  root.traverse((child) => {
    if (skeleton) return;
    if ((child as THREE.SkinnedMesh).isSkinnedMesh) {
      skeleton = (child as THREE.SkinnedMesh).skeleton;
    }
  });

  return skeleton;
}
