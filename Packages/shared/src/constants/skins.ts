// Cozy Creatures - Skin Constants
//
// Registry of all skins, skin sets, and rarity metadata. Each creature has
// 5 skins: 2 Common, 1 Rare, 1 Epic, 1 Legendary. Skins are grouped into
// themed sets and use HSL color shifts + accessories + particle effects.
//
// Depends on: types/skin.ts, constants/creatures.ts
// Used by:    client skin rendering, server inventory, UI

import type {
  SkinDefinition,
  SkinSet,
  SkinRarity,
  RarityInfo,
} from "../types/skin.js";

// ---------------------------------------------------------------------------
// Skin Sets
// ---------------------------------------------------------------------------

export const SKIN_SETS = {
  "cozy-cafe": {
    id: "cozy-cafe",
    name: "Cozy Cafe",
    description: "Warm drinks and comfy vibes.",
  },
  "starlight": {
    id: "starlight",
    name: "Starlight",
    description: "Celestial shimmer and night sky magic.",
  },
  "garden-party": {
    id: "garden-party",
    name: "Garden Party",
    description: "Blooming flowers and sunny afternoons.",
  },
  "frost-festival": {
    id: "frost-festival",
    name: "Frost Festival",
    description: "Sparkling ice and winter wonderland.",
  },
} satisfies Record<string, SkinSet>;

export type SkinSetId = keyof typeof SKIN_SETS;

// ---------------------------------------------------------------------------
// Rarity Metadata
// ---------------------------------------------------------------------------

export const RARITIES: Record<SkinRarity, RarityInfo> = {
  common:    { label: "Common",    color: "#9CA3AF", glowColor: "#9CA3AF", order: 0 },
  rare:      { label: "Rare",      color: "#3B82F6", glowColor: "#60A5FA", order: 1 },
  epic:      { label: "Epic",      color: "#A855F7", glowColor: "#C084FC", order: 2 },
  legendary: { label: "Legendary", color: "#F59E0B", glowColor: "#FCD34D", order: 3 },
};

// ---------------------------------------------------------------------------
// Skins Registry — 30 skins (5 per creature: 2C + 1R + 1E + 1L)
// ---------------------------------------------------------------------------

