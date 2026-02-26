// Cozy Creatures - Audio Range Ring
//
// Subtle visual ring around the local player showing spatial audio range.
// Only visible to the local player when spatial mode is enabled.
// Geometry and material are shared singletons.
//
// Depends on: three, stores/voiceStore,
//             @cozy/shared (VOICE_SPATIAL_MAX_DISTANCE)
// Used by:    creatures/Creature.tsx

import * as THREE from "three";
import { VOICE_SPATIAL_MAX_DISTANCE } from "@cozy/shared";
import { useVoiceStore } from "../../stores/voiceStore";

const ringGeometry = new THREE.RingGeometry(
  VOICE_SPATIAL_MAX_DISTANCE - 0.1,
  VOICE_SPATIAL_MAX_DISTANCE,
  64,
);
const ringMaterial = new THREE.MeshBasicMaterial({
  color: "#4ade80",
  transparent: true,
  opacity: 0.15,
  side: THREE.DoubleSide,
});

export default function AudioRangeRing() {
  const spatialEnabled = useVoiceStore((s) => s.spatialEnabled);

  return (
    <group visible={spatialEnabled}>
      <mesh
        rotation-x={-Math.PI / 2}
        position={[0, 0.02, 0]}
        geometry={ringGeometry}
        material={ringMaterial}
      />
    </group>
  );
}
