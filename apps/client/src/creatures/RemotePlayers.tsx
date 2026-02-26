// Cozy Creatures - Remote Players
//
// Renders all remote players' creatures in the scene.
// Subscribes to player IDs only (via useShallow) so it re-renders on
// join/leave but NOT on every position update.
//
// Depends on: zustand/react/shallow, stores/roomStore.ts, RemoteCreature.tsx
// Used by:    scene/IsometricScene.tsx

import { useShallow } from "zustand/react/shallow";
import { useRoomStore } from "../stores/roomStore";
import RemoteCreature from "./RemoteCreature";

export default function RemotePlayers() {
  const remotePlayerIds = useRoomStore(
    useShallow((s) => {
      const localId = s.localPlayerId;
      return Object.keys(s.players).filter((id) => id !== localId);
    }),
  );

  return (
    <>
      {remotePlayerIds.map((id) => (
        <RemoteCreature key={id} playerId={id} />
      ))}
    </>
  );
}
