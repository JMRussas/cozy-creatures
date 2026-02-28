// Cozy Creatures - Player Store
//
// Zustand store for local player state: position, target, creature type, sit state.
//
// Depends on: zustand, @cozy/shared (Position, CreatureTypeId, DEFAULT_CREATURE), config
// Used by:    Creature, CameraRig, Ground, NetworkSync, roomStore,
//             scene/environments/ClickPlane, scene/environments/SitSpotMarker,
//             ui/ZoomControls

import { create } from "zustand";
import type { Position, CreatureTypeId } from "@cozy/shared";
import { DEFAULT_CREATURE } from "@cozy/shared";
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

export interface PlayerState {
  position: Position;
  target: Position;
  isMoving: boolean;
  creatureType: CreatureTypeId;
  name: string;
  /** True when the local player is sitting at a spot. */
  isSitting: boolean;
  /** ID of the sit spot the player is occupying. */
  sitSpotId: string | null;
  /** Sit spot the player is walking toward (claimed on arrival). */
  pendingSitId: string | null;
  /** Target camera zoom level (camera lerps toward this). */
  targetZoom: number;
}

interface PlayerActions {
  setTarget: (x: number, z: number) => void;
  setPosition: (pos: Position) => void;
  setIsMoving: (moving: boolean) => void;
  setName: (name: string) => void;
  setCreatureType: (type: CreatureTypeId) => void;
  setSitting: (sitSpotId: string | null) => void;
  setPendingSit: (sitSpotId: string | null) => void;
  setTargetZoom: (zoom: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  reset: () => void;
}

const INITIAL_POSITION: Position = { x: 0, y: 0, z: 0 };

export const usePlayerStore = create<PlayerState & PlayerActions>((set) => ({
  position: { ...INITIAL_POSITION },
  target: { ...INITIAL_POSITION },
  isMoving: false,
  creatureType: DEFAULT_CREATURE,
  name: "",
  isSitting: false,
  sitSpotId: null,
  pendingSitId: null,
  targetZoom: loadZoom(),

  setTarget: (x, z) => set({ target: { x, y: 0, z }, isMoving: true }),
  setPosition: (pos) => set({ position: pos }),
  setIsMoving: (moving) => set({ isMoving: moving }),
  setName: (name) => set({ name }),
  setCreatureType: (type) => set({ creatureType: type }),
  setSitting: (sitSpotId) =>
    set(
      sitSpotId
        ? { isSitting: true, sitSpotId, pendingSitId: null, isMoving: false }
        : { isSitting: false, sitSpotId: null, pendingSitId: null },
    ),
  setPendingSit: (sitSpotId) => set({ pendingSitId: sitSpotId }),
  setTargetZoom: (zoom) => set({ targetZoom: Math.max(CAMERA_ZOOM_MIN, Math.min(CAMERA_ZOOM_MAX, zoom)) }),
  zoomIn: () => set((s) => ({ targetZoom: Math.min(CAMERA_ZOOM_MAX, s.targetZoom + CAMERA_ZOOM_STEP) })),
  zoomOut: () => set((s) => ({ targetZoom: Math.max(CAMERA_ZOOM_MIN, s.targetZoom - CAMERA_ZOOM_STEP) })),
  // Note: reset() does NOT reset targetZoom — zoom persists across room switches.
  reset: () =>
    set({
      position: { ...INITIAL_POSITION },
      target: { ...INITIAL_POSITION },
      isMoving: false,
      creatureType: DEFAULT_CREATURE,
      name: "",
      isSitting: false,
      sitSpotId: null,
      pendingSitId: null,
    }),
}));

// Persist zoom preference to localStorage
let prevZoom = usePlayerStore.getState().targetZoom;
usePlayerStore.subscribe((state) => {
  if (state.targetZoom !== prevZoom) {
    prevZoom = state.targetZoom;
    try { localStorage.setItem(LS_ZOOM, String(state.targetZoom)); } catch { /* ignore */ }
  }
});
