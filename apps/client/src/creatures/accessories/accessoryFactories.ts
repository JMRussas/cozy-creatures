// Cozy Creatures - Procedural Accessory Factories
//
// Each factory creates a Three.js Object3D from simple geometry primitives.
// These are placeholder accessories — can later be swapped for proper glTF models.
//
// Depends on: three
// Used by:    accessories/AccessoryAttacher.tsx

import * as THREE from "three";
import type { AccessoryType } from "@cozy/shared";

type AccessoryFactory = () => THREE.Object3D;

function makeStdMat(color: string, opts?: { metalness?: number; roughness?: number; side?: THREE.Side }) {
  return new THREE.MeshStandardMaterial({
    color,
    metalness: opts?.metalness ?? 0,
    roughness: opts?.roughness ?? 0.6,
    side: opts?.side,
  });
}

/** Template cache — one prototype per accessory type, cloned per instance. */
const templateCache = new Map<string, THREE.Object3D>();

/**
 * Get a clone of the accessory for the given type. The template is created
 * once and all clones share its geometry and materials.
 */
export function createAccessory(type: AccessoryType): THREE.Object3D | null {
  let template = templateCache.get(type);
  if (!template) {
    const factory = ACCESSORY_FACTORIES[type];
    if (!factory) return null;
    template = factory();
    templateCache.set(type, template);
  }
  return template.clone();
}

const ACCESSORY_FACTORIES: Record<string, AccessoryFactory> = {
  "top-hat": () => {
    const group = new THREE.Group();
    const brim = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.12, 0.02, 16),
      makeStdMat("#1a1a2e"),
    );
    group.add(brim);
    const crown = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 0.15, 16),
      makeStdMat("#1a1a2e"),
    );
    crown.position.y = 0.085;
    group.add(crown);
    return group;
  },

  "beret": () => {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2),
      makeStdMat("#C45A3C"),
    );
    mesh.scale.set(1, 0.4, 1);
    return mesh;
  },

  "crown": () => {
    const group = new THREE.Group();
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.08, 0.015, 8, 16),
      makeStdMat("#F59E0B", { metalness: 0.8, roughness: 0.2 }),
    );
    ring.rotation.x = Math.PI / 2;
    group.add(ring);
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2;
      const point = new THREE.Mesh(
        new THREE.ConeGeometry(0.015, 0.05, 4),
        makeStdMat("#F59E0B", { metalness: 0.8, roughness: 0.2 }),
      );
      point.position.set(
        Math.cos(angle) * 0.08,
        0.025,
        Math.sin(angle) * 0.08,
      );
      group.add(point);
    }
    return group;
  },

  "scarf": () => {
    const mesh = new THREE.Mesh(
      new THREE.TorusGeometry(0.07, 0.025, 8, 16),
      makeStdMat("#E8594F"),
    );
    mesh.rotation.x = Math.PI / 2;
    return mesh;
  },

  "flower-crown": () => {
    const group = new THREE.Group();
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.09, 0.01, 8, 16),
      makeStdMat("#4ADE80"),
    );
    ring.rotation.x = Math.PI / 2;
    group.add(ring);
    const colors = ["#F472B6", "#FB923C", "#FBBF24", "#A78BFA", "#F87171"];
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2;
      const flower = new THREE.Mesh(
        new THREE.SphereGeometry(0.02, 8, 8),
        makeStdMat(colors[i]!),
      );
      flower.position.set(
        Math.cos(angle) * 0.09,
        0.01,
        Math.sin(angle) * 0.09,
      );
      group.add(flower);
    }
    return group;
  },

  "backpack": () => {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.1, 0.06),
      makeStdMat("#8B5CF6"),
    );
    return mesh;
  },

  "cape": () => {
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(0.2, 0.25, 1, 4),
      makeStdMat("#6D28D9", { side: THREE.DoubleSide }),
    );
    return mesh;
  },

  "nightcap": () => {
    const group = new THREE.Group();
    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(0.06, 0.2, 8),
      makeStdMat("#312E81"),
    );
    cone.rotation.z = 0.3;
    group.add(cone);
    // Pom-pom at the tip
    const pom = new THREE.Mesh(
      new THREE.SphereGeometry(0.025, 8, 8),
      makeStdMat("#E2E8F0"),
    );
    pom.position.set(Math.sin(0.3) * 0.2, Math.cos(0.3) * 0.2, 0);
    group.add(pom);
    return group;
  },

  "tiny-shield": () => {
    const mesh = new THREE.Mesh(
      new THREE.CircleGeometry(0.06, 6),
      makeStdMat("#94A3B8", { metalness: 0.7, roughness: 0.3, side: THREE.DoubleSide }),
    );
    return mesh;
  },

  "rose": () => {
    const group = new THREE.Group();
    // Petals (layered spheres)
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const petal = new THREE.Mesh(
        new THREE.SphereGeometry(0.015, 8, 8),
        makeStdMat("#F43F5E"),
      );
      petal.position.set(Math.cos(angle) * 0.015, 0, Math.sin(angle) * 0.015);
      group.add(petal);
    }
    // Center
    const center = new THREE.Mesh(
      new THREE.SphereGeometry(0.012, 8, 8),
      makeStdMat("#FCA5A5"),
    );
    center.position.y = 0.005;
    group.add(center);
    // Stem
    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.003, 0.003, 0.05, 4),
      makeStdMat("#16A34A"),
    );
    stem.position.y = -0.03;
    group.add(stem);
    return group;
  },
};
