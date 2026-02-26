// Cozy Creatures - Creature 3D Preview
//
// Small R3F Canvas showing the selected creature model with auto-rotation.
// Used on the join screen alongside CreaturePicker.
//
// Depends on: @react-three/fiber, @react-three/drei (OrbitControls, useGLTF),
//             react, creatures/CreatureModel, creatures/CreatureFallback, @cozy/shared
// Used by:    App.tsx

import { Suspense, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import { CREATURES } from "@cozy/shared";
import type { CreatureTypeId } from "@cozy/shared";
import CreatureModel from "../creatures/CreatureModel";
import CreatureFallback from "../creatures/CreatureFallback";

interface CreaturePreviewProps {
  creatureType: CreatureTypeId;
}

export default function CreaturePreview({ creatureType }: CreaturePreviewProps) {
  // Eagerly preload only the selected creature's model
  useEffect(() => {
    useGLTF.preload(CREATURES[creatureType].modelPath);
  }, [creatureType]);

  return (
    <div className="h-48 w-48 overflow-hidden rounded-lg bg-gray-900/60">
      {/* Separate Canvas for the join-screen turntable preview.
          Creates a second WebGL context, but acceptable because the
          main scene Canvas is not mounted until after the player joins. */}
      <Canvas
        camera={{ position: [1.5, 1.2, 1.5], fov: 35 }}
        gl={{ alpha: true }}
      >
        <ambientLight intensity={0.8} color="#ffe4c9" />
        <directionalLight position={[3, 5, 2]} intensity={1.0} color="#fff5e6" />

        <Suspense fallback={<CreatureFallback creatureType={creatureType} />}>
          <CreatureModel creatureType={creatureType} />
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
