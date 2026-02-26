// Cozy Creatures - Creature Model (shared mesh)
//
// The visual mesh hierarchy for a creature: body capsule, ears, eyes.
// Used by both Creature (local) and RemoteCreature. Materials are cached
// via useMemo to avoid creating new instances on every render.
//
// Depends on: react, three, config
// Used by:    creatures/Creature.tsx, creatures/RemoteCreature.tsx

import { forwardRef, useEffect, useMemo } from "react";
import * as THREE from "three";
import { CREATURE_GEOMETRY as CG } from "../config";

interface CreatureModelProps {
  /** Primary body color. */
  bodyColor: string;
  /** Ear accent color (slightly darker than body). */
  earColor: string;
}

/** Shared eye material — eye color never changes between creatures. */
const eyeMaterial = new THREE.MeshStandardMaterial({ color: CG.eyeColor });

const CreatureModel = forwardRef<THREE.Group, CreatureModelProps>(
  function CreatureModel({ bodyColor, earColor }, ref) {
    const bodyMat = useMemo(
      () => new THREE.MeshStandardMaterial({ color: bodyColor, roughness: CG.roughness }),
      [bodyColor],
    );
    const earMat = useMemo(
      () => new THREE.MeshStandardMaterial({ color: earColor, roughness: CG.roughness }),
      [earColor],
    );

    // Dispose GPU materials when they are replaced or the component unmounts
    useEffect(() => () => { bodyMat.dispose(); }, [bodyMat]);
    useEffect(() => () => { earMat.dispose(); }, [earMat]);

    return (
      <group ref={ref}>
        {/* Body — rounded capsule-ish shape */}
        <mesh position={[0, CG.bodyY, 0]} castShadow>
          <capsuleGeometry args={[CG.bodyRadius, CG.bodyLength, CG.bodyRadialSegments, CG.bodyHeightSegments]} />
          <primitive object={bodyMat} attach="material" />
        </mesh>

        {/* Left ear */}
        <mesh position={[-CG.earSpacing, CG.earY, 0]} castShadow>
          <coneGeometry args={[CG.earRadius, CG.earHeight, CG.earSegments]} />
          <primitive object={earMat} attach="material" />
        </mesh>

        {/* Right ear */}
        <mesh position={[CG.earSpacing, CG.earY, 0]} castShadow>
          <coneGeometry args={[CG.earRadius, CG.earHeight, CG.earSegments]} />
          <primitive object={earMat} attach="material" />
        </mesh>

        {/* Left eye */}
        <mesh position={[-CG.eyeSpacing, CG.eyeY, CG.eyeZ]}>
          <sphereGeometry args={[CG.eyeRadius, CG.eyeSegments, CG.eyeSegments]} />
          <primitive object={eyeMaterial} attach="material" />
        </mesh>

        {/* Right eye */}
        <mesh position={[CG.eyeSpacing, CG.eyeY, CG.eyeZ]}>
          <sphereGeometry args={[CG.eyeRadius, CG.eyeSegments, CG.eyeSegments]} />
          <primitive object={eyeMaterial} attach="material" />
        </mesh>
      </group>
    );
  },
);

export default CreatureModel;
