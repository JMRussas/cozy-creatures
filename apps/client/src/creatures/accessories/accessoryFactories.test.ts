// Cozy Creatures - Accessory Factories Tests
//
// Validates that all accessory types used in skin definitions have factories
// and that each factory produces a valid Object3D.
//
// Depends on: accessories/accessoryFactories, @cozy/shared
// Used by:    test runner

import { describe, it, expect } from "vitest";
import { createAccessory } from "./accessoryFactories";
import { SKINS } from "@cozy/shared";
import type { AccessoryType } from "@cozy/shared";

/** All 10 defined accessory types. */
const ALL_TYPES: AccessoryType[] = [
  "top-hat", "beret", "crown", "scarf", "flower-crown",
  "backpack", "cape", "nightcap", "tiny-shield", "rose",
];

describe("createAccessory", () => {
  it("returns an object for every accessory type used in SKINS", () => {
    const usedTypes = new Set<AccessoryType>();
    for (const skin of Object.values(SKINS)) {
      for (const acc of skin.accessories) {
        usedTypes.add(acc.type);
      }
    }

    for (const type of usedTypes) {
      const obj = createAccessory(type);
      expect(obj, `createAccessory("${type}") returned null`).not.toBeNull();
    }
  });

  it("each factory returns an object", () => {
    for (const type of ALL_TYPES) {
      const obj = createAccessory(type);
      expect(obj, `createAccessory("${type}") returned null`).not.toBeNull();
    }
  });

  it("returns distinct clones (not same reference)", () => {
    const a = createAccessory("crown");
    const b = createAccessory("crown");
    expect(a).not.toBe(b);
  });
});
