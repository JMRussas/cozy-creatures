// Cozy Creatures - Creature Shadow Blob
//
// Circular shadow mesh placed on the ground under each creature.
// Geometry and material are shared singletons across all instances.
//
// Depends on: three, config (CREATURE_GEOMETRY)
// Used by:    creatures/Creature.tsx, creatures/RemoteCreature.tsx

import * as THREE from "three";
import { CREATURE_GEOMETRY } from "../config";

const shadowGeometry = new THREE.CircleGeometry(
  CREATURE_GEOMETRY.shadowRadius,
  CREATURE_GEOMETRY.shadowSegments,
);
const shadowMaterial = new THREE.MeshBasicMaterial({
  color: "#000000",
  transparent: true,
  opacity: CREATURE_GEOMETRY.shadowOpacity,
});

export default function CreatureShadow() {
  return (
    <mesh
      rotation-x={-Math.PI / 2}
      position={[0, 0.01, 0]}
      geometry={shadowGeometry}
      material={shadowMaterial}
    />
  );
}
