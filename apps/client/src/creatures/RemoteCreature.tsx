// Cozy Creatures - Remote Creature
//
// Renders another player's creature with position interpolation.
// Derives isMoving from position deltas with hysteresis to avoid
// animation flicker at low network rates. Wrapped in Suspense with
// a CreatureFallback while glTF loads.
//
// Depends on: @react-three/fiber, three, stores/roomStore, CreatureModel,
//             CreatureFallback, CreatureShadow, ChatBubble, SpeakingIndicator,
//             config, utils/math, @cozy/shared
// Used by:    creatures/RemotePlayers.tsx

import { Suspense, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { DEFAULT_CREATURE, SKINS } from "@cozy/shared";
import type { SkinId } from "@cozy/shared";
import { useRoomStore } from "../stores/roomStore";
import CreatureModel from "./CreatureModel";
import type { CreatureModelHandle } from "./CreatureModel";
import CreatureFallback from "./CreatureFallback";
import CreatureShadow from "./CreatureShadow";
import ChatBubble from "./overlays/ChatBubble";
import SpeakingIndicator from "./overlays/SpeakingIndicator";
import { lerpAngle } from "../utils/math";
import {
  REMOTE_LERP_SPEED,
  REMOTE_ROTATION_SPEED,
} from "../config";

/** Frames of movement before switching to walk animation. */
const MOVING_THRESHOLD_FRAMES = 2;
/** Frames of stillness before switching to idle animation. */
const IDLE_THRESHOLD_FRAMES = 3;
/** Minimum position delta per frame to count as "moving". */
const MOVE_DELTA_MIN = 0.01;

interface RemoteCreatureProps {
  playerId: string;
}

export default function RemoteCreature({ playerId }: RemoteCreatureProps) {
  const groupRef = useRef<THREE.Group>(null);
  const modelRef = useRef<CreatureModelHandle>(null);
  const creatureType = useRoomStore(
    (s) => s.players[playerId]?.creatureType ?? DEFAULT_CREATURE,
  );
  const rawSkinId = useRoomStore((s) => s.players[playerId]?.skinId);
  const skinId = rawSkinId && rawSkinId in SKINS ? (rawSkinId as SkinId) : undefined;

  // Pre-allocated vectors reused every frame (avoid GC pressure)
  const targetVec = useRef(new THREE.Vector3());
  const dirVec = useRef(new THREE.Vector3());
  const prevPos = useRef<THREE.Vector3 | null>(null);

  // Hysteresis counters for animation state
  const movingFrames = useRef(0);
  const idleFrames = useRef(0);
  const isWalking = useRef(false);

  useFrame((_, delta) => {
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
    const posDelta = dirVec.current.length();

    if (posDelta > MOVE_DELTA_MIN) {
      const angle = Math.atan2(dirVec.current.x, dirVec.current.z);
      group.rotation.y = lerpAngle(
        group.rotation.y,
        angle,
        1 - Math.exp(-REMOTE_ROTATION_SPEED * delta),
      );
    }
    prevPos.current.copy(targetVec.current);

    // Hysteresis: derive animation state from position deltas
    if (posDelta > MOVE_DELTA_MIN) {
      movingFrames.current++;
      idleFrames.current = 0;
      if (!isWalking.current && movingFrames.current >= MOVING_THRESHOLD_FRAMES) {
        isWalking.current = true;
        modelRef.current?.setAnimation("walk");
      }
    } else {
      idleFrames.current++;
      movingFrames.current = 0;
      if (isWalking.current && idleFrames.current >= IDLE_THRESHOLD_FRAMES) {
        isWalking.current = false;
        modelRef.current?.setAnimation("idle");
      }
    }
  });

  return (
    <group ref={groupRef}>
      <Suspense fallback={<CreatureFallback creatureType={creatureType} />}>
        <CreatureModel ref={modelRef} creatureType={creatureType} skinId={skinId} />
      </Suspense>

      <CreatureShadow />

      <ChatBubble playerId={playerId} />
      <SpeakingIndicator playerId={playerId} />
    </group>
  );
}
