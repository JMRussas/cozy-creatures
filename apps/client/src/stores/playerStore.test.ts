// Cozy Creatures - Player Store Tests
//
// Depends on: stores/playerStore.ts
// Used by:    test runner

import { describe, it, expect, beforeEach } from "vitest";
import { usePlayerStore } from "./playerStore";

describe("playerStore", () => {
  beforeEach(() => {
    usePlayerStore.getState().reset();
  });

  it("starts at the origin", () => {
    const { position, target } = usePlayerStore.getState();
    expect(position).toEqual({ x: 0, y: 0, z: 0 });
    expect(target).toEqual({ x: 0, y: 0, z: 0 });
  });

  it("setTarget updates target and sets isMoving", () => {
    usePlayerStore.getState().setTarget(5, 3);
    const state = usePlayerStore.getState();
    expect(state.target).toEqual({ x: 5, y: 0, z: 3 });
    expect(state.isMoving).toBe(true);
  });

  it("setPosition updates position", () => {
    usePlayerStore.getState().setPosition({ x: 1, y: 2, z: 3 });
    expect(usePlayerStore.getState().position).toEqual({ x: 1, y: 2, z: 3 });
  });

  it("setIsMoving toggles the flag", () => {
    usePlayerStore.getState().setIsMoving(true);
    expect(usePlayerStore.getState().isMoving).toBe(true);
    usePlayerStore.getState().setIsMoving(false);
    expect(usePlayerStore.getState().isMoving).toBe(false);
  });

  it("reset returns to initial state", () => {
    usePlayerStore.getState().setTarget(5, 3);
    usePlayerStore.getState().setPosition({ x: 10, y: 0, z: 10 });
    usePlayerStore.getState().setName("TestPlayer");
    usePlayerStore.getState().setCreatureType("possum");
    usePlayerStore.getState().reset();
    const state = usePlayerStore.getState();
    expect(state.position).toEqual({ x: 0, y: 0, z: 0 });
    expect(state.target).toEqual({ x: 0, y: 0, z: 0 });
    expect(state.isMoving).toBe(false);
    expect(state.creatureType).toBe("otter");
    expect(state.name).toBe("");
  });

  it("setName updates name", () => {
    usePlayerStore.getState().setName("TestPlayer");
    expect(usePlayerStore.getState().name).toBe("TestPlayer");
  });

  it("setCreatureType updates creature type", () => {
    usePlayerStore.getState().setCreatureType("possum");
    expect(usePlayerStore.getState().creatureType).toBe("possum");
  });
});
