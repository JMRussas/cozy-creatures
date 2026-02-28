// Cozy Creatures - Camera Store
//
// Zustand store for camera state: zoom level with localStorage persistence.
// Separated from playerStore to avoid unnecessary re-renders in components
// that subscribe to player state but don't care about zoom.
//
// Depends on: zustand, config (CAMERA_ZOOM, CAMERA_ZOOM_MIN, CAMERA_ZOOM_MAX, CAMERA_ZOOM_STEP)
// Used by:    CameraRig, ui/camera/ZoomControls

import { create } from "zustand";
import {
  CAMERA_ZOOM,
  CAMERA_ZOOM_MIN,
  CAMERA_ZOOM_MAX,
  CAMERA_ZOOM_STEP,
} from "../config";

const LS_ZOOM = "cozy-creatures:zoom";

function loadZoom(): number {
  try {
    const v = localStorage.getItem(LS_ZOOM);
    if (v) {
      const n = Number(v);
      if (Number.isFinite(n)) return Math.max(CAMERA_ZOOM_MIN, Math.min(CAMERA_ZOOM_MAX, n));
    }
  } catch { /* localStorage unavailable */ }
  return CAMERA_ZOOM;
}

export interface CameraState {
  /** Target camera zoom level (camera lerps toward this). */
  targetZoom: number;
}

interface CameraActions {
  setTargetZoom: (zoom: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
}

export const useCameraStore = create<CameraState & CameraActions>((set) => ({
  targetZoom: loadZoom(),

  setTargetZoom: (zoom) => set({ targetZoom: Math.max(CAMERA_ZOOM_MIN, Math.min(CAMERA_ZOOM_MAX, zoom)) }),
  zoomIn: () => set((s) => ({ targetZoom: Math.min(CAMERA_ZOOM_MAX, s.targetZoom + CAMERA_ZOOM_STEP) })),
  zoomOut: () => set((s) => ({ targetZoom: Math.max(CAMERA_ZOOM_MIN, s.targetZoom - CAMERA_ZOOM_STEP) })),
}));

// Persist zoom preference to localStorage
let prevZoom = useCameraStore.getState().targetZoom;
useCameraStore.subscribe((state) => {
  if (state.targetZoom !== prevZoom) {
    prevZoom = state.targetZoom;
    try { localStorage.setItem(LS_ZOOM, String(state.targetZoom)); } catch { /* ignore */ }
  }
});
