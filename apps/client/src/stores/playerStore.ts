// Cozy Creatures - Player Store
//
// Zustand store for local player state: position, target, creature type.
//
// Depends on: zustand, @cozy/shared (Position, CreatureTypeId, DEFAULT_CREATURE)
// Used by:    Creature, CameraRig, Ground, NetworkSync, roomStore

import { create } from "zustand";
import type { Position, CreatureTypeId } from "@cozy/shared";
import { DEFAULT_CREATURE } from "@cozy/shared";

export interface PlayerState {
  position: Position;
  target: Position;
  isMoving: boolean;
  creatureType: CreatureTypeId;
  name: string;
}

interface PlayerActions {
  setTarget: (x: number, z: number) => void;
  setPosition: (pos: Position) => void;
  setIsMoving: (moving: boolean) => void;
  setName: (name: string) => void;
  setCreatureType: (type: CreatureTypeId) => void;
  reset: () => void;
}

const INITIAL_POSITION: Position = { x: 0, y: 0, z: 0 };

export const usePlayerStore = create<PlayerState & PlayerActions>((set) => ({
  position: { ...INITIAL_POSITION },
  target: { ...INITIAL_POSITION },
  isMoving: false,
  creatureType: DEFAULT_CREATURE,
  name: "",

  setTarget: (x, z) => set({ target: { x, y: 0, z }, isMoving: true }),
  setPosition: (pos) => set({ position: pos }),
  setIsMoving: (moving) => set({ isMoving: moving }),
  setName: (name) => set({ name }),
  setCreatureType: (type) => set({ creatureType: type }),
  reset: () =>
    set({
      position: { ...INITIAL_POSITION },
      target: { ...INITIAL_POSITION },
      isMoving: false,
      creatureType: DEFAULT_CREATURE,
      name: "",
    }),
}));
