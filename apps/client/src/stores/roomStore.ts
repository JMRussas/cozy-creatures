// Cozy Creatures - Room Store
//
// Zustand store for room state: all players (including remote), connection status,
// room switching, and live room counts.
// Wires Socket.io listeners to keep state in sync with the server.
//
// Depends on: @cozy/shared (Player, CreatureTypeId, RoomId, ROOM_TRANSITION_DURATION_MS),
//             networking/socket.ts, stores/playerStore, stores/chatStore, stores/voiceStore
// Used by:    App.tsx, creatures/Creature, creatures/RemotePlayers, creatures/RemoteCreature,
//             ui/ChatPanel, networking/useVoice, ui/rooms/RoomBrowser

import { create } from "zustand";
import type { Player, CreatureTypeId, RoomId } from "@cozy/shared";
import { ROOM_TRANSITION_DURATION_MS } from "@cozy/shared";
import { getSocket, connectSocket, disconnectSocket } from "../networking/socket";
import { usePlayerStore } from "./playerStore";
import { useChatStore } from "./chatStore";
import { useVoiceStore } from "./voiceStore";

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
  /** Live player counts per room (updated via room:player-count). */
  roomCounts: Record<string, number>;
  /** True during room switch fade transition. */
  isTransitioning: boolean;

  // Actions
  join: (name: string, creatureType: CreatureTypeId, roomId: RoomId) => void;
  leave: () => void;
  switchRoom: (roomId: RoomId) => void;
}

/** Handle for the active join timeout, cleared on callback or leave. */
let joinTimeoutHandle: ReturnType<typeof setTimeout> | null = null;
/** Handle for the room switch fade-out timer, cleared on leave. */
let switchTimeoutHandle: ReturnType<typeof setTimeout> | null = null;

function clearJoinTimeout(): void {
  if (joinTimeoutHandle !== null) {
    clearTimeout(joinTimeoutHandle);
    joinTimeoutHandle = null;
  }
}

function clearSwitchTimeout(): void {
  if (switchTimeoutHandle !== null) {
    clearTimeout(switchTimeoutHandle);
    switchTimeoutHandle = null;
  }
}

export const useRoomStore = create<RoomStore>((set, get) => ({
  roomId: null,
  players: {},
  localPlayerId: null,
  isConnected: false,
  joinState: "idle",
  joinError: null,
  roomCounts: {},
  isTransitioning: false,

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
    clearSwitchTimeout();

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
      isTransitioning: false,
    });

    // Reset local player position so re-joining starts fresh
    usePlayerStore.getState().reset();
    useChatStore.getState().clearChat();
    useVoiceStore.getState().resetVoice();
  },

  switchRoom: (roomId) => {
    const { joinState, isTransitioning, roomId: currentRoomId } = get();
    if (joinState !== "joined" || isTransitioning) return;
    if (roomId === currentRoomId) return;

    set({ isTransitioning: true });

    // Wait for fade-out, then send the switch request
    clearSwitchTimeout();
    switchTimeoutHandle = setTimeout(() => {
      switchTimeoutHandle = null;
      socket.emit("player:switch-room", { roomId }, (response) => {
        if (!response.success) {
          set({ isTransitioning: false, joinError: response.error });
          return;
        }

        // Reset local player state for new room
        usePlayerStore.getState().reset();
        useChatStore.getState().clearChat();

        // Server sends room:state which updates roomId + players.
        // Wait for fade-in before clearing transition.
        setTimeout(() => {
          set({ isTransitioning: false });
        }, ROOM_TRANSITION_DURATION_MS / 2);
      });
    }, ROOM_TRANSITION_DURATION_MS / 2);
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
  const { joinState, isTransitioning } = useRoomStore.getState();
  // Accept room:state during initial join or room switch transitions
  if (joinState !== "joined" && !isTransitioning) return;
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

// PERF: player:moved fires ~10Hz per remote player, creating a new
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
  // Clean up remote speaking state for departed player
  useVoiceStore.setState((prev) => {
    if (!(id in prev.remoteSpeaking)) return prev;
    const { [id]: _, ...rest } = prev.remoteSpeaking;
    return { remoteSpeaking: rest };
  });
});

socket.off("player:kicked").on("player:kicked", ({ reason }) => {
  console.log(`[socket] kicked: ${reason}`);
  const store = useRoomStore.getState();
  if (store.joinState === "joined") {
    disconnectSocket();
    useRoomStore.setState({
      roomId: null,
      players: {},
      localPlayerId: null,
      isConnected: false,
      joinState: "idle",
      joinError: `Disconnected: ${reason}`,
    });
    usePlayerStore.getState().reset();
    useChatStore.getState().clearChat();
    useVoiceStore.getState().resetVoice();
  }
});

socket.off("player:skin-changed").on("player:skin-changed", ({ id, skinId }) => {
  useRoomStore.setState((prev) => {
    const player = prev.players[id];
    if (!player) return prev;
    return {
      players: {
        ...prev.players,
        [id]: { ...player, skinId: skinId ?? undefined },
      },
    };
  });
});

// --- Stage 6: Room counts + sit/stand ---

socket.off("room:player-count").on("room:player-count", ({ roomId, playerCount }) => {
  useRoomStore.setState((prev) => ({
    roomCounts: { ...prev.roomCounts, [roomId]: playerCount },
  }));
});

socket.off("player:sat").on("player:sat", ({ id, sitSpotId, position }) => {
  useRoomStore.setState((prev) => {
    const player = prev.players[id];
    if (!player) return prev;
    return {
      players: {
        ...prev.players,
        [id]: { ...player, sitSpotId, position },
      },
    };
  });
});

socket.off("player:stood").on("player:stood", ({ id }) => {
  useRoomStore.setState((prev) => {
    const player = prev.players[id];
    if (!player) return prev;
    const { sitSpotId: _, ...rest } = player;
    return {
      players: {
        ...prev.players,
        [id]: rest,
      },
    };
  });
});
