// Cozy Creatures - Creature Constants
//
// Registry of available creature types and their metadata.
//
// Depends on: types/creature.ts
// Used by:    client creature registry, server validation

import type { CreatureDefinition } from "../types/creature.js";

/** Animations shared by all creatures. Individual overrides can be added per-creature. */
export const BASE_ANIMATIONS = ["idle", "walk", "sit", "wave"] as const;

export const CREATURES = {
  cat: {
    id: "cat",
    name: "Cat",
    modelPath: "/assets/creatures/cat/model.glb",
    thumbnailPath: "/assets/creatures/cat/thumb.png",
    animations: BASE_ANIMATIONS,
  },
  fox: {
    id: "fox",
    name: "Fox",
    modelPath: "/assets/creatures/fox/model.glb",
    thumbnailPath: "/assets/creatures/fox/thumb.png",
    animations: BASE_ANIMATIONS,
  },
  bunny: {
    id: "bunny",
    name: "Bunny",
    modelPath: "/assets/creatures/bunny/model.glb",
    thumbnailPath: "/assets/creatures/bunny/thumb.png",
    animations: BASE_ANIMATIONS,
  },
  frog: {
    id: "frog",
    name: "Frog",
    modelPath: "/assets/creatures/frog/model.glb",
    thumbnailPath: "/assets/creatures/frog/thumb.png",
    animations: BASE_ANIMATIONS,
  },
} satisfies Record<string, CreatureDefinition>;

/** Union of valid creature type IDs (e.g. "cat" | "fox" | "bunny" | "frog"). */
export type CreatureTypeId = keyof typeof CREATURES;

export const DEFAULT_CREATURE: CreatureTypeId = "cat";
