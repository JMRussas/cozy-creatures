// Cozy Creatures - Accessory Attacher
//
// Imperatively attaches procedural accessory meshes to creature bones.
// Finds bones by name pattern, creates geometry from factories, and
// parents them to the bone so they follow skeleton animation.
//
// Depends on: three, accessories/boneUtils, accessories/accessoryFactories, @cozy/shared
// Used by:    creatures/CreatureModel.tsx

import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { SkinAccessory } from "@cozy/shared";
import { findBoneByPattern } from "./boneUtils";
import { createAccessory } from "./accessoryFactories";

interface AccessoryAttacherProps {
  /** The cloned creature scene (root Object3D with skeleton). */
  scene: THREE.Object3D;
  /** Accessories to attach from the skin definition. */
  accessories: SkinAccessory[];
}

/**
 * Imperatively attaches accessories to creature bones. Not a visual R3F component —
 * works by adding Three.js objects directly to the bone hierarchy.
 */
export default function AccessoryAttacher({ scene, accessories }: AccessoryAttacherProps) {
  const attachedRef = useRef<{ obj: THREE.Object3D; parent: THREE.Object3D }[]>([]);

  useEffect(() => {
    const attached: { obj: THREE.Object3D; parent: THREE.Object3D }[] = [];

    for (const acc of accessories) {
      const obj = createAccessory(acc.type);
      if (!obj) {
        console.warn(`[AccessoryAttacher] Unknown accessory type: ${acc.type}`);
        continue;
      }

      const bone = findBoneByPattern(scene, acc.attachBone);
      if (!bone) {
        console.warn(`[AccessoryAttacher] Bone not found for pattern: ${acc.attachBone}`);
        continue;
      }

      // Apply offset, rotation, scale from definition
      if (acc.offset) {
        obj.position.set(acc.offset[0], acc.offset[1], acc.offset[2]);
      }
      if (acc.rotation) {
        obj.rotation.set(acc.rotation[0], acc.rotation[1], acc.rotation[2]);
      }
      if (acc.scale) {
        obj.scale.set(acc.scale[0], acc.scale[1], acc.scale[2]);
      }

      // Enable shadow casting on accessory meshes
      obj.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          child.castShadow = true;
        }
      });

      bone.add(obj);
      attached.push({ obj, parent: bone });
    }

    attachedRef.current = attached;

    // Cleanup: remove clones from bone hierarchy.
    // Geometry/materials are shared with the template cache — do NOT dispose them.
    return () => {
      for (const { obj, parent } of attachedRef.current) {
        parent.remove(obj);
      }
      attachedRef.current = [];
    };
  }, [scene, accessories]);

  // This component doesn't render anything in the R3F tree —
  // it works imperatively on the existing scene graph.
  return null;
}
