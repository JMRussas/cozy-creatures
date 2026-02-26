// Cozy Creatures - Speaking Indicator
//
// Animated ring above a creature's head when they are speaking.
// Uses a torus geometry with pulsing opacity via useFrame.
//
// Depends on: @react-three/fiber, three, stores/voiceStore
// Used by:    creatures/Creature.tsx, creatures/RemoteCreature.tsx

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useVoiceStore } from "../stores/voiceStore";

interface SpeakingIndicatorProps {
  playerId: string;
  isLocal?: boolean;
}

const RING_Y = 1.4;
const RING_INNER = 0.35;
const RING_TUBE = 0.03;
const RING_SEGMENTS = 16;
const PULSE_SPEED = 4;
const BASE_OPACITY = 0.6;
const PULSE_AMPLITUDE = 0.3;

export default function SpeakingIndicator({
  playerId,
  isLocal,
}: SpeakingIndicatorProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshBasicMaterial>(null);

  // Read speaking state imperatively in useFrame to avoid React re-renders
  useFrame(({ clock }) => {
    if (!meshRef.current || !matRef.current) return;

    const { speaking, remoteSpeaking } = useVoiceStore.getState();
    const isSpeaking = isLocal ? speaking : (remoteSpeaking[playerId] ?? false);

    meshRef.current.visible = isSpeaking;

    if (isSpeaking) {
      const pulse =
        Math.sin(clock.elapsedTime * PULSE_SPEED) * PULSE_AMPLITUDE;
      matRef.current.opacity = BASE_OPACITY + pulse;
      meshRef.current.rotation.z = clock.elapsedTime * 0.5;
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={[0, RING_Y, 0]}
      rotation-x={-Math.PI / 2}
      visible={false}
    >
      <torusGeometry
        args={[RING_INNER, RING_TUBE, RING_SEGMENTS, RING_SEGMENTS]}
      />
      <meshBasicMaterial
        ref={matRef}
        color="#4ade80"
        transparent
        opacity={BASE_OPACITY}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
