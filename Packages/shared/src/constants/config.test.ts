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
  DEFAULT_MAX_PLAYERS,
  MAX_CHAT_MESSAGE,
  CHAT_HISTORY_SIZE,
  CHAT_RATE_LIMIT_MS,
  CHAT_BUBBLE_DURATION_MS,
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

  it("DEFAULT_MAX_PLAYERS is a positive integer", () => {
    expect(DEFAULT_MAX_PLAYERS).toBe(20);
    expect(Number.isInteger(DEFAULT_MAX_PLAYERS)).toBe(true);
  });

  it("MAX_CHAT_MESSAGE is a positive integer", () => {
    expect(MAX_CHAT_MESSAGE).toBe(200);
    expect(Number.isInteger(MAX_CHAT_MESSAGE)).toBe(true);
  });

  it("CHAT_HISTORY_SIZE is a positive integer", () => {
    expect(CHAT_HISTORY_SIZE).toBe(50);
    expect(Number.isInteger(CHAT_HISTORY_SIZE)).toBe(true);
  });

  it("CHAT_RATE_LIMIT_MS is positive", () => {
    expect(CHAT_RATE_LIMIT_MS).toBe(500);
    expect(CHAT_RATE_LIMIT_MS).toBeGreaterThan(0);
  });

  it("CHAT_BUBBLE_DURATION_MS is positive", () => {
    expect(CHAT_BUBBLE_DURATION_MS).toBe(5000);
    expect(CHAT_BUBBLE_DURATION_MS).toBeGreaterThan(0);
  });
});
