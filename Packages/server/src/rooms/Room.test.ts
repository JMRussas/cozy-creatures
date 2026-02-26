// Cozy Creatures - Room Tests
//
// Depends on: rooms/Room.ts, @cozy/shared (Player, RoomConfig)
// Used by:    test runner

import { describe, it, expect } from "vitest";
import { Room } from "./Room.js";
import type { Player, RoomConfig } from "@cozy/shared";

function makeRoom(overrides?: Partial<RoomConfig>): Room {
  return new Room({
    id: "test-room",
    name: "Test Room",
    theme: "test",
    maxPlayers: 20,
    description: "A test room",
    ...overrides,
  });
}

function makePlayer(id: string, name = "Player"): Player {
  return {
    id,
    name,
    creatureType: "cat",
    position: { x: 0, y: 0, z: 0 },
    roomId: "cozy-cafe",
  };
}

describe("Room", () => {
  describe("constructor", () => {
    it("initializes from config", () => {
      const room = makeRoom();
      expect(room.id).toBe("test-room");
      expect(room.name).toBe("Test Room");
      expect(room.theme).toBe("test");
      expect(room.maxPlayers).toBe(20);
    });
  });

  describe("addPlayer / getPlayer", () => {
    it("adds a player and retrieves them", () => {
      const room = makeRoom();
      const player = makePlayer("p1");
      expect(room.addPlayer(player)).toBe(true);
      expect(room.getPlayer("p1")).toBe(player);
    });

    it("returns false for duplicate player ID", () => {
      const room = makeRoom();
      const player = makePlayer("p1");
      expect(room.addPlayer(player)).toBe(true);
      expect(room.addPlayer(makePlayer("p1", "Duplicate"))).toBe(false);
    });

    it("does not overwrite existing player on duplicate ID", () => {
      const room = makeRoom();
      room.addPlayer(makePlayer("p1", "Original"));
      room.addPlayer(makePlayer("p1", "Duplicate"));
      expect(room.getPlayer("p1")!.name).toBe("Original");
    });

    it("returns false when room is full", () => {
      const room = makeRoom({ maxPlayers: 1 });
      room.addPlayer(makePlayer("p1"));
      expect(room.addPlayer(makePlayer("p2"))).toBe(false);
    });

    it("does not add the player when room is full", () => {
      const room = makeRoom({ maxPlayers: 1 });
      room.addPlayer(makePlayer("p1"));
      room.addPlayer(makePlayer("p2"));
      expect(room.getPlayer("p2")).toBeUndefined();
    });
  });

  describe("removePlayer", () => {
    it("removes an existing player", () => {
      const room = makeRoom();
      room.addPlayer(makePlayer("p1"));
      expect(room.removePlayer("p1")).toBe(true);
      expect(room.getPlayer("p1")).toBeUndefined();
    });

    it("returns false for non-existent player", () => {
      const room = makeRoom();
      expect(room.removePlayer("nope")).toBe(false);
    });

    it("frees a slot after removal", () => {
      const room = makeRoom({ maxPlayers: 1 });
      room.addPlayer(makePlayer("p1"));
      room.removePlayer("p1");
      expect(room.addPlayer(makePlayer("p2"))).toBe(true);
    });
  });

  describe("updatePlayerPosition", () => {
    it("updates the player position", () => {
      const room = makeRoom();
      room.addPlayer(makePlayer("p1"));
      room.updatePlayerPosition("p1", { x: 10, y: 20, z: 30 });
      expect(room.getPlayer("p1")!.position).toEqual({ x: 10, y: 20, z: 30 });
    });

    it("does nothing for non-existent player", () => {
      const room = makeRoom();
      // Should not throw
      room.updatePlayerPosition("nope", { x: 1, y: 2, z: 3 });
    });
  });

  describe("isFull", () => {
    it("returns false when empty", () => {
      expect(makeRoom().isFull()).toBe(false);
    });

    it("returns false when under capacity", () => {
      const room = makeRoom({ maxPlayers: 2 });
      room.addPlayer(makePlayer("p1"));
      expect(room.isFull()).toBe(false);
    });

    it("returns true when at capacity", () => {
      const room = makeRoom({ maxPlayers: 1 });
      room.addPlayer(makePlayer("p1"));
      expect(room.isFull()).toBe(true);
    });
  });

  describe("getState", () => {
    it("returns all players as a record", () => {
      const room = makeRoom();
      room.addPlayer(makePlayer("p1", "Alice"));
      room.addPlayer(makePlayer("p2", "Bob"));
      const state = room.getState();
      expect(state.id).toBe("test-room");
      expect(state.players).toHaveProperty("p1");
      expect(state.players).toHaveProperty("p2");
      expect(state.players["p1"]?.name).toBe("Alice");
    });

    it("returns empty players record when room is empty", () => {
      const state = makeRoom().getState();
      expect(state.players).toEqual({});
    });

    it("includes room metadata", () => {
      const state = makeRoom().getState();
      expect(state.name).toBe("Test Room");
      expect(state.theme).toBe("test");
      expect(state.maxPlayers).toBe(20);
    });
  });

  describe("getInfo", () => {
    it("returns room info with player count", () => {
      const room = makeRoom();
      room.addPlayer(makePlayer("p1"));
      const info = room.getInfo();
      expect(info.id).toBe("test-room");
      expect(info.playerCount).toBe(1);
      expect(info.maxPlayers).toBe(20);
    });

    it("reports zero players when empty", () => {
      expect(makeRoom().getInfo().playerCount).toBe(0);
    });
  });
});
