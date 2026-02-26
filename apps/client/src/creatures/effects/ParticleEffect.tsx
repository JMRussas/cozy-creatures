// Cozy Creatures - Particle Effect (Legendary Skins)
//
// GPU-driven particle system using Three.js Points with custom ShaderMaterial.
// Supports sparkle, glow, flame, and hearts effect types. Particles are updated
// per frame and rendered with additive blending.
//
// Depends on: react, three, @react-three/fiber, @cozy/shared
// Used by:    creatures/CreatureModel.tsx

import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { SkinParticleEffect } from "@cozy/shared";

interface ParticleEffectProps {
  effect: SkinParticleEffect;
}

const PARTICLE_COUNTS: Record<string, number> = {
  sparkle: 48,
  glow: 32,
  flame: 40,
  hearts: 24,
};

// --- Shaders ---

const VERT_SHADER = /* glsl */ `
attribute float aLife;
attribute float aMaxLife;
varying float vLife;

void main() {
  vLife = aLife / aMaxLife;
  vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = mix(1.0, 5.0, vLife) * (250.0 / -mvPos.z);
  gl_Position = projectionMatrix * mvPos;
}
`;

const FRAG_SHADER = /* glsl */ `
uniform vec3 uColor;
varying float vLife;

void main() {
  float dist = length(gl_PointCoord - vec2(0.5));
  if (dist > 0.5) discard;
  float alpha = smoothstep(0.5, 0.15, dist) * vLife * 0.8;
  gl_FragColor = vec4(uColor, alpha);
}
`;

// --- Spawn behaviors ---

function spawnSparkle(
  pos: Float32Array,
  vel: Float32Array,
  life: Float32Array,
  maxLife: Float32Array,
  i: number,
) {
  const i3 = i * 3;
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.random() * Math.PI;
  const r = 0.15 + Math.random() * 0.25;
  pos[i3] = Math.sin(phi) * Math.cos(theta) * r;
  pos[i3 + 1] = 0.3 + Math.sin(phi) * Math.sin(theta) * r;
  pos[i3 + 2] = Math.cos(phi) * r;
  vel[i3] = (Math.random() - 0.5) * 0.02;
  vel[i3 + 1] = 0.03 + Math.random() * 0.04;
  vel[i3 + 2] = (Math.random() - 0.5) * 0.02;
  const ml = 0.5 + Math.random() * 1.0;
  maxLife[i] = ml;
  life[i] = ml;
}

function spawnGlow(
  pos: Float32Array,
  vel: Float32Array,
  life: Float32Array,
  maxLife: Float32Array,
  i: number,
) {
  const i3 = i * 3;
  const angle = Math.random() * Math.PI * 2;
  const r = 0.2 + Math.random() * 0.1;
  pos[i3] = Math.cos(angle) * r;
  pos[i3 + 1] = 0.4 + Math.random() * 0.2;
  pos[i3 + 2] = Math.sin(angle) * r;
  vel[i3] = -Math.sin(angle) * 0.015;
  vel[i3 + 1] = 0.005;
  vel[i3 + 2] = Math.cos(angle) * 0.015;
  const ml = 1.0 + Math.random() * 2.0;
  maxLife[i] = ml;
  life[i] = ml;
}

function spawnFlame(
  pos: Float32Array,
  vel: Float32Array,
  life: Float32Array,
  maxLife: Float32Array,
  i: number,
) {
  const i3 = i * 3;
  pos[i3] = (Math.random() - 0.5) * 0.1;
  pos[i3 + 1] = 0.05;
  pos[i3 + 2] = (Math.random() - 0.5) * 0.1;
  vel[i3] = (Math.random() - 0.5) * 0.01;
  vel[i3 + 1] = 0.05 + Math.random() * 0.05;
  vel[i3 + 2] = (Math.random() - 0.5) * 0.01;
  const ml = 0.4 + Math.random() * 0.6;
  maxLife[i] = ml;
  life[i] = ml;
}

function spawnHearts(
  pos: Float32Array,
  vel: Float32Array,
  life: Float32Array,
  maxLife: Float32Array,
  i: number,
) {
  const i3 = i * 3;
  pos[i3] = (Math.random() - 0.5) * 0.15;
  pos[i3 + 1] = 0.8 + Math.random() * 0.2;
  pos[i3 + 2] = (Math.random() - 0.5) * 0.15;
  vel[i3] = Math.sin(i * 0.7) * 0.01;
  vel[i3 + 1] = 0.02 + Math.random() * 0.02;
  vel[i3 + 2] = Math.cos(i * 0.7) * 0.01;
  const ml = 1.5 + Math.random() * 1.5;
  maxLife[i] = ml;
  life[i] = ml;
}

const SPAWN_FNS: Record<
  string,
  (pos: Float32Array, vel: Float32Array, life: Float32Array, maxLife: Float32Array, i: number) => void
> = {
  sparkle: spawnSparkle,
  glow: spawnGlow,
  flame: spawnFlame,
  hearts: spawnHearts,
};

export default function ParticleEffect({ effect }: ParticleEffectProps) {
  const count = PARTICLE_COUNTS[effect.type] ?? 32;
  const spawnFn = SPAWN_FNS[effect.type] ?? spawnSparkle;
  const pointsRef = useRef<THREE.Points>(null);

  const { geometry, material, velArray, lifeArray, maxLifeArray } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const lives = new Float32Array(count);
    const maxLives = new Float32Array(count);

    // Initialize all particles
    for (let i = 0; i < count; i++) {
      spawnFn(positions, velocities, lives, maxLives, i);
      // Stagger initial life so particles don't all spawn at once
      lives[i] = Math.random() * maxLives[i]!;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aLife", new THREE.BufferAttribute(lives, 1));
    geo.setAttribute("aMaxLife", new THREE.BufferAttribute(maxLives, 1));

    const color = new THREE.Color(effect.color);
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: color },
      },
      vertexShader: VERT_SHADER,
      fragmentShader: FRAG_SHADER,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    return { geometry: geo, material: mat, velArray: velocities, lifeArray: lives, maxLifeArray: maxLives };
  }, [count, spawnFn, effect.color]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  // Update particles each frame
  useFrame((_, delta) => {
    const posAttr = geometry.getAttribute("position") as THREE.BufferAttribute;
    const lifeAttr = geometry.getAttribute("aLife") as THREE.BufferAttribute;
    const pos = posAttr.array as Float32Array;
    const life = lifeAttr.array as Float32Array;

    for (let i = 0; i < count; i++) {
      life[i] = life[i]! - delta;

      if (life[i]! <= 0) {
        // Respawn
        spawnFn(pos, velArray, lifeArray, maxLifeArray, i);
        life[i] = lifeArray[i]!;
      } else {
        // Update position
        const i3 = i * 3;
        pos[i3] = pos[i3]! + velArray[i3]! * delta * effect.intensity;
        pos[i3 + 1] = pos[i3 + 1]! + velArray[i3 + 1]! * delta * effect.intensity;
        pos[i3 + 2] = pos[i3 + 2]! + velArray[i3 + 2]! * delta * effect.intensity;
      }
    }

    posAttr.needsUpdate = true;
    lifeAttr.needsUpdate = true;
  });

  return <points ref={pointsRef} geometry={geometry} material={material} />;
}

/** Exported for test validation. */
export { PARTICLE_COUNTS };
