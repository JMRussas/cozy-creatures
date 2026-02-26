// Cozy Creatures - Ground Plane
//
// Isometric ground with a soft grid pattern. Receives click events for movement.
//
// Depends on: @react-three/drei, stores/playerStore, config
// Used by:    IsometricScene

import { Grid } from "@react-three/drei";
import { usePlayerStore } from "../stores/playerStore";
import { GROUND_SIZE, GRID } from "../config";

export default function Ground() {
  const setTarget = usePlayerStore((s) => s.setTarget);

  return (
    <group>
      {/* Invisible plane for raycasting clicks */}
      <mesh
        receiveShadow
        rotation-x={-Math.PI / 2}
        position={[0, -0.01, 0]}
        onPointerDown={(e) => {
          e.stopPropagation();
          const point = e.point;
          setTarget(point.x, point.z);
        }}
      >
        <planeGeometry args={[GROUND_SIZE, GROUND_SIZE]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {/* Visible grid */}
      <Grid
        args={[GROUND_SIZE, GROUND_SIZE]}
        cellSize={GRID.cellSize}
        cellThickness={GRID.cellThickness}
        cellColor={GRID.cellColor}
        sectionSize={GRID.sectionSize}
        sectionThickness={GRID.sectionThickness}
        sectionColor={GRID.sectionColor}
        fadeDistance={GRID.fadeDistance}
        fadeStrength={GRID.fadeStrength}
        infiniteGrid
      />
    </group>
  );
}
