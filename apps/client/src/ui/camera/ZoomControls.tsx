// Cozy Creatures - Zoom Controls
//
// HUD overlay with +/- zoom buttons and keyboard shortcuts.
// Reads target zoom from cameraStore and calls zoomIn/zoomOut actions.
//
// Depends on: stores/cameraStore, config (CAMERA_ZOOM_MIN, CAMERA_ZOOM_MAX)
// Used by:    App.tsx (InRoomView HUD)

import { useEffect } from "react";
import { useCameraStore } from "../../stores/cameraStore";
import { CAMERA_ZOOM_MIN, CAMERA_ZOOM_MAX } from "../../config";

/** Returns true if the event target is an element that accepts text input. */
function isTextInput(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable;
}

export default function ZoomControls() {
  const targetZoom = useCameraStore((s) => s.targetZoom);
  const zoomIn = useCameraStore((s) => s.zoomIn);
  const zoomOut = useCameraStore((s) => s.zoomOut);

  const atMax = targetZoom >= CAMERA_ZOOM_MAX;
  const atMin = targetZoom <= CAMERA_ZOOM_MIN;

  // Keyboard shortcuts: +/= to zoom in, - to zoom out
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (isTextInput(e.target)) return;

      if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        useCameraStore.getState().zoomIn();
      } else if (e.key === "-") {
        e.preventDefault();
        useCameraStore.getState().zoomOut();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const btnBase =
    "pointer-events-auto flex h-7 w-7 items-center justify-center rounded bg-gray-900/80 text-sm font-bold text-gray-200 transition-colors";

  return (
    <div
      className="pointer-events-none absolute bottom-20 right-4 flex flex-col gap-1"
      role="group"
      aria-label="Zoom controls"
    >
      <button
        onClick={zoomIn}
        disabled={atMax}
        className={`${btnBase} ${atMax ? "cursor-not-allowed opacity-40" : "hover:bg-gray-700/80"}`}
        title="Zoom in (+)"
        aria-label="Zoom in"
      >
        +
      </button>
      <button
        onClick={zoomOut}
        disabled={atMin}
        className={`${btnBase} ${atMin ? "cursor-not-allowed opacity-40" : "hover:bg-gray-700/80"}`}
        title="Zoom out (-)"
        aria-label="Zoom out"
      >
        &minus;
      </button>
    </div>
  );
}
