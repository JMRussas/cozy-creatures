// Cozy Creatures - Creature Fallback (Suspense placeholder)
//
// Procedural capsule+cones+eyes mesh shown while glTF models load.
// Extracted from the original CreatureModel. Used as the <Suspense>
// fallback in Creature and RemoteCreature.
//
// Depends on: react, three, config
// Used by:    creatures/Creature.tsx, creatures/RemoteCreature.tsx

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { CREATURE_GEOMETRY as CG, CREATURE_COLORS } from "../config";
import type { CreatureTypeId } from "@cozy/shared";

interface CreatureFallbackProps {
  creatureType: CreatureTypeId;
}

const eyeMaterial = new THREE.MeshStandardMaterial({ color: CG.eyeColor });

export default function CreatureFallback({ creatureType }: CreatureFallbackProps) {
  const colors = CREATURE_COLORS[creatureType];

  const bodyMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: colors.body, roughness: CG.roughness }),
    [colors.body],
  );
  const accentMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: colors.accent, roughness: CG.roughness }),
    [colors.accent],
  );

  useEffect(() => () => { bodyMat.dispose(); }, [bodyMat]);
  useEffect(() => () => { accentMat.dispose(); }, [accentMat]);

  return (
    <group>
      {/* Body */}
      <mesh position={[0, CG.bodyY, 0]} castShadow>
        <capsuleGeometry args={[CG.bodyRadius, CG.bodyLength, CG.bodyRadialSegments, CG.bodyHeightSegments]} />
        <primitive object={bodyMat} attach="material" />
      </mesh>

      {/* Left ear */}
      <mesh position={[-CG.earSpacing, CG.earY, 0]} castShadow>
        <coneGeometry args={[CG.earRadius, CG.earHeight, CG.earSegments]} />
        <primitive object={accentMat} attach="material" />
      </mesh>

      {/* Right ear */}
      <mesh position={[CG.earSpacing, CG.earY, 0]} castShadow>
        <coneGeometry args={[CG.earRadius, CG.earHeight, CG.earSegments]} />
        <primitive object={accentMat} attach="material" />
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
}
