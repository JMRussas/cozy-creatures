// Cozy Creatures - Skin Types
//
// Type definitions for the skin & collection system. Skins modify creature
// appearance via HSL color shifts, bone-attached accessories, and particle
// effects for legendary rarity.
//
// Depends on: constants/creatures.ts (CreatureTypeId)
// Used by:    constants/skins.ts, client skin rendering, server inventory API

import type { CreatureTypeId } from "../constants/creatures.js";

/** Rarity tiers for skins (ascending value). */
export type SkinRarity = "common" | "rare" | "epic" | "legendary";

/** Valid accessory type keys (must match client-side factory map). */
export type AccessoryType =
  | "top-hat"
  | "beret"
  | "crown"
  | "scarf"
  | "flower-crown"
  | "backpack"
  | "cape"
  | "nightcap"
  | "tiny-shield"
  | "rose";

/** HSL color shift parameters applied to the creature's base texture. */
export interface SkinColorShift {
  /** Hue rotation in degrees (-180 to 180). */
  hueShift: number;
  /** Saturation multiplier (0.0 to 2.0, 1.0 = no change). */
  saturationScale: number;
  /** Lightness additive offset (-0.5 to 0.5, 0.0 = no change). */
  lightnessOffset: number;
}

/** An accessory mesh attached to a creature bone. */
export interface SkinAccessory {
  /** Accessory type key (maps to a factory function on the client). */
  type: AccessoryType;
  /** Bone name pattern to search for (case-insensitive substring match). */
  attachBone: string;
  /** Position offset from the bone origin [x, y, z]. */
  offset?: [number, number, number];
  /** Euler rotation offset [x, y, z] in radians. */
  rotation?: [number, number, number];
  /** Scale override [x, y, z]. */
  scale?: [number, number, number];
}

/** Particle effect config for legendary skins. */
export interface SkinParticleEffect {
  /** Effect behavior type. */
  type: "sparkle" | "glow" | "flame" | "hearts";
  /** Effect color (hex string). */
  color: string;
  /** Effect intensity (0.0 to 1.0). */
  intensity: number;
}

/** Full skin definition — determines how a creature's appearance is modified. */
export interface SkinDefinition {
  id: string;
  name: string;
  description: string;
  /** Which creature type this skin applies to. */
  creatureType: CreatureTypeId;
  rarity: SkinRarity;
  /** Which themed set this skin belongs to. */
  setId: string;
  /** HSL color shift applied to the creature's materials. */
  colorShift: SkinColorShift;
  /** Accessories attached to creature bones. Empty array for no accessories. */
  accessories: SkinAccessory[];
  /** Particle effect (legendary skins only). */
  particleEffect?: SkinParticleEffect;
}

/** Themed skin collection. */
export interface SkinSet {
  id: string;
  name: string;
  description: string;
}

/** A skin owned by a player. */
export interface InventoryItem {
  skinId: string;
  acquiredAt: number;
}

/** Rarity display metadata for UI rendering. */
export interface RarityInfo {
  label: string;
  /** Border/badge color (hex). */
  color: string;
  /** Shimmer/glow color for animated effects (hex). */
  glowColor: string;
  /** Sort priority (0 = common, 3 = legendary). */
  order: number;
}
