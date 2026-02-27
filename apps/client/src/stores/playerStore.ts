// Cozy Creatures - Player Store
//
// Zustand store for local player state: position, target, creature type, sit state.
//
// Depends on: zustand, @cozy/shared (Position, CreatureTypeId, DEFAULT_CREATURE)
// Used by:    Creature, CameraRig, Ground, NetworkSync, roomStore,
//             scene/environments/ClickPlane, scene/environments/SitSpotMarker

import { create } from "zustand";
import type { Position, CreatureTypeId } from "@cozy/shared";
import { DEFAULT_CREATURE } from "@cozy/shared";

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
}

interface PlayerActions {
  setTarget: (x: number, z: number) => void;
  setPosition: (pos: Position) => void;
  setIsMoving: (moving: boolean) => void;
  setName: (name: string) => void;
  setCreatureType: (type: CreatureTypeId) => void;
  setSitting: (sitSpotId: string | null) => void;
  setPendingSit: (sitSpotId: string | null) => void;
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
