// Cozy Creatures - Spatial Audio Manager
//
// Positions remote audio tracks in 3D space using Web Audio API PannerNodes.
// Maps creature world positions to audio listener/source positions.
// Only active when spatial mode is enabled in voiceStore.
//
// Depends on: @react-three/fiber, stores/voiceStore, stores/playerStore,
//             stores/roomStore, networking/useVoice,
//             @cozy/shared (VOICE_SPATIAL_MIN_DISTANCE, VOICE_SPATIAL_MAX_DISTANCE)
// Used by:    scene/IsometricScene.tsx

import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  VOICE_SPATIAL_MIN_DISTANCE,
  VOICE_SPATIAL_MAX_DISTANCE,
} from "@cozy/shared";
import { useVoiceStore } from "../stores/voiceStore";
import { usePlayerStore } from "../stores/playerStore";
import { useRoomStore } from "../stores/roomStore";
import { getLivekitRoom } from "./useVoice";

interface SpatialSource {
  panner: PannerNode;
  gain: GainNode;
  sourceNode: MediaStreamAudioSourceNode;
}

export default function SpatialAudioManager() {
  const spatialEnabled = useVoiceStore((s) => s.spatialEnabled);
  const outputVolume = useVoiceStore((s) => s.outputVolume);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const spatialSourcesRef = useRef(new Map<string, SpatialSource>());

  // Create/destroy AudioContext based on spatial mode
  useEffect(() => {
    if (!spatialEnabled) {
      cleanupAll(spatialSourcesRef.current, audioCtxRef);
      return;
    }

    audioCtxRef.current = new AudioContext();
    return () => cleanupAll(spatialSourcesRef.current, audioCtxRef);
  }, [spatialEnabled]);

  // Update spatial positions each frame
  useFrame(() => {
    if (!spatialEnabled) return;

    const audioCtx = audioCtxRef.current;
    const room = getLivekitRoom();
    if (!audioCtx || !room) return;

    const sources = spatialSourcesRef.current;
    const localPos = usePlayerStore.getState().position;
    const players = useRoomStore.getState().players;

    // Update listener position (local player)
    const listener = audioCtx.listener;
    if (listener.positionX) {
      listener.positionX.value = localPos.x;
      listener.positionY.value = localPos.y;
      listener.positionZ.value = localPos.z;
    }

    // Update each remote participant's panner position
    for (const participant of room.remoteParticipants.values()) {
      const player = players[participant.identity];
      if (!player) continue;

      let source = sources.get(participant.identity);

      if (!source) {
        // Find an audio track to route through the panner
        let mediaStream: MediaStream | undefined;
        for (const pub of participant.audioTrackPublications.values()) {
          if (pub.track?.mediaStream) {
            mediaStream = pub.track.mediaStream;
            break;
          }
        }
        if (!mediaStream) continue;

        const panner = audioCtx.createPanner();
        panner.panningModel = "HRTF";
        panner.distanceModel = "inverse";
        panner.refDistance = VOICE_SPATIAL_MIN_DISTANCE;
        panner.maxDistance = VOICE_SPATIAL_MAX_DISTANCE;
        panner.rolloffFactor = 1;

        const gain = audioCtx.createGain();
        gain.gain.setValueAtTime(outputVolume, audioCtx.currentTime);

        const sourceNode = audioCtx.createMediaStreamSource(mediaStream);
        sourceNode.connect(panner);
        panner.connect(gain);
        gain.connect(audioCtx.destination);

        source = { panner, gain, sourceNode };
        sources.set(participant.identity, source);
      }

      // Update panner position from player world position
      if (source.panner.positionX) {
        source.panner.positionX.value = player.position.x;
        source.panner.positionY.value = player.position.y;
        source.panner.positionZ.value = player.position.z;
      }

      // Update volume with smooth ramp to avoid audio clicks
      source.gain.gain.setTargetAtTime(outputVolume, audioCtx.currentTime, 0.02);
    }

    // Clean up panners for participants who left (collect first, then delete)
    const toRemove: string[] = [];
    for (const [identity] of sources) {
      if (!room.remoteParticipants.has(identity)) {
        toRemove.push(identity);
      }
    }
    for (const identity of toRemove) {
      removeSpatialSource(sources, identity);
    }
  });

  return null;
}

function removeSpatialSource(
  sources: Map<string, SpatialSource>,
  identity: string,
): void {
  const source = sources.get(identity);
  if (source) {
    source.sourceNode.disconnect();
    source.panner.disconnect();
    source.gain.disconnect();
    sources.delete(identity);
  }
}

function cleanupAll(
  sources: Map<string, SpatialSource>,
  ctxRef: { current: AudioContext | null },
): void {
  const identities = [...sources.keys()];
  for (const identity of identities) {
    removeSpatialSource(sources, identity);
  }
  ctxRef.current?.close().catch(() => {});
  ctxRef.current = null;
}
