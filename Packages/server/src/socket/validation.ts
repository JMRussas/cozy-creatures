// Cozy Creatures - Input Validation & Rate Limiting
//
// Pure validation helpers and a rate limiter factory extracted
// from connectionHandler for testability.
//
// Depends on: @cozy/shared (Position, POSITION_MIN, POSITION_MAX)
// Used by:    socket/connectionHandler.ts

import type { Position } from "@cozy/shared";
import { POSITION_MIN, POSITION_MAX } from "@cozy/shared";

/** Type guard: returns true if v is a finite number (not NaN, not Infinity). */
export function isFiniteNumber(v: unknown): v is number {
  return typeof v === "number" && isFinite(v);
}

/** Clamp a value to [min, max]. */
export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

/** Strip ASCII control characters (0x00–0x1F, 0x7F) from a string. */
export function stripControlChars(s: string): string {
  // eslint-disable-next-line no-control-regex
  return s.replace(/[\x00-\x1F\x7F]/g, "");
}

/** Validate and clamp an untrusted position object. Non-finite values default to 0. */
export function sanitizePosition(raw: unknown): Position {
  if (raw == null || typeof raw !== "object") {
    return { x: 0, y: 0, z: 0 };
  }
  const obj = raw as { x: unknown; y: unknown; z: unknown };
  return {
    x: clamp(isFiniteNumber(obj.x) ? obj.x : 0, POSITION_MIN, POSITION_MAX),
    y: clamp(isFiniteNumber(obj.y) ? obj.y : 0, POSITION_MIN, POSITION_MAX),
    z: clamp(isFiniteNumber(obj.z) ? obj.z : 0, POSITION_MIN, POSITION_MAX),
  };
}

/** Creates a rate limiter that tracks per-key timestamps. */
export function createRateLimiter(intervalMs: number) {
  const timestamps = new Map<string, number>();

  return {
    /** Returns true if the key should be rate-limited (too recent). Updates timestamp if allowed. */
    isRateLimited(key: string): boolean {
      const now = Date.now();
      const last = timestamps.get(key) ?? 0;
      if (now - last < intervalMs) return true;
      timestamps.set(key, now);
      return false;
    },

    /** Remove tracking for a key (cleanup on disconnect). */
    clear(key: string): void {
      timestamps.delete(key);
    },

    /** Remove entries older than maxAgeMs. Call periodically to prevent unbounded growth. */
    sweep(maxAgeMs: number): void {
      const now = Date.now();
      for (const [key, ts] of timestamps) {
        if (now - ts > maxAgeMs) {
          timestamps.delete(key);
        }
      }
    },

    /** Number of tracked keys (for testing). */
    get size(): number {
      return timestamps.size;
    },
  };
}
