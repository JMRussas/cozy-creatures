// Cozy Creatures - Remote Creature
//
// Renders another player's creature with position interpolation and idle bob.
// Reads position from roomStore via getState() in useFrame to avoid React
// re-renders on every position update. Uses shared CreatureModel for the mesh.
//
// Depends on: @react-three/fiber, three, stores/roomStore, CreatureModel, ChatBubble,
//             config, utils/math, @cozy/shared
// Used by:    creatures/RemotePlayers.tsx

import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { DEFAULT_CREATURE } from "@cozy/shared";
import { useRoomStore } from "../stores/roomStore";
import CreatureModel from "./CreatureModel";
import ChatBubble from "./ChatBubble";
import { lerpAngle } from "../utils/math";
import {
  BOB_SPEED,
  BOB_HEIGHT,
  REMOTE_LERP_SPEED,
  REMOTE_ROTATION_SPEED,
  CREATURE_COLORS,
  CREATURE_GEOMETRY,
} from "../config";

interface RemoteCreatureProps {
  playerId: string;
}

export default function RemoteCreature({ playerId }: RemoteCreatureProps) {
  const groupRef = useRef<THREE.Group>(null);
  const visualRef = useRef<THREE.Group>(null);
  const creatureType = useRoomStore(
    (s) => s.players[playerId]?.creatureType ?? DEFAULT_CREATURE,
  );
  const colors = CREATURE_COLORS[creatureType];

  // Per-creature phase offset so idle bobs don't sync across all creatures
  const phaseOffset = useRef(0);
  useEffect(() => {
    let hash = 0;
    for (let i = 0; i < playerId.length; i++) hash = (hash * 31 + playerId.charCodeAt(i)) | 0;
    phaseOffset.current = ((hash % 1000) / 1000) * Math.PI * 2;
  }, [playerId]);

  // Pre-allocated vectors reused every frame (avoid GC pressure)
  const targetVec = useRef(new THREE.Vector3());
  const dirVec = useRef(new THREE.Vector3());
  const prevPos = useRef<THREE.Vector3 | null>(null);

  useFrame(({ clock }, delta) => {
    const group = groupRef.current;
    if (!group) return;

    const player = useRoomStore.getState().players[playerId];
    if (!player) return;

    targetVec.current.set(player.position.x, 0, player.position.z);

    // Snap to position on first frame
    if (prevPos.current === null) {
      prevPos.current = new THREE.Vector3();
      group.position.copy(targetVec.current);
      prevPos.current.copy(targetVec.current);
      return;
    }

    // Smooth interpolation toward network position
    group.position.lerp(targetVec.current, 1 - Math.exp(-REMOTE_LERP_SPEED * delta));

    // Face movement direction
    dirVec.current.subVectors(targetVec.current, prevPos.current);
    if (dirVec.current.length() > 0.01) {
      const angle = Math.atan2(dirVec.current.x, dirVec.current.z);
      group.rotation.y = lerpAngle(
        group.rotation.y,
        angle,
        1 - Math.exp(-REMOTE_ROTATION_SPEED * delta),
      );
    }
    prevPos.current.copy(targetVec.current);

    // Idle bob — applied to visual group so body + ears + eyes move together
    if (visualRef.current) {
      visualRef.current.position.y =
        Math.sin((clock.elapsedTime + phaseOffset.current) * BOB_SPEED) * BOB_HEIGHT;
    }
  });

  return (
    <group ref={groupRef}>
      <CreatureModel ref={visualRef} bodyColor={colors.body} earColor={colors.ear} />

      {/* Shadow blob on ground — stays flat, doesn't bob */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.01, 0]}>
        <circleGeometry args={[CREATURE_GEOMETRY.shadowRadius, CREATURE_GEOMETRY.shadowSegments]} />
        <meshBasicMaterial color="#000000" transparent opacity={CREATURE_GEOMETRY.shadowOpacity} />
      </mesh>

      <ChatBubble playerId={playerId} />
    </group>
  );
}
