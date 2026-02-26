// Cozy Creatures - Creature Constants
//
// Registry of available creature types and their metadata.
//
// Depends on: types/creature.ts
// Used by:    client creature registry, server validation

import type { CreatureDefinition } from "../types/creature.js";

export const CREATURES: Record<string, CreatureDefinition> = {
  cat: {
    id: "cat",
    name: "Cat",
    modelPath: "/assets/creatures/cat/model.glb",
    thumbnailPath: "/assets/creatures/cat/thumb.png",
    animations: ["idle", "walk", "sit", "wave"],
  },
  fox: {
    id: "fox",
    name: "Fox",
    modelPath: "/assets/creatures/fox/model.glb",
    thumbnailPath: "/assets/creatures/fox/thumb.png",
    animations: ["idle", "walk", "sit", "wave"],
  },
  bunny: {
    id: "bunny",
    name: "Bunny",
    modelPath: "/assets/creatures/bunny/model.glb",
    thumbnailPath: "/assets/creatures/bunny/thumb.png",
    animations: ["idle", "walk", "sit", "wave"],
  },
  frog: {
    id: "frog",
    name: "Frog",
    modelPath: "/assets/creatures/frog/model.glb",
    thumbnailPath: "/assets/creatures/frog/thumb.png",
    animations: ["idle", "walk", "sit", "wave"],
  },
};

export const DEFAULT_CREATURE = "cat";
