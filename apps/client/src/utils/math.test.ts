// Cozy Creatures - Math Utilities Tests
//
// Depends on: utils/math.ts
// Used by:    test runner

import { describe, it, expect } from "vitest";
import { lerpAngle } from "./math";

describe("lerpAngle", () => {
  it("returns current angle at t=0", () => {
    expect(lerpAngle(1, 2, 0)).toBeCloseTo(1);
  });

  it("returns target angle at t=1", () => {
    expect(lerpAngle(1, 2, 1)).toBeCloseTo(2);
  });

  it("interpolates linearly for small angles", () => {
    expect(lerpAngle(0, 1, 0.5)).toBeCloseTo(0.5);
  });

  it("takes the short path across the PI boundary", () => {
    // Going from just below PI to just above -PI should go the short way
    const result = lerpAngle(Math.PI - 0.1, -Math.PI + 0.1, 0.5);
    // Short path is 0.2 radians across PI, so midpoint should be near PI
    expect(Math.abs(result)).toBeGreaterThan(Math.PI - 0.2);
  });

  it("returns current when angles are identical", () => {
    expect(lerpAngle(2.5, 2.5, 0.5)).toBeCloseTo(2.5);
  });
});
