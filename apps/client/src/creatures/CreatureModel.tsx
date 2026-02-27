// Cozy Creatures - Creature Model (glTF)
//
// Loads a creature's glTF model via drei useGLTF and plays animations via
// useAnimations. Each instance gets a deep clone (SkeletonUtils.clone) so
// multiple creatures can animate independently. Exposes an imperative
// setAnimation() handle so parents can switch clips without React re-renders.
// When a skinId is provided, applies HSL color shift and renders accessories
// and particle effects from the skin definition.
//
// Depends on: react, three, @react-three/drei, @react-three/fiber,
//             three/examples/jsm/utils/SkeletonUtils, @cozy/shared, config,
//             shaders/hslShader, accessories/AccessoryAttacher, effects/ParticleEffect
// Used by:    creatures/Creature.tsx, creatures/RemoteCreature.tsx

import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF, useAnimations } from "@react-three/drei";
import * as THREE from "three";
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils.js";
import { BASE_ANIMATIONS, CREATURES, SKINS } from "@cozy/shared";
import type { CreatureTypeId, SkinDefinition, SkinId } from "@cozy/shared";
import { ANIMATION_CROSSFADE_DURATION, MODEL_ROTATION_Y } from "../config";
import { applySkinShader, disposeSkinMaterials } from "./shaders/hslShader";
import AccessoryAttacher from "./accessories/AccessoryAttacher";
import ParticleEffect from "./effects/ParticleEffect";

export interface CreatureModelHandle {
  /** Switch to the named animation clip with crossfade. */
  setAnimation: (name: string) => void;
}

interface CreatureModelProps {
  creatureType: CreatureTypeId;
  skinId?: SkinId;
}

/** Only keep base-named animation clips; skip Blender export duplicates (.001, etc.). */
const VALID_ANIM_NAMES = new Set<string>(BASE_ANIMATIONS);

const CreatureModel = forwardRef<CreatureModelHandle, CreatureModelProps>(
  function CreatureModel({ creatureType, skinId }, ref) {
    const definition = CREATURES[creatureType];
    const skin: SkinDefinition | undefined = skinId ? SKINS[skinId] : undefined;
    const { scene, animations: rawAnimations } = useGLTF(definition.modelPath);

    // Filter to only base-named clips (idle, walk, run, etc.) — some glTF files
    // contain Blender export duplicates (idle.001, walk.002) that spam warnings.
    const animations = useMemo(
      () => rawAnimations.filter((clip) => VALID_ANIM_NAMES.has(clip.name)),
      [rawAnimations],
    );

    // Deep-clone scene per instance so skeletons are independent.
    // SkeletonUtils.clone shares geometry/materials with the glTF cache.
    const clone = useMemo(() => SkeletonUtils.clone(scene), [scene]);

    // Dispose clone Object3D wrappers when scene changes or component unmounts.
    // Note: geometries/materials are shared with the cached glTF — do NOT dispose them.
    useEffect(() => {
      return () => {
        clone.traverse((child) => {
          if ((child as THREE.SkinnedMesh).isSkinnedMesh) {
            (child as THREE.SkinnedMesh).skeleton?.dispose();
          }
        });
      };
    }, [clone]);

    // Track cloned materials for disposal + originals for restoration
    const skinMaterialsRef = useRef<THREE.MeshStandardMaterial[]>([]);
    const originalMaterialsRef = useRef<Map<THREE.Mesh, THREE.Material | THREE.Material[]>>(new Map());

    // Enable castShadow on all child meshes + apply skin shader
    useEffect(() => {
      // Dispose previous skin materials and restore originals
      disposeSkinMaterials(skinMaterialsRef.current);
      skinMaterialsRef.current = [];
      for (const [mesh, mat] of originalMaterialsRef.current) {
        mesh.material = mat;
      }
      originalMaterialsRef.current.clear();

      clone.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          child.castShadow = true;
        }
      });

      // Apply HSL color shift if skin is active
      if (skin) {
        // Save original (shared) materials before applySkinShader overwrites them
        clone.traverse((child) => {
          if (!(child as THREE.Mesh).isMesh) return;
          const mesh = child as THREE.Mesh;
          if (Array.isArray(mesh.material)) {
            originalMaterialsRef.current.set(mesh, [...mesh.material]);
          } else {
            originalMaterialsRef.current.set(mesh, mesh.material);
          }
        });
        skinMaterialsRef.current = applySkinShader(clone, skin.colorShift);
      }

      return () => {
        disposeSkinMaterials(skinMaterialsRef.current);
        skinMaterialsRef.current = [];
        for (const [mesh, mat] of originalMaterialsRef.current) {
          mesh.material = mat;
        }
        originalMaterialsRef.current.clear();
      };
    }, [clone, skin]);

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

    const rotationY = MODEL_ROTATION_Y[creatureType] ?? 0;

    return (
      <group ref={groupRef}>
        <primitive object={clone} rotation={[0, rotationY, 0]} />
        {skin && skin.accessories.length > 0 && (
          <AccessoryAttacher scene={clone} accessories={skin.accessories} />
        )}
        {skin?.particleEffect && (
          <ParticleEffect effect={skin.particleEffect} />
        )}
      </group>
    );
  },
);

export default CreatureModel;
