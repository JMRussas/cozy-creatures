// Cozy Creatures - Room Constants Tests
//
// Depends on: constants/rooms.ts
// Used by:    test runner

import { describe, it, expect } from "vitest";
import { ROOMS, DEFAULT_ROOM } from "./rooms.js";
import { BASE_ANIMATIONS } from "./creatures.js";

describe("room constants", () => {
  it("DEFAULT_ROOM exists in the registry", () => {
    expect(ROOMS[DEFAULT_ROOM]).toBeDefined();
  });

  it("every room has required fields", () => {
    for (const [key, config] of Object.entries(ROOMS)) {
      expect(config.id).toBe(key);
      expect(config.name).toBeTruthy();
      expect(config.theme).toBeTruthy();
      expect(config.maxPlayers).toBeGreaterThan(0);
      expect(config.description).toBeTruthy();
    }
  });

  it("sit spot animations are valid creature animations", () => {
    for (const [, config] of Object.entries(ROOMS)) {
      for (const spot of config.environment.sitSpots) {
        if (spot.animation) {
          expect(BASE_ANIMATIONS).toContain(spot.animation);
        }
      }
    }
  });

  it("every room has obstacles array", () => {
    for (const [, config] of Object.entries(ROOMS)) {
      expect(Array.isArray(config.environment.obstacles)).toBe(true);
    }
  });

});
