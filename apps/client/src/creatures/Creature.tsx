// Cozy Creatures - Local Player Creature
//
// Moves toward click target with smooth lerp. Drives animation state
// (idle/walk/rest) via CreatureModel's imperative handle. Wrapped in Suspense
// with a CreatureFallback while glTF loads. Clamps position to room bounds
// and handles sit/stand flow.
//
// Depends on: @react-three/fiber, three, stores/playerStore, stores/roomStore,
//             stores/skinStore, CreatureModel, CreatureFallback, CreatureShadow,
//             ChatBubble, SpeakingIndicator, AudioRangeRing, config, utils/math,
//             @cozy/shared (ROOMS, SKINS, clampAndResolve),
//             networking/socket
// Used by:    scene/IsometricScene

import { Suspense, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { ROOMS, SKINS, clampAndResolve } from "@cozy/shared";
import type { RoomId, SkinId, RoomConfig } from "@cozy/shared";
import { usePlayerStore } from "../stores/playerStore";
import { useRoomStore } from "../stores/roomStore";
import { useSkinStore } from "../stores/skinStore";
import { getSocket } from "../networking/socket";
import CreatureModel from "./CreatureModel";
import type { CreatureModelHandle } from "./CreatureModel";
import CreatureFallback from "./CreatureFallback";
import CreatureShadow from "./CreatureShadow";
import ChatBubble from "./overlays/ChatBubble";
import SpeakingIndicator from "./overlays/SpeakingIndicator";
import AudioRangeRing from "./overlays/AudioRangeRing";
import { lerpAngle } from "../utils/math";
import {
  MOVE_SPEED,
  ARRIVAL_THRESHOLD,
  LOCAL_ROTATION_SPEED,
} from "../config";

const socket = getSocket();

export default function Creature() {
  const groupRef = useRef<THREE.Group>(null);
  const modelRef = useRef<CreatureModelHandle>(null);
  /** Track whether we were sitting last frame so we can emit player:stand. */
  const wasSitting = useRef(false);
  const creatureType = usePlayerStore((s) => s.creatureType);
  const localPlayerId = useRoomStore((s) => s.localPlayerId);
  const rawSkinId = useSkinStore((s) => s.equippedSkinId);
  const equippedSkinId = rawSkinId && rawSkinId in SKINS ? (rawSkinId as SkinId) : undefined;

  // Pre-allocated vectors reused every frame (avoid GC pressure)
  const targetVec = useRef(new THREE.Vector3());
  const direction = useRef(new THREE.Vector3());

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) return;

    const store = usePlayerStore.getState();
    const roomId = useRoomStore.getState().roomId;

    // Get room bounds and obstacles
    const roomConfig: RoomConfig | undefined =
      roomId && roomId in ROOMS ? ROOMS[roomId as RoomId] : undefined;
    const bounds = roomConfig?.environment.bounds;
    const obstacles = roomConfig?.environment.obstacles;

    // --- Sit/stand transition detection ---
    if (store.isSitting && !wasSitting.current) {
      // Just sat down — snap to sit spot
      const sitSpot = roomConfig?.environment.sitSpots.find(
        (s) => s.id === store.sitSpotId,
      );
      if (sitSpot) {
        group.position.set(sitSpot.position.x, sitSpot.position.y, sitSpot.position.z);
        group.rotation.y = sitSpot.rotation;
        store.setPosition(sitSpot.position);
      }
      modelRef.current?.setAnimation(sitSpot?.animation ?? "rest");
      wasSitting.current = true;
      return;
    }

    if (!store.isSitting && wasSitting.current) {
      // Just stood up — emit player:stand, reset Y to ground, resume idle
      socket.emit("player:stand");
      group.position.y = 0;
      modelRef.current?.setAnimation("idle");
      wasSitting.current = false;
    }

    // While sitting, don't process movement
    if (store.isSitting) return;

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

      // Clamp to room bounds + obstacle collision
      if (bounds && obstacles) {
        // Skip obstacle collision when walking to a sit spot (creature needs to reach it)
        const useObstacles = store.pendingSitId ? [] : obstacles;
        const resolved = clampAndResolve(currentPos.x, currentPos.z, bounds, useObstacles);
        currentPos.x = resolved.x;
        currentPos.z = resolved.z;
      }

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
      const arrivalX = store.target.x;
      const arrivalZ = store.target.z;

      usePlayerStore.setState({
        isMoving: false,
        position: { x: arrivalX, y: 0, z: arrivalZ },
      });
      currentPos.set(arrivalX, 0, arrivalZ);

      // Check if we have a pending sit spot to claim
      const pendingSitId = store.pendingSitId;
      if (pendingSitId) {
        socket.emit("player:sit", { sitSpotId: pendingSitId }, (response) => {
          if (response.success) {
            usePlayerStore.getState().setSitting(pendingSitId);
          } else {
            // Spot was taken — just stay standing
            usePlayerStore.getState().setPendingSit(null);
          }
        });
      } else {
        modelRef.current?.setAnimation("idle");
      }
    }
  });

  return (
    <group ref={groupRef}>
      <Suspense fallback={<CreatureFallback creatureType={creatureType} />}>
        <CreatureModel ref={modelRef} creatureType={creatureType} skinId={equippedSkinId} />
      </Suspense>

      <CreatureShadow />

      <AudioRangeRing />

      {localPlayerId && <ChatBubble playerId={localPlayerId} />}
      {localPlayerId && <SpeakingIndicator playerId={localPlayerId} isLocal />}
    </group>
  );
}
