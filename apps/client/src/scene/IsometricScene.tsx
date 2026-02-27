// Cozy Creatures - Isometric Scene
//
// Top-level R3F Canvas wrapper that composes the 3D scene:
// camera, room environment, local creature, and remote players.
//
// Depends on: CameraRig, scene/environments/RoomEnvironment, Creature,
//             RemotePlayers, NetworkSync, SpatialAudioManager,
//             stores/roomStore, @cozy/shared (ROOMS, RoomId)
// Used by:    App.tsx

import { Canvas } from "@react-three/fiber";
import type { RoomId } from "@cozy/shared";
import { ROOMS } from "@cozy/shared";
import CameraRig from "./CameraRig";
import RoomEnvironment from "./environments/RoomEnvironment";
import Creature from "../creatures/Creature";
import RemotePlayers from "../creatures/RemotePlayers";
import NetworkSync from "../networking/NetworkSync";
import SpatialAudioManager from "../networking/SpatialAudioManager";
import { useRoomStore } from "../stores/roomStore";

export default function IsometricScene() {
  const roomId = useRoomStore((s) => s.roomId);
  const theme =
    roomId && roomId in ROOMS ? ROOMS[roomId as RoomId].theme : "cozy-cafe";

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      gl={{ antialias: true }}
      style={{ width: "100%", height: "100%" }}
    >
      <CameraRig />
      <RoomEnvironment theme={theme} />
      <Creature />
      <RemotePlayers />
      <NetworkSync />
      <SpatialAudioManager />
    </Canvas>
  );
}
