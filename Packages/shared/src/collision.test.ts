// Cozy Creatures - Collision Detection Tests
//
// Depends on: collision.ts
// Used by:    test runner

import { describe, it, expect } from "vitest";
import {
  resolveCollisions,
  clampAndResolve,
  CREATURE_COLLISION_RADIUS,
} from "./collision.js";
import type { Obstacle, WalkableBounds } from "./types/room.js";

const R = CREATURE_COLLISION_RADIUS;

describe("resolveCollisions", () => {
  describe("circle obstacles", () => {
    const circle: Obstacle = { type: "circle", x: 0, z: 0, radius: 1 };

    it("returns original position when outside", () => {
      const result = resolveCollisions(5, 5, [circle], R);
      expect(result.x).toBe(5);
      expect(result.z).toBe(5);
    });

    it("pushes out when inside", () => {
      const result = resolveCollisions(0.5, 0, [circle], R);
      const totalRadius = 1 + R;
      expect(result.x).toBeGreaterThan(totalRadius - 0.1);
      expect(result.z).toBeCloseTo(0, 1);
    });

    it("pushes along correct direction", () => {
      // Inside, approaching from -X side
      const result = resolveCollisions(-0.5, 0, [circle], R);
      expect(result.x).toBeLessThan(-(1 + R - 0.1));
      expect(result.z).toBeCloseTo(0, 1);
    });

    it("handles dead center (pushes +X)", () => {
      const result = resolveCollisions(0, 0, [circle], R);
      expect(result.x).toBeGreaterThan(1 + R);
      expect(result.z).toBeCloseTo(0, 5);
    });

    it("no collision at exactly the boundary", () => {
      // Point at distance = radius + creatureRadius should NOT collide
      const dist = 1 + R;
      const result = resolveCollisions(dist, 0, [circle], R);
      expect(result.x).toBe(dist);
      expect(result.z).toBe(0);
    });
  });

  describe("AABB obstacles", () => {
    const box: Obstacle = { type: "aabb", minX: -1, maxX: 1, minZ: -1, maxZ: 1 };

    it("returns original position when outside", () => {
      const result = resolveCollisions(5, 5, [box], R);
      expect(result.x).toBe(5);
      expect(result.z).toBe(5);
    });

    it("pushes to nearest edge when inside", () => {
      // Slightly right of center — nearest edge is right (+X)
      const result = resolveCollisions(0.5, 0, [box], R);
      expect(result.x).toBeGreaterThan(1 + R);
      expect(result.z).toBe(0);
    });

    it("pushes to left edge", () => {
      const result = resolveCollisions(-0.5, 0, [box], R);
      expect(result.x).toBeLessThan(-(1 + R));
      expect(result.z).toBe(0);
    });

    it("pushes to top edge (minZ)", () => {
      const result = resolveCollisions(0, -0.5, [box], R);
      expect(result.x).toBe(0);
      expect(result.z).toBeLessThan(-(1 + R));
    });

    it("pushes to bottom edge (maxZ)", () => {
      const result = resolveCollisions(0, 0.5, [box], R);
      expect(result.x).toBe(0);
      expect(result.z).toBeGreaterThan(1 + R);
    });

    it("no collision when outside expanded bounds", () => {
      const result = resolveCollisions(1 + R + 0.1, 0, [box], R);
      expect(result.x).toBeCloseTo(1 + R + 0.1, 5);
      expect(result.z).toBe(0);
    });
  });

  describe("multiple obstacles", () => {
    it("resolves both when overlapping two obstacles", () => {
      const obstacles: Obstacle[] = [
        { type: "circle", x: 0, z: 0, radius: 1 },
        { type: "circle", x: 3, z: 0, radius: 1 },
      ];
      // Point between two circles — should be pushed out of whichever it's in
      const result = resolveCollisions(0.5, 0, obstacles, R);
      // Should be outside both circles
      const dist1 = Math.sqrt(result.x ** 2 + result.z ** 2);
      const dist2 = Math.sqrt((result.x - 3) ** 2 + result.z ** 2);
      expect(dist1).toBeGreaterThanOrEqual(1 + R - 0.02);
      expect(dist2).toBeGreaterThanOrEqual(1 + R - 0.02);
    });

    it("returns original when outside all obstacles", () => {
      const obstacles: Obstacle[] = [
        { type: "circle", x: -5, z: -5, radius: 0.5 },
        { type: "aabb", minX: 5, maxX: 6, minZ: 5, maxZ: 6 },
      ];
      const result = resolveCollisions(0, 0, obstacles, R);
      expect(result.x).toBe(0);
      expect(result.z).toBe(0);
    });
  });

  it("empty obstacles array returns original position", () => {
    const result = resolveCollisions(3, 4, [], R);
    expect(result.x).toBe(3);
    expect(result.z).toBe(4);
  });
});

describe("clampAndResolve", () => {
  const bounds: WalkableBounds = { minX: -10, maxX: 10, minZ: -10, maxZ: 10 };
  const obstacles: Obstacle[] = [
    { type: "circle", x: 0, z: 0, radius: 1 },
  ];

  it("clamps to bounds when no obstacle collision", () => {
    const result = clampAndResolve(15, 15, bounds, []);
    expect(result.x).toBe(10);
    expect(result.z).toBe(10);
  });

  it("resolves obstacle after bounds clamp", () => {
    const result = clampAndResolve(0.5, 0, bounds, obstacles);
    expect(result.x).toBeGreaterThan(1 + R - 0.1);
  });

  it("re-clamps to bounds if obstacle pushes outside", () => {
    // Obstacle near the bounds edge
    const edgeObs: Obstacle[] = [
      { type: "circle", x: 9.5, z: 0, radius: 1 },
    ];
    const result = clampAndResolve(9.5, 0, bounds, edgeObs);
    expect(result.x).toBeLessThanOrEqual(10);
  });

  it("handles no obstacles", () => {
    const result = clampAndResolve(5, 5, bounds, []);
    expect(result.x).toBe(5);
    expect(result.z).toBe(5);
  });
});
