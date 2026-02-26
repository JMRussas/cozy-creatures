// Cozy Creatures - Local Player Creature
//
// Moves toward click target with smooth lerp. Has a gentle idle bob.
// Uses shared CreatureModel for the visual mesh.
//
// Depends on: @react-three/fiber, three, stores/playerStore, stores/roomStore,
//             CreatureModel, ChatBubble, config, utils/math
// Used by:    scene/IsometricScene

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { usePlayerStore } from "../stores/playerStore";
import { useRoomStore } from "../stores/roomStore";
import CreatureModel from "./CreatureModel";
import ChatBubble from "./ChatBubble";
import { lerpAngle } from "../utils/math";
import {
  MOVE_SPEED,
  ARRIVAL_THRESHOLD,
  BOB_SPEED,
  BOB_HEIGHT,
  LOCAL_ROTATION_SPEED,
  CREATURE_COLORS,
  CREATURE_GEOMETRY,
} from "../config";

export default function Creature() {
  const groupRef = useRef<THREE.Group>(null);
  const visualRef = useRef<THREE.Group>(null);
  const creatureType = usePlayerStore((s) => s.creatureType);
  const localPlayerId = useRoomStore((s) => s.localPlayerId);
  const colors = CREATURE_COLORS[creatureType];

  // Pre-allocated vectors reused every frame (avoid GC pressure)
  const targetVec = useRef(new THREE.Vector3());
  const direction = useRef(new THREE.Vector3());

  useFrame(({ clock }, delta) => {
    const group = groupRef.current;
    if (!group) return;

    const store = usePlayerStore.getState();
    targetVec.current.set(store.target.x, 0, store.target.z);
    const currentPos = group.position;

    const distance = currentPos.distanceTo(targetVec.current);

    if (store.isMoving && distance > ARRIVAL_THRESHOLD) {
      // Move toward target
      direction.current
        .copy(targetVec.current)
        .sub(currentPos)
        .normalize();

      const angle = Math.atan2(direction.current.x, direction.current.z);

      const step = Math.min(MOVE_SPEED * delta, distance);
      currentPos.addScaledVector(direction.current, step);

      // Face movement direction (exponential smoothing — frame-rate independent)
      group.rotation.y = lerpAngle(
        group.rotation.y,
        angle,
        1 - Math.exp(-LOCAL_ROTATION_SPEED * delta),
      );

      // TODO(Stage 4): move to ref-based position to avoid per-frame setState
      store.setPosition({ x: currentPos.x, y: currentPos.y, z: currentPos.z });
    } else if (store.isMoving) {
      // Arrived — batch into a single setState to avoid an extra render
      usePlayerStore.setState({
        isMoving: false,
        position: { x: store.target.x, y: 0, z: store.target.z },
      });
      currentPos.set(store.target.x, 0, store.target.z);
    }

    // Idle bob — applied to visual group so body + ears + eyes move together
    if (visualRef.current) {
      visualRef.current.position.y = Math.sin(clock.elapsedTime * BOB_SPEED) * BOB_HEIGHT;
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

      {localPlayerId && <ChatBubble playerId={localPlayerId} />}
    </group>
  );
}
