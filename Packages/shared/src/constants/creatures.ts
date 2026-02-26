// Cozy Creatures - Creature Constants
//
// Registry of available creature types and their metadata.
// Models sourced from Cute Zoo 4 (SURIYUN) asset pack.
//
// Depends on: types/creature.ts
// Used by:    client creature registry, server validation

import type { CreatureDefinition } from "../types/creature.js";

/** Animations shared by all creatures (matching Cute Zoo 4 clips). */
export const BASE_ANIMATIONS = ["idle", "walk", "run", "eat", "rest"] as const;

export const CREATURES = {
  otter: {
    id: "otter",
    name: "Otter",
    description: "Playful and curious. Loves to splash around.",
    modelPath: "/assets/creatures/otter/model.glb",
    thumbnailPath: "/assets/creatures/otter/thumb.png",
    animations: BASE_ANIMATIONS,
  },
  "red-panda": {
    id: "red-panda",
    name: "Red Panda",
    description: "Fluffy and bashful. Expert napper.",
    modelPath: "/assets/creatures/red-panda/model.glb",
    thumbnailPath: "/assets/creatures/red-panda/thumb.png",
    animations: BASE_ANIMATIONS,
  },
  sloth: {
    id: "sloth",
    name: "Sloth",
    description: "Takes it slow. Maximum cozy energy.",
    modelPath: "/assets/creatures/sloth/model.glb",
    thumbnailPath: "/assets/creatures/sloth/thumb.png",
    animations: BASE_ANIMATIONS,
  },
  chipmunk: {
    id: "chipmunk",
    name: "Chipmunk",
    description: "Tiny and zippy. Always excited to see friends.",
    modelPath: "/assets/creatures/chipmunk/model.glb",
    thumbnailPath: "/assets/creatures/chipmunk/thumb.png",
    animations: BASE_ANIMATIONS,
  },
  possum: {
    id: "possum",
    name: "Possum",
    description: "Sneaky and sweet. Loves moonlit strolls.",
    modelPath: "/assets/creatures/possum/model.glb",
    thumbnailPath: "/assets/creatures/possum/thumb.png",
    animations: BASE_ANIMATIONS,
  },
  pangolin: {
    id: "pangolin",
    name: "Pangolin",
    description: "Armored but gentle. A true original.",
    modelPath: "/assets/creatures/pangolin/model.glb",
    thumbnailPath: "/assets/creatures/pangolin/thumb.png",
    animations: BASE_ANIMATIONS,
  },
} satisfies Record<string, CreatureDefinition>;

/** Union of valid creature type IDs. */
export type CreatureTypeId = keyof typeof CREATURES;

export const DEFAULT_CREATURE: CreatureTypeId = "otter";
