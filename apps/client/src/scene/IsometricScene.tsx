// Cozy Creatures - Isometric Scene
//
// Top-level R3F Canvas wrapper that composes the 3D scene:
// camera, lighting, ground, local creature, and remote players.
//
// Depends on: CameraRig, Ground, Lighting, Creature, RemotePlayers, NetworkSync
// Used by:    App.tsx

import { Canvas } from "@react-three/fiber";
import CameraRig from "./CameraRig";
import Ground from "./Ground";
import Lighting from "./Lighting";
import Creature from "../creatures/Creature";
import RemotePlayers from "../creatures/RemotePlayers";
import NetworkSync from "../networking/NetworkSync";

export default function IsometricScene() {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      gl={{ antialias: true }}
      style={{ width: "100%", height: "100%" }}
    >
      <CameraRig />
      <Lighting />
      <Ground />
      <Creature />
      <RemotePlayers />
      <NetworkSync />
    </Canvas>
  );
}
