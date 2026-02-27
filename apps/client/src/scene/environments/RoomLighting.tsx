// Cozy Creatures - Room Lighting
//
// Renders ambient + directional lighting from a per-room config.
// Replaces the global Lighting.tsx with room-specific presets.
//
// Depends on: config (ROOM_LIGHTING, LIGHTING)
// Used by:    scene/environments/CozyCafe, RooftopGarden, StarlightLounge

import { ROOM_LIGHTING, LIGHTING } from "../../config";

interface RoomLightingProps {
  theme: string;
}

export default function RoomLighting({ theme }: RoomLightingProps) {
  const preset = ROOM_LIGHTING[theme as keyof typeof ROOM_LIGHTING] ?? {
    ambient: LIGHTING.ambient,
    main: { position: LIGHTING.main.position, intensity: LIGHTING.main.intensity, color: LIGHTING.main.color },
    fill: LIGHTING.fill,
  };

  return (
    <>
      <ambientLight intensity={preset.ambient.intensity} color={preset.ambient.color} />
      <directionalLight
        position={[...preset.main.position]}
        intensity={preset.main.intensity}
        color={preset.main.color}
        castShadow
        shadow-mapSize-width={LIGHTING.main.shadowMapSize}
        shadow-mapSize-height={LIGHTING.main.shadowMapSize}
        shadow-camera-far={LIGHTING.main.shadowCameraFar}
        shadow-camera-left={-LIGHTING.main.shadowCameraExtent}
        shadow-camera-right={LIGHTING.main.shadowCameraExtent}
        shadow-camera-top={LIGHTING.main.shadowCameraExtent}
        shadow-camera-bottom={-LIGHTING.main.shadowCameraExtent}
      />
      <directionalLight
        position={[...preset.fill.position]}
        intensity={preset.fill.intensity}
        color={preset.fill.color}
      />
    </>
  );
}
