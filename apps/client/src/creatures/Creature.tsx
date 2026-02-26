// Cozy Creatures - Local Player Creature
//
// Moves toward click target with smooth lerp. Drives animation state
// (idle/walk) via CreatureModel's imperative handle. Wrapped in Suspense
// with a CreatureFallback while glTF loads.
//
// Depends on: @react-three/fiber, three, stores/playerStore, stores/roomStore,
//             CreatureModel, CreatureFallback, CreatureShadow, ChatBubble,
//             SpeakingIndicator, AudioRangeRing, config, utils/math
// Used by:    scene/IsometricScene

import { Suspense, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { usePlayerStore } from "../stores/playerStore";
import { useRoomStore } from "../stores/roomStore";
import CreatureModel from "./CreatureModel";
import type { CreatureModelHandle } from "./CreatureModel";
import CreatureFallback from "./CreatureFallback";
import CreatureShadow from "./CreatureShadow";
import ChatBubble from "./ChatBubble";
import SpeakingIndicator from "./SpeakingIndicator";
import AudioRangeRing from "./AudioRangeRing";
import { lerpAngle } from "../utils/math";
import {
  MOVE_SPEED,
  ARRIVAL_THRESHOLD,
  LOCAL_ROTATION_SPEED,
} from "../config";

export default function Creature() {
  const groupRef = useRef<THREE.Group>(null);
  const modelRef = useRef<CreatureModelHandle>(null);
  const creatureType = usePlayerStore((s) => s.creatureType);
  const localPlayerId = useRoomStore((s) => s.localPlayerId);

  // Pre-allocated vectors reused every frame (avoid GC pressure)
  const targetVec = useRef(new THREE.Vector3());
  const direction = useRef(new THREE.Vector3());

  useFrame((_, delta) => {
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

      store.setPosition({ x: currentPos.x, y: currentPos.y, z: currentPos.z });

      // Drive walk animation
      modelRef.current?.setAnimation("walk");
    } else if (store.isMoving) {
      // Arrived — batch into a single setState to avoid an extra render
      usePlayerStore.setState({
        isMoving: false,
        position: { x: store.target.x, y: 0, z: store.target.z },
      });
      currentPos.set(store.target.x, 0, store.target.z);

      modelRef.current?.setAnimation("idle");
    }
  });

  return (
    <group ref={groupRef}>
      <Suspense fallback={<CreatureFallback creatureType={creatureType} />}>
        <CreatureModel ref={modelRef} creatureType={creatureType} />
      </Suspense>

      <CreatureShadow />

      <AudioRangeRing />

      {localPlayerId && <ChatBubble playerId={localPlayerId} />}
      {localPlayerId && <SpeakingIndicator playerId={localPlayerId} isLocal />}
    </group>
  );
}
