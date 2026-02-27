// Cozy Creatures - Sit Spot Markers
//
// Renders interactive sit spot indicators on the ground. Shows a glowing
// circle that highlights on hover and triggers walk-to-sit on click.
//
// Depends on: @cozy/shared (SitSpot), stores/playerStore, stores/roomStore,
//             config (SIT_SPOT)
// Used by:    scene/environments/CozyCafe, RooftopGarden, StarlightLounge

import { useEffect, useState } from "react";
import { Html } from "@react-three/drei";
import type { SitSpot } from "@cozy/shared";
import { usePlayerStore } from "../../stores/playerStore";
import { useRoomStore } from "../../stores/roomStore";
import { SIT_SPOT } from "../../config";

interface SitSpotMarkersProps {
  sitSpots: SitSpot[];
}

export default function SitSpotMarkers({ sitSpots }: SitSpotMarkersProps) {
  return (
    <>
      {sitSpots.map((spot) => (
        <SingleMarker key={spot.id} spot={spot} />
      ))}
    </>
  );
}

function SingleMarker({ spot }: { spot: SitSpot }) {
  const [hovered, setHovered] = useState(false);

  // Targeted selectors — only re-render when this spot's occupancy changes
  const isOccupied = useRoomStore(
    (s) => Object.values(s.players).some((p) => p.sitSpotId === spot.id),
  );
  const isOccupiedByLocal = useRoomStore(
    (s) =>
      s.localPlayerId != null &&
      s.players[s.localPlayerId]?.sitSpotId === spot.id,
  );

  // Reset cursor if component unmounts while hovered
  useEffect(() => {
    return () => { document.body.style.cursor = "auto"; };
  }, []);

  const color = isOccupied ? SIT_SPOT.markerOccupiedColor : SIT_SPOT.markerColor;
  const opacity =
    isOccupiedByLocal
      ? SIT_SPOT.markerHoverOpacity
      : hovered && !isOccupied
        ? SIT_SPOT.markerHoverOpacity
        : SIT_SPOT.markerOpacity;

  function handleClick(e: { stopPropagation: () => void }) {
    e.stopPropagation();
    if (isOccupied) return;

    const { isSitting, setSitting } = usePlayerStore.getState();

    // Stand up first if already sitting somewhere else
    if (isSitting) {
      setSitting(null);
    }

    // Walk to the spot, then sit on arrival (handled by Creature.tsx)
    usePlayerStore.getState().setTarget(spot.position.x, spot.position.z);
    usePlayerStore.getState().setPendingSit(spot.id);
  }

  return (
    <group position={[spot.position.x, 0.02, spot.position.z]}>
      <mesh
        rotation-x={-Math.PI / 2}
        onPointerOver={(e) => {
          e.stopPropagation();
          if (!isOccupied) {
            setHovered(true);
            document.body.style.cursor = "pointer";
          }
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = "auto";
        }}
        onPointerDown={handleClick}
        scale={hovered && !isOccupied ? 1.15 : 1}
      >
        <circleGeometry args={[SIT_SPOT.markerRadius, 24]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={opacity}
          depthWrite={false}
        />
      </mesh>

      {/* Label on hover */}
      {hovered && !isOccupied && (
        <Html
          center
          position={[0, SIT_SPOT.labelOffsetY, 0]}
          style={{ pointerEvents: "none" }}
        >
          <div className="whitespace-nowrap rounded bg-gray-900/90 px-2 py-0.5 text-xs text-white">
            {spot.label}
          </div>
        </Html>
      )}
    </group>
  );
}
