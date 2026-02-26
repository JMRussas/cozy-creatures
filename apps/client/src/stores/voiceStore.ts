// Cozy Creatures - Voice Store
//
// Zustand store for voice chat state: connection, mute, deafen, speaking,
// spatial mode, remote participant speaking states.
//
// Depends on: zustand, @cozy/shared (VoiceState), networking/socket.ts
// Used by:    ui/VoiceControls.tsx, ui/VoiceSettings.tsx,
//             creatures/SpeakingIndicator.tsx, networking/useVoice.ts,
//             ui/ChatPanel.tsx, stores/roomStore.ts

import { create } from "zustand";
import type { VoiceState } from "@cozy/shared";
import { getSocket } from "../networking/socket";

const socket = getSocket();

type VoiceConnectionState = "disconnected" | "connecting" | "connected" | "error";

type VoiceInputMode = "open-mic" | "push-to-talk";

interface VoiceStoreState {
  connectionState: VoiceConnectionState;
  error: string | null;

  muted: boolean;
  deafened: boolean;
  speaking: boolean;
  inputMode: VoiceInputMode;
  spatialEnabled: boolean;

  /** Remote participant speaking states: playerId -> speaking */
  remoteSpeaking: Record<string, boolean>;

  selectedInputDeviceId: string | null;
  inputVolume: number;
  outputVolume: number;
}

interface VoiceStoreActions {
  setConnectionState: (state: VoiceConnectionState, error?: string) => void;
  toggleMute: () => void;
  setMuted: (muted: boolean) => void;
  toggleDeafen: () => void;
  setSpeaking: (speaking: boolean) => void;
  setInputMode: (mode: VoiceInputMode) => void;
  toggleSpatial: () => void;
  setSelectedInputDevice: (deviceId: string | null) => void;
  setInputVolume: (volume: number) => void;
  setOutputVolume: (volume: number) => void;
  resetVoice: () => void;
}

export const useVoiceStore = create<VoiceStoreState & VoiceStoreActions>(
  (set, get) => ({
    connectionState: "disconnected",
    error: null,
    muted: true,
    deafened: false,
    speaking: false,
    inputMode: "open-mic",
    spatialEnabled: false,
    remoteSpeaking: {},
    selectedInputDeviceId: null,
    inputVolume: 1.0,
    outputVolume: 1.0,

    setConnectionState: (connectionState, error) =>
      set({ connectionState, error: error ?? null }),

    toggleMute: () => {
      const { muted, deafened } = get();
      const newMuted = !muted;
      // Unmuting while deafened: also undeafen
      const newDeafened = !newMuted ? false : deafened;
      set({ muted: newMuted, deafened: newDeafened });
      broadcastVoiceState();
    },

    setMuted: (muted) => {
      set({ muted });
      broadcastVoiceState();
    },

    toggleDeafen: () => {
      const { deafened, muted } = get();
      const newDeafened = !deafened;
      // Deafening also mutes
      const newMuted = newDeafened ? true : muted;
      set({ deafened: newDeafened, muted: newMuted });
      broadcastVoiceState();
    },

    setSpeaking: (speaking) => {
      set({ speaking });
      broadcastVoiceState();
    },

    setInputMode: (inputMode) => set({ inputMode }),

    toggleSpatial: () => set((prev) => ({ spatialEnabled: !prev.spatialEnabled })),

    setSelectedInputDevice: (deviceId) => set({ selectedInputDeviceId: deviceId }),

    setInputVolume: (volume) =>
      set({ inputVolume: Math.max(0, Math.min(1, volume)) }),

    setOutputVolume: (volume) =>
      set({ outputVolume: Math.max(0, Math.min(1, volume)) }),

    /** Reset transient voice state on room leave.
     *  Preserves user preferences: inputMode, spatialEnabled,
     *  selectedInputDeviceId, inputVolume, outputVolume. */
    resetVoice: () =>
      set({
        connectionState: "disconnected",
        error: null,
        muted: true,
        deafened: false,
        speaking: false,
        remoteSpeaking: {},
      }),
  }),
);

// --- Broadcast helper ---

function broadcastVoiceState(): void {
  if (!socket.connected) return;
  const { muted, deafened, speaking } = useVoiceStore.getState();
  const data: VoiceState = { muted, deafened, speaking };
  socket.emit("voice:state", data);
}

// --- Socket event listeners ---
// Uses .off().on() pattern to prevent duplicate listeners on Vite HMR,
// matching the same pattern in roomStore.ts and chatStore.ts.

socket.off("voice:state").on("voice:state", (data) => {
  useVoiceStore.setState((prev) => ({
    remoteSpeaking: { ...prev.remoteSpeaking, [data.id]: data.speaking },
  }));
});
