// Cozy Creatures - Creature Constants Tests
//
// Depends on: constants/creatures.ts
// Used by:    test runner

import { describe, it, expect } from "vitest";
import { CREATURES, DEFAULT_CREATURE, BASE_ANIMATIONS } from "./creatures.js";

describe("creature constants", () => {
  it("DEFAULT_CREATURE exists in the registry", () => {
    expect(CREATURES[DEFAULT_CREATURE]).toBeDefined();
  });

  it("every creature has required fields", () => {
    for (const [key, def] of Object.entries(CREATURES)) {
      expect(def.id).toBe(key);
      expect(def.name).toBeTruthy();
      expect(def.modelPath).toBeTruthy();
      expect(def.thumbnailPath).toBeTruthy();
      expect(def.animations.length).toBeGreaterThan(0);
    }
  });

  it("every creature has a non-empty description", () => {
    for (const def of Object.values(CREATURES)) {
      expect(def.description, `${def.id} description`).toBeTruthy();
      expect(typeof def.description).toBe("string");
    }
  });

  it("every creature includes the base animations", () => {
    for (const def of Object.values(CREATURES)) {
      for (const anim of BASE_ANIMATIONS) {
        expect(def.animations).toContain(anim);
      }
    }
  });

});
