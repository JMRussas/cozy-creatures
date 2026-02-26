// Cozy Creatures - Shared Config Constants Tests
//
// Depends on: constants/config.ts
// Used by:    test runner

import { describe, it, expect } from "vitest";
import {
  MAX_PLAYER_NAME,
  POSITION_UPDATE_THROTTLE_MS,
  POSITION_MIN,
  POSITION_MAX,
} from "./config.js";

describe("shared config constants", () => {
  it("MAX_PLAYER_NAME is a positive integer", () => {
    expect(MAX_PLAYER_NAME).toBe(20);
    expect(Number.isInteger(MAX_PLAYER_NAME)).toBe(true);
  });

  it("POSITION_UPDATE_THROTTLE_MS is positive", () => {
    expect(POSITION_UPDATE_THROTTLE_MS).toBe(100);
    expect(POSITION_UPDATE_THROTTLE_MS).toBeGreaterThan(0);
  });

  it("POSITION_MIN < POSITION_MAX", () => {
    expect(POSITION_MIN).toBeLessThan(POSITION_MAX);
  });

  it("position bounds are symmetric around zero", () => {
    expect(POSITION_MIN).toBe(-POSITION_MAX);
  });
});
