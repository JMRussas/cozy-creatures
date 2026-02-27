// Cozy Creatures - Room Transition Overlay
//
// Full-screen black fade overlay shown during room switches.
//
// Depends on: @cozy/shared (ROOM_TRANSITION_DURATION_MS)
// Used by:    App.tsx

import { ROOM_TRANSITION_DURATION_MS } from "@cozy/shared";

interface RoomTransitionProps {
  isTransitioning: boolean;
}

const HALF_DURATION_MS = ROOM_TRANSITION_DURATION_MS / 2;

export default function RoomTransition({ isTransitioning }: RoomTransitionProps) {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-[100] bg-black"
      style={{
        opacity: isTransitioning ? 1 : 0,
        transition: `opacity ${HALF_DURATION_MS}ms ease-in-out`,
      }}
    />
  );
}
