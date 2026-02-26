// Cozy Creatures - Creature Model (glTF)
//
// Loads a creature's glTF model via drei useGLTF and plays animations via
// useAnimations. Each instance gets a deep clone (SkeletonUtils.clone) so
// multiple creatures can animate independently. Exposes an imperative
// setAnimation() handle so parents can switch clips without React re-renders.
//
// Depends on: react, three, @react-three/drei, @react-three/fiber,
//             three/examples/jsm/utils/SkeletonUtils, @cozy/shared, config
// Used by:    creatures/Creature.tsx, creatures/RemoteCreature.tsx

import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF, useAnimations } from "@react-three/drei";
import * as THREE from "three";
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils.js";
import { CREATURES } from "@cozy/shared";
import type { CreatureTypeId } from "@cozy/shared";
import { ANIMATION_CROSSFADE_DURATION } from "../config";

export interface CreatureModelHandle {
  /** Switch to the named animation clip with crossfade. */
  setAnimation: (name: string) => void;
}

interface CreatureModelProps {
  creatureType: CreatureTypeId;
}

const CreatureModel = forwardRef<CreatureModelHandle, CreatureModelProps>(
  function CreatureModel({ creatureType }, ref) {
    const definition = CREATURES[creatureType];
    const { scene, animations } = useGLTF(definition.modelPath);

    // Deep-clone scene per instance so skeletons are independent
    const clone = useMemo(() => SkeletonUtils.clone(scene), [scene]);

    // Enable castShadow on all child meshes
    useEffect(() => {
      clone.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          child.castShadow = true;
        }
      });
    }, [clone]);

    const groupRef = useRef<THREE.Group>(null);
    const { actions, mixer } = useAnimations(animations, groupRef);
    const currentAction = useRef<THREE.AnimationAction | null>(null);

    // Start with idle animation
    useEffect(() => {
      const idle = actions["idle"];
      if (idle) {
        idle.reset().play();
        currentAction.current = idle;
      }
    }, [actions]);

    // Expose imperative handle for animation switching
    useImperativeHandle(ref, () => ({
      setAnimation(name: string) {
        const next = actions[name];
        if (!next) return;
        if (next === currentAction.current) return;

        const prev = currentAction.current;
        if (prev) {
          prev.fadeOut(ANIMATION_CROSSFADE_DURATION);
        }
        next.reset().fadeIn(ANIMATION_CROSSFADE_DURATION).play();
        currentAction.current = next;
      },
    }), [actions]);

    // Advance the mixer each frame
    useFrame((_, delta) => {
      mixer.update(delta);
    });

    return (
      <group ref={groupRef}>
        <primitive object={clone} />
      </group>
    );
  },
);

export default CreatureModel;
