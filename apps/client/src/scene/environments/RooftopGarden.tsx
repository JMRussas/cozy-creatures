// Cozy Creatures - Rooftop Garden Environment
//
// Procedural rooftop garden: green-gray concrete, potted plants,
// wooden benches, fairy light points, railing, sunset sky.
//
// Depends on: @cozy/shared (ROOMS), @react-three/drei (Sky),
//             scene/environments/RoomLighting, ClickPlane, SitSpotMarker
// Used by:    scene/environments/RoomEnvironment.tsx

import { useMemo } from "react";
import { Sky } from "@react-three/drei";
import { ROOMS } from "@cozy/shared";
import RoomLighting from "./RoomLighting";
import ClickPlane from "./ClickPlane";
import SitSpotMarkers from "./SitSpotMarker";

const ENV = ROOMS["rooftop-garden"].environment;

/** Potted plant: cylinder pot + sphere foliage. */
function PottedPlant({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Pot */}
      <mesh position={[0, 0.15, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.15, 0.3, 8]} />
        <meshStandardMaterial color="#8d6e4c" roughness={0.9} />
      </mesh>
      {/* Foliage */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <sphereGeometry args={[0.3, 8, 8]} />
        <meshStandardMaterial color="#4caf50" roughness={0.8} />
      </mesh>
    </group>
  );
}

/** Wooden bench. */
function Bench({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Seat */}
      <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.5, 0.08, 0.5]} />
        <meshStandardMaterial color="#8d6e4c" roughness={0.85} />
      </mesh>
      {/* Legs */}
      {[-0.6, 0.6].map((x) => (
        <mesh key={x} position={[x, 0.15, 0]} castShadow>
          <boxGeometry args={[0.08, 0.3, 0.4]} />
          <meshStandardMaterial color="#6d4c2e" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

/** Railing segment along the perimeter. */
function Railing() {
  const segments: [number, number, number, number][] = [
    // [x, z, width, depth]
    [0, -10, 20, 0.1],
    [0, 10, 20, 0.1],
    [-10, 0, 0.1, 20],
    [10, 0, 0.1, 20],
  ];

  return (
    <>
      {segments.map(([x, z, w, d], i) => (
        <mesh key={i} position={[x, 0.5, z]} castShadow>
          <boxGeometry args={[w, 1, d]} />
          <meshStandardMaterial color="#78909c" roughness={0.7} metalness={0.2} />
        </mesh>
      ))}
    </>
  );
}

/** Fairy lights: a set of small emissive point lights. */
function FairyLights() {
  const positions = useMemo(
    () => [
      [-6, 1.8, -6],
      [-3, 1.6, -7],
      [0, 1.7, -7],
      [3, 1.6, -7],
      [6, 1.8, -6],
      [-7, 1.7, -3],
      [-7, 1.6, 0],
      [-7, 1.7, 3],
    ] as [number, number, number][],
    [],
  );

  return (
    <>
      {positions.map((pos, i) => (
        <group key={i} position={pos}>
          <mesh>
            <sphereGeometry args={[0.04, 6, 6]} />
            <meshStandardMaterial
              color="#fff9c4"
              emissive="#ffee58"
              emissiveIntensity={1.5}
            />
          </mesh>
          <pointLight color="#ffee58" intensity={0.15} distance={3} decay={2} />
        </group>
      ))}
    </>
  );
}

export default function RooftopGarden() {
  const sitSpots = useMemo(() => ENV.sitSpots, []);

  return (
    <>
      <RoomLighting theme="rooftop-garden" />
      <ClickPlane bounds={ENV.bounds} />

      {/* Sunset sky */}
      <Sky
        distance={450}
        sunPosition={[100, 5, 60]}
        inclination={0.48}
        azimuth={0.25}
        rayleigh={0.5}
      />

      {/* Ground — concrete with a green tint */}
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[22, 22]} />
        <meshStandardMaterial color="#78867a" roughness={0.95} />
      </mesh>

      {/* Grass patches */}
      {[
        [3, 0.005, 4, 2.5, 2],
        [-4, 0.005, 5, 2, 3],
        [6, 0.005, -3, 1.5, 1.5],
      ].map(([x, y, z, w, d], i) => (
        <mesh key={i} rotation-x={-Math.PI / 2} position={[x!, y!, z!]} receiveShadow>
          <planeGeometry args={[w!, d!]} />
          <meshStandardMaterial color="#66bb6a" roughness={1} />
        </mesh>
      ))}

      {/* Railing around the edge */}
      <Railing />

      {/* Benches */}
      <Bench position={[-4, 0, -5]} />
      <Bench position={[4, 0, -5]} />

      {/* Potted plants */}
      <PottedPlant position={[-8, 0, -8]} />
      <PottedPlant position={[8, 0, -8]} />
      <PottedPlant position={[-8, 0, 8]} />
      <PottedPlant position={[8, 0, 8]} />
      <PottedPlant position={[0, 0, -8]} />
      <PottedPlant position={[-5, 0, 6]} />

      {/* Cushion spot */}
      <mesh position={[0, 0.08, 3]} castShadow receiveShadow>
        <cylinderGeometry args={[0.4, 0.4, 0.08, 16]} />
        <meshStandardMaterial color="#ef9a9a" roughness={0.9} />
      </mesh>

      {/* Swing frame */}
      <group position={[-6, 0, 2]}>
        {/* Frame */}
        <mesh position={[0, 1.2, 0]} castShadow>
          <boxGeometry args={[1.2, 0.08, 0.08]} />
          <meshStandardMaterial color="#5d4037" roughness={0.8} />
        </mesh>
        {[-0.5, 0.5].map((x) => (
          <mesh key={x} position={[x, 0.6, 0]} castShadow>
            <boxGeometry args={[0.08, 1.2, 0.08]} />
            <meshStandardMaterial color="#5d4037" roughness={0.8} />
          </mesh>
        ))}
        {/* Seat */}
        <mesh position={[0, 0.4, 0]} castShadow>
          <boxGeometry args={[0.8, 0.06, 0.4]} />
          <meshStandardMaterial color="#8d6e4c" roughness={0.85} />
        </mesh>
      </group>

      {/* Fairy lights */}
      <FairyLights />

      {/* Sit spot markers */}
      <SitSpotMarkers sitSpots={sitSpots} />
    </>
  );
}
