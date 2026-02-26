// Cozy Creatures - Particle Effect Tests
//
// Validates particle effect config coverage: every effect type used in
// legendary skins has a defined particle count.
//
// Depends on: effects/ParticleEffect, @cozy/shared
// Used by:    test runner

import { describe, it, expect } from "vitest";
import { PARTICLE_COUNTS } from "./ParticleEffect";
import { SKINS } from "@cozy/shared";
import type { SkinDefinition } from "@cozy/shared";

describe("PARTICLE_COUNTS", () => {
  it("has an entry for every particle effect type used in SKINS", () => {
    const usedTypes = new Set<string>();
    for (const skin of Object.values(SKINS) as SkinDefinition[]) {
      if (skin.particleEffect) {
        usedTypes.add(skin.particleEffect.type);
      }
    }

    for (const type of usedTypes) {
      expect(PARTICLE_COUNTS[type], `Missing particle count for "${type}"`).toBeDefined();
      expect(PARTICLE_COUNTS[type]).toBeGreaterThan(0);
    }
  });

  it("all particle counts are positive integers", () => {
    for (const [type, count] of Object.entries(PARTICLE_COUNTS)) {
      expect(Number.isInteger(count), `${type} count is not integer`).toBe(true);
      expect(count).toBeGreaterThan(0);
    }
  });
});
