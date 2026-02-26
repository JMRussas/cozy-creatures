// Cozy Creatures - Room Store
//
// Zustand store for room state: all players (including remote), connection status.
// Wires Socket.io listeners to keep state in sync with the server.
//
// Depends on: @cozy/shared (Player, CreatureTypeId, RoomId), networking/socket.ts, stores/playerStore,
//             stores/chatStore
// Used by:    App.tsx, creatures/Creature, creatures/RemotePlayers, creatures/RemoteCreature,
//             ui/ChatPanel

import { create } from "zustand";
import type { Player, CreatureTypeId, RoomId } from "@cozy/shared";
import { getSocket, connectSocket, disconnectSocket } from "../networking/socket";
import { usePlayerStore } from "./playerStore";
import { useChatStore } from "./chatStore";

const socket = getSocket();

type JoinState = "idle" | "joining" | "joined";

const JOIN_TIMEOUT_MS = 10_000;

interface RoomStore {
  // State
  roomId: string | null;
  players: Record<string, Player>;
  localPlayerId: string | null;
  isConnected: boolean;
  joinState: JoinState;
  joinError: string | null;

  // Actions
  join: (name: string, creatureType: CreatureTypeId, roomId: RoomId) => void;
  leave: () => void;
}

/** Handle for the active join timeout, cleared on callback or leave. */
let joinTimeoutHandle: ReturnType<typeof setTimeout> | null = null;

function clearJoinTimeout(): void {
  if (joinTimeoutHandle !== null) {
    clearTimeout(joinTimeoutHandle);
    joinTimeoutHandle = null;
  }
}

export const useRoomStore = create<RoomStore>((set, get) => ({
  roomId: null,
  players: {},
  localPlayerId: null,
  isConnected: false,
  joinState: "idle",
  joinError: null,

  join: (name, creatureType, roomId) => {
    const { joinState } = get();
    if (joinState === "joining" || joinState === "joined") return;

    set({ joinState: "joining", joinError: null });
    connectSocket();

    // Timeout: if the server never responds, reset to idle
    clearJoinTimeout();
    joinTimeoutHandle = setTimeout(() => {
      if (get().joinState === "joining") {
        set({ joinState: "idle", joinError: "Join request timed out" });
        disconnectSocket();
      }
    }, JOIN_TIMEOUT_MS);

    socket.emit("player:join", { name, creatureType, roomId }, (response) => {
      clearJoinTimeout();
      if (!response.success) {
        set({ joinState: "idle", joinError: response.error });
        disconnectSocket();
        return;
      }
      set({ localPlayerId: response.playerId, joinState: "joined" });

      // Sync local player store with the join data
      const ps = usePlayerStore.getState();
      ps.setName(name);
      ps.setCreatureType(creatureType);
    });
  },

  leave: () => {
    clearJoinTimeout();

    // Always emit player:leave if the socket is connected, regardless of
    // whether we've received room:state yet. This prevents ghost players
    // when the user leaves during the join→room:state window.
    if (socket.connected) {
      socket.emit("player:leave");
    }
    disconnectSocket();
    set({
      roomId: null,
      players: {},
      localPlayerId: null,
      isConnected: false,
      joinState: "idle",
      joinError: null,
    });

    // Reset local player position so re-joining starts fresh
    usePlayerStore.getState().reset();
    useChatStore.getState().clearChat();
  },

}));

// --- Socket event listeners ---
// Each listener uses .off().on() to prevent duplicate accumulation on Vite HMR,
// which re-executes this module while reusing the same socket instance.
// Alternative: Vite's import.meta.hot.dispose() could handle cleanup, but that
// couples the store to the bundler. The .off().on() pattern is framework-agnostic.

socket.off("connect").on("connect", () => {
  useRoomStore.setState({ isConnected: true });
  console.log("[socket] connected");
});

socket.off("connect_error").on("connect_error", (err) => {
  console.error("[socket] connect_error:", err.message);
  const { joinState } = useRoomStore.getState();
  if (joinState === "joining") {
    clearJoinTimeout();
    useRoomStore.setState({
      joinState: "idle",
      joinError: `Connection failed: ${err.message}`,
    });
  }
});

socket.off("disconnect").on("disconnect", () => {
  useRoomStore.setState({ isConnected: false });
  console.log("[socket] disconnected");
});

socket.off("room:state").on("room:state", (state) => {
  if (useRoomStore.getState().joinState !== "joined") return;
  useRoomStore.setState({
    roomId: state.id,
    players: state.players,
  });
});

socket.off("player:joined").on("player:joined", (player) => {
  useRoomStore.setState((prev) => ({
    players: { ...prev.players, [player.id]: player },
  }));
});

// TODO(Stage 4): player:moved fires ~10Hz per remote player, creating a new
// players object each time. For large rooms, switch to ref-based positions
// (e.g. Map<string, THREE.Vector3>) read directly in useFrame, bypassing React.
socket.off("player:moved").on("player:moved", ({ id, position }) => {
  useRoomStore.setState((prev) => {
    const player = prev.players[id];
    if (!player) return prev;
    return {
      players: {
        ...prev.players,
        [id]: { ...player, position },
      },
    };
  });
});

socket.off("player:left").on("player:left", ({ id }) => {
  useRoomStore.setState((prev) => {
    const { [id]: _, ...rest } = prev.players;
    return { players: rest };
  });
});
