// Cozy Creatures - Cozy Cafe Environment
//
// Procedural cafe scene: warm brown ground, tables, coffee cups, bar counter,
// pendant lights, and a cozy rug.
//
// Depends on: @cozy/shared (ROOMS), scene/environments/RoomLighting,
//             scene/environments/ClickPlane, scene/environments/SitSpotMarker
// Used by:    scene/environments/RoomEnvironment.tsx

import { useMemo } from "react";
import { ROOMS } from "@cozy/shared";
import RoomLighting from "./RoomLighting";
import ClickPlane from "./ClickPlane";
import SitSpotMarkers from "./SitSpotMarker";

const ENV = ROOMS["cozy-cafe"].environment;

/** Small round table with a single cylinder leg. */
function Table({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Table top */}
      <mesh position={[0, 0.55, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.5, 0.5, 0.05, 16]} />
        <meshStandardMaterial color="#6d4c2e" roughness={0.8} />
      </mesh>
      {/* Leg */}
      <mesh position={[0, 0.275, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.06, 0.55, 8]} />
        <meshStandardMaterial color="#5d3a1a" roughness={0.9} />
      </mesh>
    </group>
  );
}

/** Tiny coffee cup on a table. */
function CoffeeCup({ position }: { position: [number, number, number] }) {
  return (
    <mesh position={position} castShadow>
      <cylinderGeometry args={[0.06, 0.05, 0.1, 8]} />
      <meshStandardMaterial color="#f5f0e8" roughness={0.4} />
    </mesh>
  );
}

/** Long bar counter along one edge. */
function BarCounter() {
  return (
    <group position={[-5.5, 0, 2]}>
      {/* Counter top */}
      <mesh position={[0, 0.7, 0]} castShadow receiveShadow>
        <boxGeometry args={[1, 0.08, 4]} />
        <meshStandardMaterial color="#5d3a1a" roughness={0.7} />
      </mesh>
      {/* Counter front */}
      <mesh position={[0.2, 0.35, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.6, 0.7, 3.8]} />
        <meshStandardMaterial color="#7a5230" roughness={0.8} />
      </mesh>
    </group>
  );
}

/** Small chair with seat and back, rotated to face a direction. */
function Chair({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Seat */}
      <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.4, 0.05, 0.4]} />
        <meshStandardMaterial color="#6d4c2e" roughness={0.85} />
      </mesh>
      {/* Back rest (-Z in local space, faces away from table) */}
      <mesh position={[0, 0.45, -0.17]} castShadow>
        <boxGeometry args={[0.4, 0.25, 0.05]} />
        <meshStandardMaterial color="#5d3a1a" roughness={0.9} />
      </mesh>
      {/* Legs */}
      {[-0.15, 0.15].map((x) =>
        [-0.15, 0.15].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, 0.14, z]} castShadow>
            <boxGeometry args={[0.04, 0.28, 0.04]} />
            <meshStandardMaterial color="#5d3a1a" roughness={0.9} />
          </mesh>
        )),
      )}
    </group>
  );
}

/** Bar stool — cylinder seat on a single leg. */
function BarStool({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Seat */}
      <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.18, 0.18, 0.04, 12]} />
        <meshStandardMaterial color="#6d4c2e" roughness={0.85} />
      </mesh>
      {/* Leg */}
      <mesh position={[0, 0.225, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 0.45, 8]} />
        <meshStandardMaterial color="#5d3a1a" roughness={0.9} />
      </mesh>
    </group>
  );
}

/** Hanging pendant light (emissive sphere). */
function PendantLight({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Wire */}
      <mesh position={[0, 0.6, 0]}>
        <cylinderGeometry args={[0.01, 0.01, 1.2, 4]} />
        <meshBasicMaterial color="#333" />
      </mesh>
      {/* Bulb */}
      <mesh>
        <sphereGeometry args={[0.12, 12, 12]} />
        <meshStandardMaterial
          color="#ffcc80"
          emissive="#ffaa40"
          emissiveIntensity={0.8}
          roughness={0.3}
        />
      </mesh>
      <pointLight color="#ffaa40" intensity={0.5} distance={5} decay={2} />
    </group>
  );
}

export default function CozyCafe() {
  const sitSpots = useMemo(() => ENV.sitSpots, []);

  return (
    <>
      <RoomLighting theme="cozy-cafe" />
      <ClickPlane bounds={ENV.bounds} obstacles={ENV.obstacles} />

      {/* Ground — warm wood floor */}
      <mesh rotation-x={-Math.PI / 2} receiveShadow position={[0, 0, 0]}>
        <planeGeometry args={[18, 18]} />
        <meshStandardMaterial color="#8b6f4e" roughness={0.9} />
      </mesh>

      {/* Circular rug in the center */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.005, 1]} receiveShadow>
        <circleGeometry args={[3, 32]} />
        <meshStandardMaterial color="#a0522d" roughness={1} />
      </mesh>

      {/* Tables */}
      <Table position={[-3, 0, -2]} />
      <Table position={[3, 0, -2]} />

      {/* Chairs around table 1 (-3, -2) */}
      <Chair position={[-3, 0, -2.85]} rotation={0} />
      <Chair position={[-3, 0, -1.15]} rotation={Math.PI} />
      <Chair position={[-2.15, 0, -2]} rotation={-Math.PI / 2} />
      <Chair position={[-3.85, 0, -2]} rotation={Math.PI / 2} />

      {/* Chairs around table 2 (3, -2) */}
      <Chair position={[3, 0, -2.85]} rotation={0} />
      <Chair position={[3, 0, -1.15]} rotation={Math.PI} />
      <Chair position={[3.85, 0, -2]} rotation={-Math.PI / 2} />
      <Chair position={[2.15, 0, -2]} rotation={Math.PI / 2} />

      {/* Coffee cups on tables */}
      <CoffeeCup position={[-2.8, 0.6, -1.8]} />
      <CoffeeCup position={[3.2, 0.6, -2.2]} />

      {/* Bar counter */}
      <BarCounter />

      {/* Bar stools */}
      <BarStool position={[-4.3, 0, 1]} />
      <BarStool position={[-4.3, 0, 3]} />

      {/* Couch area (simple box sofa) */}
      <mesh position={[0, 0.2, 4.3]} castShadow receiveShadow>
        <boxGeometry args={[3, 0.4, 0.8]} />
        <meshStandardMaterial color="#6b4226" roughness={0.9} />
      </mesh>
      {/* Couch back */}
      <mesh position={[0, 0.5, 4.65]} castShadow>
        <boxGeometry args={[3, 0.3, 0.1]} />
        <meshStandardMaterial color="#5a3520" roughness={0.9} />
      </mesh>

      {/* Pendant lights */}
      <PendantLight position={[-3, 2, -2]} />
      <PendantLight position={[3, 2, -2]} />
      <PendantLight position={[0, 2.2, 1]} />

      {/* Sit spot markers */}
      <SitSpotMarkers sitSpots={sitSpots} />
    </>
  );
}
