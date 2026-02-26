// Cozy Creatures - Voice Handler Tests
//
// Tests for the voice state handler: cleanupVoice, isValidVoiceState.
//
// Depends on: socket/voiceHandler.ts
// Used by:    test runner

import { describe, it, expect } from "vitest";
import { cleanupVoice, isValidVoiceState } from "./voiceHandler.js";

describe("voiceHandler", () => {
  describe("cleanupVoice", () => {
    it("does not throw when called with an unknown socket id", () => {
      expect(() => cleanupVoice("nonexistent-socket")).not.toThrow();
    });

    it("can be called multiple times for the same id", () => {
      cleanupVoice("socket-1");
      cleanupVoice("socket-1");
      // No error = pass
    });
  });

  describe("isValidVoiceState", () => {
    it("accepts valid voice state (all false)", () => {
      expect(
        isValidVoiceState({ muted: false, deafened: false, speaking: false }),
      ).toBe(true);
    });

    it("accepts valid voice state (all true)", () => {
      expect(
        isValidVoiceState({ muted: true, deafened: true, speaking: true }),
      ).toBe(true);
    });

    it("accepts objects with extra properties", () => {
      expect(
        isValidVoiceState({
          muted: true,
          deafened: false,
          speaking: false,
          extra: "ignored",
        }),
      ).toBe(true);
    });

    it("rejects null", () => {
      expect(isValidVoiceState(null)).toBe(false);
    });

    it("rejects undefined", () => {
      expect(isValidVoiceState(undefined)).toBe(false);
    });

    it("rejects non-object (string)", () => {
      expect(isValidVoiceState("not an object")).toBe(false);
    });

    it("rejects non-object (number)", () => {
      expect(isValidVoiceState(42)).toBe(false);
    });

    it("rejects empty object", () => {
      expect(isValidVoiceState({})).toBe(false);
    });

    it("rejects wrong field types", () => {
      expect(
        isValidVoiceState({ muted: "true", deafened: 0, speaking: null }),
      ).toBe(false);
    });

    it("rejects partial fields (missing speaking)", () => {
      expect(isValidVoiceState({ muted: true, deafened: false })).toBe(false);
    });
  });
});
