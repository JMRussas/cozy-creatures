// Cozy Creatures - Zoom Controls
//
// HUD overlay with +/- zoom buttons and keyboard shortcuts.
// Reads target zoom from playerStore and calls zoomIn/zoomOut actions.
//
// Depends on: stores/playerStore, config (CAMERA_ZOOM_MIN, CAMERA_ZOOM_MAX)
// Used by:    App.tsx (InRoomView HUD)

import { useEffect } from "react";
import { usePlayerStore } from "../stores/playerStore";
import { CAMERA_ZOOM_MIN, CAMERA_ZOOM_MAX } from "../config";

export default function ZoomControls() {
  const targetZoom = usePlayerStore((s) => s.targetZoom);
  const zoomIn = usePlayerStore((s) => s.zoomIn);
  const zoomOut = usePlayerStore((s) => s.zoomOut);

  const atMax = targetZoom >= CAMERA_ZOOM_MAX;
  const atMin = targetZoom <= CAMERA_ZOOM_MIN;

  // Keyboard shortcuts: +/= to zoom in, - to zoom out
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      // Don't capture when typing in form elements
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        usePlayerStore.getState().zoomIn();
      } else if (e.key === "-") {
        e.preventDefault();
        usePlayerStore.getState().zoomOut();
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
