// Cozy Creatures - Voice Connection Hook
//
// Manages LiveKit Room lifecycle: connect on room join, disconnect on leave.
// Bridges LiveKit events (speaking changes, reconnection) to voiceStore.
//
// Depends on: livekit-client, stores/voiceStore, stores/roomStore,
//             @cozy/shared (VoiceTokenResponse, VOICE_PTT_KEY)
// Used by:    App.tsx (rendered when in room)

import { useEffect, useRef } from "react";
import {
  Room,
  RoomEvent,
  ParticipantEvent,
  ConnectionState,
  Track,
} from "livekit-client";
import type { RemoteTrack, RemoteTrackPublication } from "livekit-client";
import type { VoiceTokenResponse } from "@cozy/shared";
import { VOICE_PTT_KEY } from "@cozy/shared";
import { useVoiceStore } from "../stores/voiceStore";
import { useRoomStore } from "../stores/roomStore";

/** Singleton LiveKit Room instance, accessible by SpatialAudioManager. */
let livekitRoom: Room | null = null;

export function getLivekitRoom(): Room | null {
  return livekitRoom;
}

export default function useVoice(): void {
  const roomId = useRoomStore((s) => s.roomId);
  const localPlayerId = useRoomStore((s) => s.localPlayerId);
  const muted = useVoiceStore((s) => s.muted);
  const deafened = useVoiceStore((s) => s.deafened);
  const inputMode = useVoiceStore((s) => s.inputMode);

  const roomRef = useRef<Room | null>(null);
  const teardownRef = useRef<(() => void) | null>(null);

  // --- Connect to LiveKit when joining a room ---
  useEffect(() => {
    if (!roomId || !localPlayerId) return;

    let cancelled = false;

    const room = new Room({
      adaptiveStream: true,
      dynacast: true,
      audioCaptureDefaults: {
        autoGainControl: true,
        echoCancellation: true,
        noiseSuppression: true,
      },
    });

    roomRef.current = room;
    livekitRoom = room;

    async function connect() {
      useVoiceStore.getState().setConnectionState("connecting");
      try {
        const res = await fetch("/api/voice/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            playerId: localPlayerId,
            playerName:
              useRoomStore.getState().players[localPlayerId!]?.name ??
              "Unknown",
            roomId,
          }),
        });

        if (cancelled) return;

        if (!res.ok) {
          throw new Error(`Token request failed: ${res.status}`);
        }

        const { token, url } = (await res.json()) as VoiceTokenResponse;
        if (cancelled) return;

        // Wire up events before connecting; store teardown for cleanup
        teardownRef.current = setupRoomEvents(room);

        await room.connect(url, token);
        if (cancelled) return;

        useVoiceStore.getState().setConnectionState("connected");

        // Publish mic track (starts muted per voiceStore default)
        await room.localParticipant.setMicrophoneEnabled(
          !useVoiceStore.getState().muted,
        );
        if (cancelled) return;

        console.log("[voice] connected to LiveKit");
      } catch (err) {
        if (cancelled) return;
        console.error("[voice] connection error:", err);
        useVoiceStore
          .getState()
          .setConnectionState(
            "error",
            err instanceof Error ? err.message : "Connection failed",
          );
      }
    }

    connect();

    return () => {
      cancelled = true;
      teardownRef.current?.();
      teardownRef.current = null;
      room.disconnect();
      livekitRoom = null;
      roomRef.current = null;
      useVoiceStore.getState().resetVoice();
      console.log("[voice] disconnected from LiveKit");
    };
  }, [roomId, localPlayerId]);

  // --- Sync mute state to LiveKit ---
  useEffect(() => {
    const room = roomRef.current;
    if (!room || room.state !== ConnectionState.Connected) return;
    room.localParticipant.setMicrophoneEnabled(!muted).catch((err) => {
      console.error("[voice] failed to toggle mic:", err);
    });
  }, [muted]);

  // --- Sync deafen state to LiveKit ---
  useEffect(() => {
    const room = roomRef.current;
    if (!room || room.state !== ConnectionState.Connected) return;

    for (const participant of room.remoteParticipants.values()) {
      for (const pub of participant.audioTrackPublications.values()) {
        (pub as RemoteTrackPublication).setEnabled(!deafened);
      }
    }
  }, [deafened]);

  // --- Push-to-talk ---
  useEffect(() => {
    if (inputMode !== "push-to-talk") return;

    function handleKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.code === VOICE_PTT_KEY && !e.repeat) {
        useVoiceStore.getState().setMuted(false);
      }
    }

    function handleKeyUp(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.code === VOICE_PTT_KEY) {
        useVoiceStore.getState().setMuted(true);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [inputMode]);
}

/** Wire up LiveKit Room event listeners and return a teardown function. */
function setupRoomEvents(room: Room): () => void {
  function onLocalSpeaking(speaking: boolean) {
    useVoiceStore.getState().setSpeaking(speaking);
  }

  function onActiveSpeakers(speakers: { identity: string }[]) {
    const speakingSet = new Set(speakers.map((s) => s.identity));
    const remoteSpeaking: Record<string, boolean> = {};

    for (const participant of room.remoteParticipants.values()) {
      remoteSpeaking[participant.identity] = speakingSet.has(
        participant.identity,
      );
    }

    useVoiceStore.setState({ remoteSpeaking });
  }

  function onReconnecting() {
    useVoiceStore.getState().setConnectionState("connecting");
    console.log("[voice] reconnecting...");
  }

  function onReconnected() {
    useVoiceStore.getState().setConnectionState("connected");
    console.log("[voice] reconnected");
  }

  function onDisconnected() {
    useVoiceStore.getState().setConnectionState("disconnected");
    console.log("[voice] disconnected");
  }

  // M4: Apply deafen state to late-joining participants' audio tracks
  function onTrackSubscribed(
    track: RemoteTrack,
    publication: RemoteTrackPublication,
  ) {
    if (track.kind === Track.Kind.Audio && useVoiceStore.getState().deafened) {
      publication.setEnabled(false);
    }
  }

  room.localParticipant.on(
    ParticipantEvent.IsSpeakingChanged,
    onLocalSpeaking,
  );
  room.on(RoomEvent.ActiveSpeakersChanged, onActiveSpeakers);
  room.on(RoomEvent.Reconnecting, onReconnecting);
  room.on(RoomEvent.Reconnected, onReconnected);
  room.on(RoomEvent.Disconnected, onDisconnected);
  room.on(RoomEvent.TrackSubscribed, onTrackSubscribed);

  return () => {
    room.localParticipant.off(
      ParticipantEvent.IsSpeakingChanged,
      onLocalSpeaking,
    );
    room.off(RoomEvent.ActiveSpeakersChanged, onActiveSpeakers);
    room.off(RoomEvent.Reconnecting, onReconnecting);
    room.off(RoomEvent.Reconnected, onReconnected);
    room.off(RoomEvent.Disconnected, onDisconnected);
    room.off(RoomEvent.TrackSubscribed, onTrackSubscribed);
  };
}
