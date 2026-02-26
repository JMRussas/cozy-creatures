// Cozy Creatures - Validation & Rate Limiter Tests
//
// Depends on: socket/validation.ts, @cozy/shared (POSITION_MIN, POSITION_MAX)
// Used by:    test runner

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  isFiniteNumber,
  clamp,
  sanitizePosition,
  createRateLimiter,
} from "./validation.js";
import { POSITION_MIN, POSITION_MAX } from "@cozy/shared";

describe("isFiniteNumber", () => {
  it("returns true for regular numbers", () => {
    expect(isFiniteNumber(0)).toBe(true);
    expect(isFiniteNumber(42)).toBe(true);
    expect(isFiniteNumber(-100.5)).toBe(true);
  });

  it("returns false for NaN", () => {
    expect(isFiniteNumber(NaN)).toBe(false);
  });

  it("returns false for Infinity", () => {
    expect(isFiniteNumber(Infinity)).toBe(false);
    expect(isFiniteNumber(-Infinity)).toBe(false);
  });

  it("returns false for non-number types", () => {
    expect(isFiniteNumber("42")).toBe(false);
    expect(isFiniteNumber(null)).toBe(false);
    expect(isFiniteNumber(undefined)).toBe(false);
    expect(isFiniteNumber({})).toBe(false);
    expect(isFiniteNumber(true)).toBe(false);
  });
});

describe("clamp", () => {
  it("returns the value when within range", () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it("clamps to min", () => {
    expect(clamp(-5, 0, 10)).toBe(0);
  });

  it("clamps to max", () => {
    expect(clamp(15, 0, 10)).toBe(10);
  });

  it("handles values exactly at boundaries", () => {
    expect(clamp(0, 0, 10)).toBe(0);
    expect(clamp(10, 0, 10)).toBe(10);
  });
});

describe("sanitizePosition", () => {
  it("passes through valid positions", () => {
    const pos = sanitizePosition({ x: 10, y: 20, z: 30 });
    expect(pos).toEqual({ x: 10, y: 20, z: 30 });
  });

  it("clamps values exceeding POSITION_MAX", () => {
    const pos = sanitizePosition({ x: 9999, y: 0, z: 0 });
    expect(pos.x).toBe(POSITION_MAX);
  });

  it("clamps values below POSITION_MIN", () => {
    const pos = sanitizePosition({ x: -9999, y: 0, z: 0 });
    expect(pos.x).toBe(POSITION_MIN);
  });

  it("defaults non-finite values to 0", () => {
    const pos = sanitizePosition({ x: NaN, y: Infinity, z: -Infinity });
    expect(pos).toEqual({ x: 0, y: 0, z: 0 });
  });

  it("defaults non-number types to 0", () => {
    const pos = sanitizePosition({ x: null, y: undefined, z: "hello" });
    expect(pos).toEqual({ x: 0, y: 0, z: 0 });
  });

  it("returns origin for null input", () => {
    const pos = sanitizePosition(null);
    expect(pos).toEqual({ x: 0, y: 0, z: 0 });
  });

  it("returns origin for undefined input", () => {
    const pos = sanitizePosition(undefined);
    expect(pos).toEqual({ x: 0, y: 0, z: 0 });
  });

  it("returns origin for non-object input", () => {
    expect(sanitizePosition("hello")).toEqual({ x: 0, y: 0, z: 0 });
    expect(sanitizePosition(42)).toEqual({ x: 0, y: 0, z: 0 });
    expect(sanitizePosition(true)).toEqual({ x: 0, y: 0, z: 0 });
  });

  it("handles negative valid values", () => {
    const pos = sanitizePosition({ x: -100, y: -200, z: -300 });
    expect(pos).toEqual({ x: -100, y: -200, z: -300 });
  });

  it("clamps each axis independently", () => {
    const pos = sanitizePosition({ x: -9999, y: 0, z: 9999 });
    expect(pos).toEqual({ x: POSITION_MIN, y: 0, z: POSITION_MAX });
  });
});

describe("createRateLimiter", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows the first call", () => {
    const limiter = createRateLimiter(100);
    expect(limiter.isRateLimited("a")).toBe(false);
  });

  it("rate-limits calls within the interval", () => {
    const limiter = createRateLimiter(100);
    limiter.isRateLimited("a"); // first call — allowed
    expect(limiter.isRateLimited("a")).toBe(true); // too soon
  });

  it("allows calls after the interval has passed", () => {
    const limiter = createRateLimiter(100);
    limiter.isRateLimited("a");
    vi.advanceTimersByTime(100);
    expect(limiter.isRateLimited("a")).toBe(false);
  });

  it("tracks keys independently", () => {
    const limiter = createRateLimiter(100);
    limiter.isRateLimited("a");
    expect(limiter.isRateLimited("b")).toBe(false); // different key
    expect(limiter.isRateLimited("a")).toBe(true); // same key, too soon
  });

  it("clear removes tracking for a key", () => {
    const limiter = createRateLimiter(100);
    limiter.isRateLimited("a");
    limiter.clear("a");
    expect(limiter.isRateLimited("a")).toBe(false); // treated as first call
  });

  it("clear does not affect other keys", () => {
    const limiter = createRateLimiter(100);
    limiter.isRateLimited("a");
    limiter.isRateLimited("b");
    limiter.clear("a");
    expect(limiter.isRateLimited("b")).toBe(true); // b still limited
  });
});
