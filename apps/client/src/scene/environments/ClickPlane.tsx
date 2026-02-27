// Cozy Creatures - Click Plane
//
// Invisible ground plane for click-to-move input. Clamps the click target
// to the room's walkable bounds and resolves obstacle collisions.
//
// Depends on: @cozy/shared (WalkableBounds, Obstacle, clampAndResolve),
//             stores/playerStore
// Used by:    scene/environments/CozyCafe, RooftopGarden, StarlightLounge

import type { WalkableBounds, Obstacle } from "@cozy/shared";
import { clampAndResolve } from "@cozy/shared";
import { usePlayerStore } from "../../stores/playerStore";

interface ClickPlaneProps {
  bounds: WalkableBounds;
  obstacles: readonly Obstacle[];
}

export default function ClickPlane({ bounds, obstacles }: ClickPlaneProps) {
  const setTarget = usePlayerStore((s) => s.setTarget);
  const setSitting = usePlayerStore((s) => s.setSitting);

  const width = bounds.maxX - bounds.minX + 10;
  const depth = bounds.maxZ - bounds.minZ + 10;

  return (
    <mesh
      receiveShadow
      rotation-x={-Math.PI / 2}
      position={[0, -0.01, 0]}
      onPointerDown={(e) => {
        e.stopPropagation();
        const { x, z } = clampAndResolve(e.point.x, e.point.z, bounds, obstacles);

        // Stand up if sitting, and cancel any pending sit walk
        const { isSitting, pendingSitId } = usePlayerStore.getState();
        if (isSitting) {
          setSitting(null);
          // player:stand is emitted by Creature.tsx when it detects sit→stand
        }
        if (pendingSitId) {
          usePlayerStore.getState().setPendingSit(null);
        }

        setTarget(x, z);
      }}
    >
      <planeGeometry args={[width, depth]} />
      <meshBasicMaterial transparent opacity={0} />
    </mesh>
  );
}
