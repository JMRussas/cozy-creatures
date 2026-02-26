// Cozy Creatures - Creature 3D Preview
//
// R3F Canvas showing a creature model with auto-rotation. Used on the join
// screen (without skin) and in the skin shop (with skin applied).
// Only one instance is mounted at a time — the join screen Canvas and the
// in-game SkinShop Canvas never coexist.
//
// Depends on: @react-three/fiber, @react-three/drei (OrbitControls, useGLTF),
//             react, creatures/CreatureModel, creatures/CreatureFallback, @cozy/shared
// Used by:    App.tsx, ui/skins/SkinShop.tsx, ui/skins/SkinInventory.tsx

import { Suspense, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import { CREATURES } from "@cozy/shared";
import type { CreatureTypeId, SkinId } from "@cozy/shared";
import CreatureModel from "../../creatures/CreatureModel";
import CreatureFallback from "../../creatures/CreatureFallback";

interface CreaturePreviewProps {
  creatureType: CreatureTypeId;
  /** Optional skin to apply (HSL + accessories + particles). */
  skinId?: SkinId;
  /** Preview size: "sm" = 192px (join screen), "lg" = 224px (skin shop). */
  size?: "sm" | "lg";
}

const SIZE_CLASSES = {
  sm: "h-48 w-48",
  lg: "h-56 w-56",
} as const;

export default function CreaturePreview({
  creatureType,
  skinId,
  size = "sm",
}: CreaturePreviewProps) {
  // Eagerly preload only the selected creature's model
  useEffect(() => {
    useGLTF.preload(CREATURES[creatureType].modelPath);
  }, [creatureType]);

  return (
    <div className={`${SIZE_CLASSES[size]} overflow-hidden rounded-lg bg-gray-900/60`}>
      <Canvas
        camera={{ position: [1.5, 1.2, 1.5], fov: 35 }}
        gl={{ alpha: true }}
      >
        <ambientLight intensity={0.8} color="#ffe4c9" />
        <directionalLight position={[3, 5, 2]} intensity={1.0} color="#fff5e6" />

        <Suspense fallback={<CreatureFallback creatureType={creatureType} />}>
          <CreatureModel creatureType={creatureType} skinId={skinId} />
        </Suspense>

        <OrbitControls
          autoRotate
          autoRotateSpeed={3}
          enableZoom={false}
          enablePan={false}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 2.5}
        />
      </Canvas>
    </div>
  );
}