export const SKINS = {
  // =========================================================================
  // OTTER
  // =========================================================================
  "otter-cocoa": {
    id: "otter-cocoa",
    name: "Cocoa Otter",
    description: "Warm chocolate tones, cozy as a latte.",
    creatureType: "otter",
    rarity: "common",
    setId: "cozy-cafe",
    colorShift: { hueShift: 15, saturationScale: 0.9, lightnessOffset: -0.05 },
    accessories: [],
  },
  "otter-mint": {
    id: "otter-mint",
    name: "Mint Otter",
    description: "Cool and refreshing, like a spring breeze.",
    creatureType: "otter",
    rarity: "common",
    setId: "garden-party",
    colorShift: { hueShift: 120, saturationScale: 0.7, lightnessOffset: 0.1 },
    accessories: [],
  },
  "otter-barista": {
    id: "otter-barista",
    name: "Barista Otter",
    description: "Serves the best espresso in town.",
    creatureType: "otter",
    rarity: "rare",
    setId: "cozy-cafe",
    colorShift: { hueShift: -10, saturationScale: 1.1, lightnessOffset: -0.1 },
    accessories: [
      { type: "beret", attachBone: "Head", offset: [0, 0.15, 0], rotation: [0, 0, -0.2] },
    ],
  },
  "otter-blossom": {
    id: "otter-blossom",
    name: "Blossom Otter",
    description: "Adorned with flowers from the enchanted garden.",
    creatureType: "otter",
    rarity: "epic",
    setId: "garden-party",
    colorShift: { hueShift: -30, saturationScale: 1.3, lightnessOffset: 0.05 },
    accessories: [
      { type: "flower-crown", attachBone: "Head", offset: [0, 0.12, 0] },
      { type: "scarf", attachBone: "Neck", offset: [0, -0.05, 0] },
    ],
  },
  "otter-aurora": {
    id: "otter-aurora",
    name: "Aurora Otter",
    description: "Radiates with the magic of the northern lights.",
    creatureType: "otter",
    rarity: "legendary",
    setId: "starlight",
    colorShift: { hueShift: 180, saturationScale: 1.4, lightnessOffset: 0.15 },
    accessories: [
      { type: "crown", attachBone: "Head", offset: [0, 0.18, 0] },
      { type: "cape", attachBone: "Spine", offset: [0, 0, -0.1] },
    ],
    particleEffect: { type: "sparkle", color: "#A855F7", intensity: 0.8 },
  },

  // =========================================================================
  // RED PANDA
  // =========================================================================
  "red-panda-cherry": {
    id: "red-panda-cherry",
    name: "Cherry Red Panda",
    description: "Deeper reds, like ripe autumn cherries.",
    creatureType: "red-panda",
    rarity: "common",
    setId: "cozy-cafe",
    colorShift: { hueShift: -15, saturationScale: 1.2, lightnessOffset: -0.05 },
    accessories: [],
  },
  "red-panda-snowdrift": {
    id: "red-panda-snowdrift",
    name: "Snowdrift Red Panda",
    description: "Dusted with fresh powder from the mountaintops.",
    creatureType: "red-panda",
    rarity: "common",
    setId: "frost-festival",
    colorShift: { hueShift: 30, saturationScale: 0.4, lightnessOffset: 0.2 },
    accessories: [],
  },
  "red-panda-kimono": {
    id: "red-panda-kimono",
    name: "Kimono Red Panda",
    description: "Dressed for a festival under the cherry blossoms.",
    creatureType: "red-panda",
    rarity: "rare",
    setId: "garden-party",
    colorShift: { hueShift: -25, saturationScale: 1.0, lightnessOffset: 0.0 },
    accessories: [
      { type: "scarf", attachBone: "Neck", offset: [0, -0.03, 0] },
    ],
  },
  "red-panda-ember": {
    id: "red-panda-ember",
    name: "Ember Red Panda",
    description: "Flickering warmth from a crackling fireplace.",
    creatureType: "red-panda",
    rarity: "epic",
    setId: "cozy-cafe",
    colorShift: { hueShift: -40, saturationScale: 1.5, lightnessOffset: -0.05 },
    accessories: [
      { type: "beret", attachBone: "Head", offset: [0, 0.14, 0], rotation: [0, 0, -0.15] },
      { type: "backpack", attachBone: "Spine", offset: [0, 0.05, -0.08] },
    ],
  },
  "red-panda-celestial": {
    id: "red-panda-celestial",
    name: "Celestial Red Panda",
    description: "Woven from starlight and moonbeams.",
    creatureType: "red-panda",
    rarity: "legendary",
    setId: "starlight",
    colorShift: { hueShift: 160, saturationScale: 1.3, lightnessOffset: 0.1 },
    accessories: [
      { type: "crown", attachBone: "Head", offset: [0, 0.16, 0] },
      { type: "cape", attachBone: "Spine", offset: [0, 0, -0.1] },
    ],
    particleEffect: { type: "glow", color: "#60A5FA", intensity: 0.7 },
  },

  // =========================================================================
  // SLOTH
  // =========================================================================
  "sloth-mossy": {
    id: "sloth-mossy",
    name: "Mossy Sloth",
    description: "So still that moss has started to grow.",
    creatureType: "sloth",
    rarity: "common",
    setId: "garden-party",
    colorShift: { hueShift: 40, saturationScale: 1.1, lightnessOffset: 0.0 },
    accessories: [],
  },
  "sloth-lavender": {
    id: "sloth-lavender",
    name: "Lavender Sloth",
    description: "Smells faintly of calming lavender fields.",
    creatureType: "sloth",
    rarity: "common",
    setId: "garden-party",
    colorShift: { hueShift: -80, saturationScale: 0.8, lightnessOffset: 0.1 },
    accessories: [],
  },
  "sloth-dreamer": {
    id: "sloth-dreamer",
    name: "Dreamer Sloth",
    description: "Always half-asleep, dreaming of clouds.",
    creatureType: "sloth",
    rarity: "rare",
    setId: "starlight",
    colorShift: { hueShift: -60, saturationScale: 0.6, lightnessOffset: 0.05 },
    accessories: [
      { type: "nightcap", attachBone: "Head", offset: [0, 0.12, 0] },
    ],
  },
  "sloth-enchanted": {
    id: "sloth-enchanted",
    name: "Enchanted Sloth",
    description: "Touched by forest magic, growing tiny mushrooms.",
    creatureType: "sloth",
    rarity: "epic",
    setId: "garden-party",
    colorShift: { hueShift: 70, saturationScale: 1.4, lightnessOffset: 0.05 },
    accessories: [
      { type: "flower-crown", attachBone: "Head", offset: [0, 0.11, 0] },
      { type: "scarf", attachBone: "Neck", offset: [0, -0.04, 0] },
    ],
  },
  "sloth-cosmic": {
    id: "sloth-cosmic",
    name: "Cosmic Sloth",
    description: "Drifting through the universe at its own pace.",
    creatureType: "sloth",
    rarity: "legendary",
    setId: "starlight",
    colorShift: { hueShift: -120, saturationScale: 1.5, lightnessOffset: 0.15 },
    accessories: [
      { type: "crown", attachBone: "Head", offset: [0, 0.15, 0] },
    ],
    particleEffect: { type: "sparkle", color: "#C084FC", intensity: 0.9 },
  },

  // =========================================================================
  // CHIPMUNK
  // =========================================================================
  "chipmunk-acorn": {
    id: "chipmunk-acorn",
    name: "Acorn Chipmunk",
    description: "Golden like a perfect autumn acorn.",
    creatureType: "chipmunk",
    rarity: "common",
    setId: "cozy-cafe",
    colorShift: { hueShift: -10, saturationScale: 1.2, lightnessOffset: 0.05 },
    accessories: [],
  },
  "chipmunk-bluebell": {
    id: "chipmunk-bluebell",
    name: "Bluebell Chipmunk",
    description: "Tinted like wildflowers in a meadow.",
    creatureType: "chipmunk",
    rarity: "common",
    setId: "garden-party",
    colorShift: { hueShift: 150, saturationScale: 0.7, lightnessOffset: 0.1 },
    accessories: [],
  },
  "chipmunk-scout": {
    id: "chipmunk-scout",
    name: "Scout Chipmunk",
    description: "Always prepared for adventure.",
    creatureType: "chipmunk",
    rarity: "rare",
    setId: "garden-party",
    colorShift: { hueShift: 20, saturationScale: 1.0, lightnessOffset: -0.05 },
    accessories: [
      { type: "backpack", attachBone: "Spine", offset: [0, 0.05, -0.08] },
    ],
  },
  "chipmunk-jeweled": {
    id: "chipmunk-jeweled",
    name: "Jeweled Chipmunk",
    description: "Sparkling with tiny gemstones.",
    creatureType: "chipmunk",
    rarity: "epic",
    setId: "frost-festival",
    colorShift: { hueShift: -60, saturationScale: 1.4, lightnessOffset: 0.1 },
    accessories: [
      { type: "crown", attachBone: "Head", offset: [0, 0.1, 0], scale: [0.7, 0.7, 0.7] },
      { type: "scarf", attachBone: "Neck", offset: [0, -0.03, 0] },
    ],
  },
  "chipmunk-stardust": {
    id: "chipmunk-stardust",
    name: "Stardust Chipmunk",
    description: "Leaves a trail of glittering stardust.",
    creatureType: "chipmunk",
    rarity: "legendary",
    setId: "starlight",
    colorShift: { hueShift: -140, saturationScale: 1.3, lightnessOffset: 0.2 },
    accessories: [
      { type: "crown", attachBone: "Head", offset: [0, 0.12, 0], scale: [0.8, 0.8, 0.8] },
      { type: "cape", attachBone: "Spine", offset: [0, 0, -0.08], scale: [0.8, 0.8, 0.8] },
    ],
    particleEffect: { type: "sparkle", color: "#FCD34D", intensity: 0.8 },
  },

  // =========================================================================
  // POSSUM
  // =========================================================================
  "possum-moonbeam": {
    id: "possum-moonbeam",
    name: "Moonbeam Possum",
    description: "Pale and luminous under the full moon.",
    creatureType: "possum",
    rarity: "common",
    setId: "starlight",
    colorShift: { hueShift: -20, saturationScale: 0.5, lightnessOffset: 0.15 },
    accessories: [],
  },
  "possum-thistle": {
    id: "possum-thistle",
    name: "Thistle Possum",
    description: "Prickly on the outside, sweet on the inside.",
    creatureType: "possum",
    rarity: "common",
    setId: "garden-party",
    colorShift: { hueShift: -70, saturationScale: 0.9, lightnessOffset: 0.05 },
    accessories: [],
  },
  "possum-midnight": {
    id: "possum-midnight",
    name: "Midnight Possum",
    description: "Elegant and mysterious, a creature of the night.",
    creatureType: "possum",
    rarity: "rare",
    setId: "starlight",
    colorShift: { hueShift: -30, saturationScale: 0.8, lightnessOffset: -0.15 },
    accessories: [
      { type: "top-hat", attachBone: "Head", offset: [0, 0.14, 0] },
    ],
  },
  "possum-shadow-bloom": {
    id: "possum-shadow-bloom",
    name: "Shadow Bloom Possum",
    description: "Dark petals bloom in the moonlight.",
    creatureType: "possum",
    rarity: "epic",
    setId: "garden-party",
    colorShift: { hueShift: -50, saturationScale: 1.3, lightnessOffset: -0.05 },
    accessories: [
      { type: "flower-crown", attachBone: "Head", offset: [0, 0.13, 0] },
      { type: "scarf", attachBone: "Neck", offset: [0, -0.04, 0] },
    ],
  },
  "possum-phantom": {
    id: "possum-phantom",
    name: "Phantom Possum",
    description: "Neither here nor there, shimmering between worlds.",
    creatureType: "possum",
    rarity: "legendary",
    setId: "frost-festival",
    colorShift: { hueShift: 100, saturationScale: 0.6, lightnessOffset: 0.25 },
    accessories: [
      { type: "crown", attachBone: "Head", offset: [0, 0.16, 0] },
      { type: "cape", attachBone: "Spine", offset: [0, 0, -0.1] },
    ],
    particleEffect: { type: "glow", color: "#E2E8F0", intensity: 0.9 },
  },

  // =========================================================================
  // PANGOLIN
  // =========================================================================
  "pangolin-copper": {
    id: "pangolin-copper",
    name: "Copper Pangolin",
    description: "Warm metallic sheen like polished copper.",
    creatureType: "pangolin",
    rarity: "common",
    setId: "cozy-cafe",
    colorShift: { hueShift: -20, saturationScale: 1.3, lightnessOffset: -0.05 },
    accessories: [],
  },
  "pangolin-ocean": {
    id: "pangolin-ocean",
    name: "Ocean Pangolin",
    description: "Deep sea blues from the coral reefs.",
    creatureType: "pangolin",
    rarity: "common",
    setId: "frost-festival",
    colorShift: { hueShift: 140, saturationScale: 0.9, lightnessOffset: 0.1 },
    accessories: [],
  },
  "pangolin-knight": {
    id: "pangolin-knight",
    name: "Knight Pangolin",
    description: "Armored and ready for a noble quest.",
    creatureType: "pangolin",
    rarity: "rare",
    setId: "frost-festival",
    colorShift: { hueShift: 10, saturationScale: 0.6, lightnessOffset: -0.1 },
    accessories: [
      { type: "tiny-shield", attachBone: "Spine", offset: [0.1, 0.05, -0.06], rotation: [0, 0.3, 0] },
    ],
  },
  "pangolin-crystal": {
    id: "pangolin-crystal",
    name: "Crystal Pangolin",
    description: "Scales sparkle like faceted gemstones.",
    creatureType: "pangolin",
    rarity: "epic",
    setId: "frost-festival",
    colorShift: { hueShift: -100, saturationScale: 1.5, lightnessOffset: 0.15 },
    accessories: [
      { type: "crown", attachBone: "Head", offset: [0, 0.13, 0], scale: [0.9, 0.9, 0.9] },
      { type: "scarf", attachBone: "Neck", offset: [0, -0.04, 0] },
    ],
  },
  "pangolin-dragon": {
    id: "pangolin-dragon",
    name: "Dragon Pangolin",
    description: "Awakened ancient power, wreathed in flame.",
    creatureType: "pangolin",
    rarity: "legendary",
    setId: "starlight",
    colorShift: { hueShift: -40, saturationScale: 1.6, lightnessOffset: -0.05 },
    accessories: [
      { type: "crown", attachBone: "Head", offset: [0, 0.15, 0] },
      { type: "cape", attachBone: "Spine", offset: [0, 0, -0.1] },
    ],
    particleEffect: { type: "flame", color: "#F97316", intensity: 0.9 },
  },
} satisfies Record<string, SkinDefinition>;

/** Union of valid skin IDs. */
export type SkinId = keyof typeof SKINS;

/** All Common skin IDs — auto-granted to new players for their creature. */
export const DEFAULT_SKIN_IDS: SkinId[] = Object.values(SKINS)
  .filter((s) => s.rarity === "common")
  .map((s) => s.id) as SkinId[];
