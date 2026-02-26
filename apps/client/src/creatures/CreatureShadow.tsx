// Cozy Creatures - Creature Shadow Blob
//
// Circular shadow mesh placed on the ground under each creature.
//
// Depends on: config (CREATURE_GEOMETRY)
// Used by:    creatures/Creature.tsx, creatures/RemoteCreature.tsx

import { CREATURE_GEOMETRY } from "../config";

export default function CreatureShadow() {
  return (
    <mesh rotation-x={-Math.PI / 2} position={[0, 0.01, 0]}>
      <circleGeometry
        args={[CREATURE_GEOMETRY.shadowRadius, CREATURE_GEOMETRY.shadowSegments]}
      />
      <meshBasicMaterial
        color="#000000"
        transparent
        opacity={CREATURE_GEOMETRY.shadowOpacity}
      />
    </mesh>
  );
}
