// Cozy Creatures - Voice Settings Panel
//
// Input device selection, volume sliders, push-to-talk toggle,
// spatial audio toggle, and mic level meter.
//
// Depends on: stores/voiceStore, zustand/react/shallow
// Used by:    ui/VoiceControls.tsx

import { useEffect, useState, useRef, useCallback } from "react";
import { useShallow } from "zustand/react/shallow";
import { useVoiceStore } from "../../stores/voiceStore";

interface VoiceSettingsProps {
  onClose: () => void;
}

export default function VoiceSettings({ onClose }: VoiceSettingsProps) {
  const {
    inputMode,
    spatialEnabled,
    selectedInputDeviceId,
    inputVolume,
    outputVolume,
    setInputMode,
    toggleSpatial,
    setSelectedInputDevice,
    setInputVolume,
    setOutputVolume,
  } = useVoiceStore(
    useShallow((s) => ({
      inputMode: s.inputMode,
      spatialEnabled: s.spatialEnabled,
      selectedInputDeviceId: s.selectedInputDeviceId,
      inputVolume: s.inputVolume,
      outputVolume: s.outputVolume,
      setInputMode: s.setInputMode,
      toggleSpatial: s.toggleSpatial,
      setSelectedInputDevice: s.setSelectedInputDevice,
      setInputVolume: s.setInputVolume,
      setOutputVolume: s.setOutputVolume,
    })),
  );

  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [micLevel, setMicLevel] = useState(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number>(0);

  // Enumerate audio input devices
  useEffect(() => {
    navigator.mediaDevices
      .enumerateDevices()
      .then((allDevices) => {
        setDevices(allDevices.filter((d) => d.kind === "audioinput"));
      })
      .catch(() => {
        /* User may not have granted mic permission yet */
      });
  }, []);

  // Mic level meter — uses a separate getUserMedia stream because LiveKit
  // doesn't expose raw PCM data. Only runs while this settings panel is open.
  useEffect(() => {
    let cancelled = false;
    let stream: MediaStream | null = null;
    let audioCtx: AudioContext | null = null;

    async function startMeter() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          audio: selectedInputDeviceId
            ? { deviceId: selectedInputDeviceId }
            : true,
        });

        // Effect was cleaned up while awaiting getUserMedia
        if (cancelled) {
          mediaStream.getTracks().forEach((t) => t.stop());
          return;
        }

        stream = mediaStream;
        audioCtx = new AudioContext();
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        analyserRef.current = analyser;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        function tick() {
          if (!analyserRef.current) return;
          analyserRef.current.getByteFrequencyData(dataArray);
          const avg =
            dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
          setMicLevel(avg / 255);
          rafRef.current = requestAnimationFrame(tick);
        }
        tick();
      } catch {
        /* User denied mic or no device available */
      }
    }

    startMeter();

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafRef.current);
      analyserRef.current = null;
      stream?.getTracks().forEach((t) => t.stop());
      audioCtx?.close();
    };
  }, [selectedInputDeviceId]);

  // Close on Escape — capture phase so VoiceSettings (topmost panel) handles
  // Escape before ChatPanel's bubble-phase handler
  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    },
    [onClose],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKey, true);
    return () => window.removeEventListener("keydown", handleKey, true);
  }, [handleKey]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Voice settings"
      className="fixed bottom-16 left-4 z-50 w-64 rounded-xl bg-gray-900/95 p-4 shadow-lg"
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-semibold text-purple-300">
          Voice Settings
        </span>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white"
        >
          {"\u00D7"}
        </button>
      </div>

      {/* Input device */}
      <label className="mb-2 block text-xs text-gray-400">
        Microphone
        <select
          value={selectedInputDeviceId ?? ""}
          onChange={(e) => setSelectedInputDevice(e.target.value || null)}
          className="mt-1 w-full rounded bg-gray-700 px-2 py-1 text-xs text-white"
        >
          <option value="">Default</option>
          {devices.map((d) => (
            <option key={d.deviceId} value={d.deviceId}>
              {d.label || `Mic ${d.deviceId.slice(0, 8)}`}
            </option>
          ))}
        </select>
      </label>

      {/* Mic level meter */}
      <div className="mb-2">
        <span className="text-xs text-gray-400">Mic Level</span>
        <div className="mt-1 h-2 w-full rounded bg-gray-700">
          <div
            className="h-full rounded bg-green-500 transition-all"
            style={{ width: `${micLevel * 100}%` }}
          />
        </div>
      </div>

      {/* Input volume */}
      <label className="mb-2 block text-xs text-gray-400">
        Input Volume
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={inputVolume}
          onChange={(e) => setInputVolume(Number(e.target.value))}
          className="mt-1 w-full"
        />
      </label>

      {/* Output volume */}
      <label className="mb-2 block text-xs text-gray-400">
        Output Volume
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={outputVolume}
          onChange={(e) => setOutputVolume(Number(e.target.value))}
          className="mt-1 w-full"
        />
      </label>

      {/* Input mode */}
      <label className="mb-2 flex items-center gap-2 text-xs text-gray-400">
        <input
          type="checkbox"
          checked={inputMode === "push-to-talk"}
          onChange={(e) =>
            setInputMode(e.target.checked ? "push-to-talk" : "open-mic")
          }
        />
        Push to Talk (V key)
      </label>

      {/* Spatial audio toggle */}
      <label className="flex items-center gap-2 text-xs text-gray-400">
        <input
          type="checkbox"
          checked={spatialEnabled}
          onChange={toggleSpatial}
        />
        Spatial Audio
      </label>
    </div>
  );
}
