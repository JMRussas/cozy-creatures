// Cozy Creatures - Scene Lighting
//
// Warm, cozy ambient + directional lighting for the isometric scene.
//
// Depends on: config
// Used by:    IsometricScene

import { LIGHTING } from "../config";

export default function Lighting() {
  return (
    <>
      {/* Warm ambient fill */}
      <ambientLight intensity={LIGHTING.ambient.intensity} color={LIGHTING.ambient.color} />

      {/* Main directional light — warm sunlight from top-right */}
      <directionalLight
        position={[...LIGHTING.main.position]}
        intensity={LIGHTING.main.intensity}
        color={LIGHTING.main.color}
        castShadow
        shadow-mapSize-width={LIGHTING.main.shadowMapSize}
        shadow-mapSize-height={LIGHTING.main.shadowMapSize}
        shadow-camera-far={LIGHTING.main.shadowCameraFar}
        shadow-camera-left={-LIGHTING.main.shadowCameraExtent}
        shadow-camera-right={LIGHTING.main.shadowCameraExtent}
        shadow-camera-top={LIGHTING.main.shadowCameraExtent}
        shadow-camera-bottom={-LIGHTING.main.shadowCameraExtent}
      />

      {/* Subtle cool fill from opposite side */}
      <directionalLight
        position={[...LIGHTING.fill.position]}
        intensity={LIGHTING.fill.intensity}
        color={LIGHTING.fill.color}
      />
    </>
  );
}
