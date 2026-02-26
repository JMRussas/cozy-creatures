// Cozy Creatures - Client Config Tests
//
// Depends on: config.ts, @cozy/shared
// Used by:    test runner

import { describe, it, expect } from "vitest";
import { CREATURES } from "@cozy/shared";
import { CREATURE_COLORS } from "./config";

describe("CREATURE_COLORS", () => {
  it("has an entry for every creature type", () => {
    for (const id of Object.keys(CREATURES)) {
      expect(CREATURE_COLORS).toHaveProperty(id);
    }
  });

  it("body and ear colors are valid hex strings", () => {
    const hexPattern = /^#[0-9a-fA-F]{6}$/;
    for (const [id, colors] of Object.entries(CREATURE_COLORS)) {
      expect(colors.body, `${id} body`).toMatch(hexPattern);
      expect(colors.ear, `${id} ear`).toMatch(hexPattern);
    }
  });
});
