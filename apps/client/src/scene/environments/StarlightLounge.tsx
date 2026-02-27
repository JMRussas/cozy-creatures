// Cozy Creatures - Starlight Lounge Environment
//
// Procedural lounge: dark purple ground, glowing orbs, constellation floor
// effect, low sofas, neon accent strips, bar counter.
//
// Depends on: @cozy/shared (ROOMS), scene/environments/RoomLighting,
//             ClickPlane, SitSpotMarker
// Used by:    scene/environments/RoomEnvironment.tsx

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { ROOMS } from "@cozy/shared";
import RoomLighting from "./RoomLighting";
import ClickPlane from "./ClickPlane";
import SitSpotMarkers from "./SitSpotMarker";

const ENV = ROOMS["starlight-lounge"].environment;
const STAR_COUNT = 120;

/** Glowing decorative orb. */
function GlowOrb({
  position,
  color = "#7c4dff",
  size = 0.2,
}: {
  position: [number, number, number];
  color?: string;
  size?: number;
}) {
  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[size, 12, 12]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={1.2}
          roughness={0.2}
          transparent
          opacity={0.8}
        />
      </mesh>
      <pointLight color={color} intensity={0.3} distance={4} decay={2} />
    </group>
  );
}

/** Low sofa (box with a back). */
function Sofa({
  position,
  rotation = 0,
}: {
  position: [number, number, number];
  rotation?: number;
}) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Seat */}
      <mesh position={[0, 0.15, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.8, 0.3, 0.8]} />
        <meshStandardMaterial color="#2d1b4e" roughness={0.9} />
      </mesh>
      {/* Back */}
      <mesh position={[0, 0.4, -0.35]} castShadow>
        <boxGeometry args={[1.8, 0.25, 0.1]} />
        <meshStandardMaterial color="#251545" roughness={0.9} />
      </mesh>
    </group>
  );
}

/** Neon accent strip. */
function NeonStrip({
  position,
  rotation = 0,
  length = 2,
  color = "#7c4dff",
}: {
  position: [number, number, number];
  rotation?: number;
  length?: number;
  color?: string;
}) {
  return (
    <mesh position={position} rotation={[0, rotation, 0]}>
      <boxGeometry args={[length, 0.04, 0.04]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={2}
        roughness={0.1}
      />
    </mesh>
  );
}

/** Bar counter with neon edge. */
function LoungeBar() {
  return (
    <group position={[6.5, 0, 0]}>
      {/* Counter */}
      <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.8, 1, 3]} />
        <meshStandardMaterial color="#1a0a30" roughness={0.8} />
      </mesh>
      {/* Neon edge */}
      <NeonStrip position={[-0.4, 1.02, 0]} length={3} color="#536dfe" />
    </group>
  );
}

/** Constellation floor — twinkling star points on the ground. */
function ConstellationFloor() {
  const pointsRef = useRef<THREE.Points>(null);

  const { positions, alphas } = useMemo(() => {
    const count = STAR_COUNT;
    const pos = new Float32Array(count * 3);
    const alpha = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 16;
      pos[i * 3 + 1] = 0.01;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 16;
      alpha[i] = Math.random();
    }
    return { positions: pos, alphas: alpha };
  }, []);

  // Store phase offsets for twinkle animation
  const phases = useMemo(() => {
    const p = new Float32Array(STAR_COUNT);
    for (let i = 0; i < STAR_COUNT; i++) {
      p[i] = Math.random() * Math.PI * 2;
    }
    return p;
  }, []);

  useFrame(({ clock }) => {
    const points = pointsRef.current;
    if (!points) return;
    const colors = points.geometry.getAttribute("color");
    if (!colors) return;
    const t = clock.getElapsedTime();
    for (let i = 0; i < STAR_COUNT; i++) {
      const brightness = 0.3 + 0.7 * ((Math.sin(t * 1.5 + phases[i]!) + 1) * 0.5);
      (colors.array as Float32Array)[i * 3] = brightness;
      (colors.array as Float32Array)[i * 3 + 1] = brightness;
      (colors.array as Float32Array)[i * 3 + 2] = brightness * 1.3;
    }
    colors.needsUpdate = true;
  });

  const colorArray = useMemo(() => {
    const c = new Float32Array(STAR_COUNT * 3);
    for (let i = 0; i < STAR_COUNT; i++) {
      c[i * 3] = alphas[i]!;
      c[i * 3 + 1] = alphas[i]!;
      c[i * 3 + 2] = alphas[i]! * 1.3;
    }
    return c;
  }, [alphas]);

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colorArray, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.08}
        vertexColors
        transparent
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
}

export default function StarlightLounge() {
  const sitSpots = useMemo(() => ENV.sitSpots, []);

  return (
    <>
      <RoomLighting theme="starlight-lounge" />
      <ClickPlane bounds={ENV.bounds} />

      {/* Dark background color */}
      <color attach="background" args={["#0a0520"]} />

      {/* Ground — dark purple */}
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#120830" roughness={0.95} />
      </mesh>

      {/* Constellation floor stars */}
      <ConstellationFloor />

      {/* Sofas */}
      <Sofa position={[-3, 0, -3]} rotation={Math.PI / 4} />
      <Sofa position={[3, 0, -3]} rotation={-Math.PI / 4} />

      {/* Floor pillow */}
      <mesh position={[0, 0.1, 5]} castShadow receiveShadow>
        <cylinderGeometry args={[0.5, 0.5, 0.15, 16]} />
        <meshStandardMaterial color="#4a148c" roughness={0.9} />
      </mesh>

      {/* Bar */}
      <LoungeBar />

      {/* Glowing orbs */}
      <GlowOrb position={[-6, 1.2, -6]} color="#7c4dff" />
      <GlowOrb position={[6, 1.5, -6]} color="#536dfe" />
      <GlowOrb position={[-7, 0.8, 5]} color="#b388ff" size={0.15} />
      <GlowOrb position={[0, 2, 0]} color="#7c4dff" size={0.3} />
      <GlowOrb position={[5, 1, 5]} color="#651fff" size={0.15} />

      {/* Neon accent strips on the ground */}
      <NeonStrip position={[0, 0.02, -7]} length={6} color="#7c4dff" />
      <NeonStrip position={[-7, 0.02, 0]} rotation={Math.PI / 2} length={6} color="#536dfe" />

      {/* Sit spot markers */}
      <SitSpotMarkers sitSpots={sitSpots} />
    </>
  );
}
