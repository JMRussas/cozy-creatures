// Cozy Creatures - Skin Constants Tests
//
// Validates skin data integrity: valid creature/set references, rarity bounds,
// color shift ranges, and correct rarity distribution.
//
// Depends on: constants/skins.ts, constants/creatures.ts
// Used by:    test runner

import { describe, it, expect } from "vitest";
import { SKINS, SKIN_SETS, RARITIES, DEFAULT_SKIN_IDS } from "./skins.js";
import { CREATURES } from "./creatures.js";
import type { SkinRarity } from "../types/skin.js";

const allSkins = Object.values(SKINS);
const validRarities: SkinRarity[] = ["common", "rare", "epic", "legendary"];

describe("SKINS registry", () => {
  it("has at least 25 skins", () => {
    expect(allSkins.length).toBeGreaterThanOrEqual(25);
  });

  it("every skin id matches its key", () => {
    for (const [key, skin] of Object.entries(SKINS)) {
      expect(skin.id).toBe(key);
    }
  });

  it("every skin references a valid creature type", () => {
    for (const skin of allSkins) {
      expect(skin.creatureType in CREATURES).toBe(true);
    }
  });

  it("every skin references a valid skin set", () => {
    for (const skin of allSkins) {
      expect(skin.setId in SKIN_SETS).toBe(true);
    }
  });

  it("every skin has a valid rarity", () => {
    for (const skin of allSkins) {
      expect(validRarities).toContain(skin.rarity);
    }
  });

  it("hueShift is within -180..180", () => {
    for (const skin of allSkins) {
      expect(skin.colorShift.hueShift).toBeGreaterThanOrEqual(-180);
      expect(skin.colorShift.hueShift).toBeLessThanOrEqual(180);
    }
  });

  it("saturationScale is within 0..2", () => {
    for (const skin of allSkins) {
      expect(skin.colorShift.saturationScale).toBeGreaterThanOrEqual(0);
      expect(skin.colorShift.saturationScale).toBeLessThanOrEqual(2);
    }
  });

  it("lightnessOffset is within -0.5..0.5", () => {
    for (const skin of allSkins) {
      expect(skin.colorShift.lightnessOffset).toBeGreaterThanOrEqual(-0.5);
      expect(skin.colorShift.lightnessOffset).toBeLessThanOrEqual(0.5);
    }
  });

  it("only legendary skins have particleEffect", () => {
    for (const skin of allSkins) {
      if (skin.rarity !== "legendary") {
        expect(skin.particleEffect).toBeUndefined();
      }
    }
  });

  it("every legendary skin has a particleEffect", () => {
    for (const skin of allSkins) {
      if (skin.rarity === "legendary") {
        expect(skin.particleEffect).toBeDefined();
      }
    }
  });

  it("each creature has at least 4 skins", () => {
    for (const creatureId of Object.keys(CREATURES)) {
      const count = allSkins.filter((s) => s.creatureType === creatureId).length;
      expect(count).toBeGreaterThanOrEqual(4);
    }
  });

  it("each creature has at least 2 common skins", () => {
    for (const creatureId of Object.keys(CREATURES)) {
      const count = allSkins.filter(
        (s) => s.creatureType === creatureId && s.rarity === "common",
      ).length;
      expect(count).toBeGreaterThanOrEqual(2);
    }
  });

  it("accessories array is always present (even if empty)", () => {
    for (const skin of allSkins) {
      expect(Array.isArray(skin.accessories)).toBe(true);
    }
  });
});

describe("SKIN_SETS", () => {
  it("every set id matches its key", () => {
    for (const [key, set] of Object.entries(SKIN_SETS)) {
      expect(set.id).toBe(key);
    }
  });

  it("has at least 3 sets", () => {
    expect(Object.keys(SKIN_SETS).length).toBeGreaterThanOrEqual(3);
  });
});

describe("RARITIES", () => {
  it("has entries for all four rarity tiers", () => {
    for (const rarity of validRarities) {
      expect(rarity in RARITIES).toBe(true);
    }
  });

  it("orders are ascending (common < rare < epic < legendary)", () => {
    expect(RARITIES.common.order).toBeLessThan(RARITIES.rare.order);
    expect(RARITIES.rare.order).toBeLessThan(RARITIES.epic.order);
    expect(RARITIES.epic.order).toBeLessThan(RARITIES.legendary.order);
  });
});

describe("DEFAULT_SKIN_IDS", () => {
  it("contains only common skins", () => {
    for (const id of DEFAULT_SKIN_IDS) {
      const skin = SKINS[id];
      expect(skin.rarity).toBe("common");
    }
  });

  it("contains at least one skin per creature", () => {
    for (const creatureId of Object.keys(CREATURES)) {
      const hasDefault = DEFAULT_SKIN_IDS.some(
        (id) => SKINS[id].creatureType === creatureId,
      );
      expect(hasDefault).toBe(true);
    }
  });
});
