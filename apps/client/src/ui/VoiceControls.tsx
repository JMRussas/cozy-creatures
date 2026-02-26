// Cozy Creatures - Voice Controls
//
// Mic toggle, deafen toggle, settings gear, and connection status indicator.
// Rendered in the HUD overlay when in a room.
//
// Depends on: stores/voiceStore, zustand/react/shallow, ui/VoiceSettings
// Used by:    App.tsx

import { useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { useVoiceStore } from "../stores/voiceStore";
import VoiceSettings from "./VoiceSettings";

export default function VoiceControls() {
  const { connectionState, muted, deafened, toggleMute, toggleDeafen } =
    useVoiceStore(
      useShallow((s) => ({
        connectionState: s.connectionState,
        muted: s.muted,
        deafened: s.deafened,
        toggleMute: s.toggleMute,
        toggleDeafen: s.toggleDeafen,
      })),
    );

  const [showSettings, setShowSettings] = useState(false);

  const isConnected = connectionState === "connected";
  const isConnecting = connectionState === "connecting";

  return (
    <div className="pointer-events-auto flex items-center gap-1">
      {/* Mic toggle */}
      <button
        onClick={toggleMute}
        disabled={!isConnected}
        className={`rounded px-2 py-1 text-xs font-semibold transition-colors ${
          muted
            ? "bg-red-600/80 text-white hover:bg-red-500"
            : "bg-green-600/80 text-white hover:bg-green-500"
        } disabled:opacity-50`}
        title={muted ? "Unmute (V for push-to-talk)" : "Mute"}
        aria-label={muted ? "Unmute microphone" : "Mute microphone"}
      >
        {muted ? "\u{1F507}" : "\u{1F3A4}"}
      </button>

      {/* Deafen toggle */}
      <button
        onClick={toggleDeafen}
        disabled={!isConnected}
        className={`rounded px-2 py-1 text-xs font-semibold transition-colors ${
          deafened
            ? "bg-red-600/80 text-white hover:bg-red-500"
            : "bg-gray-600/80 text-white hover:bg-gray-500"
        } disabled:opacity-50`}
        title={deafened ? "Undeafen" : "Deafen"}
        aria-label={deafened ? "Undeafen" : "Deafen"}
      >
        {deafened ? "\u{1F507}" : "\u{1F50A}"}
      </button>

      {/* Settings gear */}
      <button
        onClick={() => setShowSettings(!showSettings)}
        className="rounded bg-gray-600/80 px-2 py-1 text-xs text-white transition-colors hover:bg-gray-500"
        title="Voice settings"
        aria-label="Voice settings"
      >
        {"\u2699"}
      </button>

      {/* Connection status dot */}
      <span
        className={`h-2 w-2 rounded-full ${
          isConnected
            ? "bg-green-400"
            : isConnecting
              ? "animate-pulse bg-yellow-400"
              : "bg-red-400"
        }`}
        title={connectionState}
        role="status"
        aria-label={`Voice ${connectionState}`}
      />

      {showSettings && (
        <VoiceSettings onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
}
