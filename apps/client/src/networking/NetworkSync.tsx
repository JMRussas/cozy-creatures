// Cozy Creatures - Network Sync
//
// Subscribes to local playerStore position and emits throttled
// position updates to the server. Render this inside the R3F Canvas
// or as a regular React component.
//
// Depends on: stores/playerStore, networking/socket, @cozy/shared (POSITION_UPDATE_THROTTLE_MS)
// Used by:    scene/IsometricScene.tsx

import { useEffect, useRef } from "react";
import type { Position } from "@cozy/shared";
import { POSITION_UPDATE_THROTTLE_MS } from "@cozy/shared";
import { usePlayerStore } from "../stores/playerStore";
import { getSocket } from "./socket";

const socket = getSocket();

export default function NetworkSync() {
  const lastSentRef = useRef(0);
  const lastPosRef = useRef<Position>({ x: 0, y: 0, z: 0 });

  useEffect(() => {
    const unsub = usePlayerStore.subscribe((state) => {
      const now = Date.now();
      if (now - lastSentRef.current < POSITION_UPDATE_THROTTLE_MS) return;
      if (!socket.connected) return;

      // Only emit if position actually changed
      const { x, y, z } = state.position;
      const prev = lastPosRef.current;
      if (x === prev.x && y === prev.y && z === prev.z) return;

      lastSentRef.current = now;
      lastPosRef.current = { x, y, z };
      socket.emit("player:move", { position: { x, y, z } });
    });

    return unsub;
  }, []);

  return null;
}
