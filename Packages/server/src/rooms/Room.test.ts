// Cozy Creatures - Room Tests
//
// Depends on: rooms/Room.ts, @cozy/shared (Player, RoomConfig, RoomEnvironment)
// Used by:    test runner

import { describe, it, expect } from "vitest";
import { Room } from "./Room.js";
import type { Player, RoomConfig, RoomEnvironment } from "@cozy/shared";

const TEST_ENVIRONMENT: RoomEnvironment = {
  bounds: { minX: -10, maxX: 10, minZ: -10, maxZ: 10 },
  sitSpots: [
    { id: "spot-1", position: { x: 2, y: 0, z: 3 }, rotation: 0, label: "Chair" },
    { id: "spot-2", position: { x: -2, y: 0, z: -3 }, rotation: Math.PI, label: "Bench" },
  ],
};

function makeRoom(overrides: Partial<RoomConfig> = {}): Room {
  return new Room({
    id: overrides.id ?? "test-room",
    name: overrides.name ?? "Test Room",
    theme: overrides.theme ?? "test",
    maxPlayers: overrides.maxPlayers ?? 20,
    description: overrides.description ?? "A test room",
    environment: overrides.environment ?? TEST_ENVIRONMENT,
  });
}

function makePlayer(id: string, name = "Player"): Player {
  return {
    id,
    name,
    creatureType: "otter",
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
      expect(room.addPlayer(player)).toBeNull();
      expect(room.getPlayer("p1")).toBe(player);
    });

    it("returns 'duplicate' for duplicate player ID", () => {
      const room = makeRoom();
      const player = makePlayer("p1");
      expect(room.addPlayer(player)).toBeNull();
      expect(room.addPlayer(makePlayer("p1", "Duplicate"))).toBe("duplicate");
    });

    it("does not overwrite existing player on duplicate ID", () => {
      const room = makeRoom();
      room.addPlayer(makePlayer("p1", "Original"));
      room.addPlayer(makePlayer("p1", "Duplicate"));
      expect(room.getPlayer("p1")!.name).toBe("Original");
    });

    it("returns 'full' when room is full", () => {
      const room = makeRoom({ maxPlayers: 1 });
      room.addPlayer(makePlayer("p1"));
      expect(room.addPlayer(makePlayer("p2"))).toBe("full");
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
      expect(room.addPlayer(makePlayer("p2"))).toBeNull();
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

  describe("sit spots", () => {
    it("allows a player to occupy an empty spot", () => {
      const room = makeRoom();
      room.addPlayer(makePlayer("p1"));
      expect(room.occupySitSpot("p1", "spot-1")).toBe(true);
      expect(room.isSitSpotOccupied("spot-1")).toBe(true);
    });

    it("rejects occupying an already-taken spot", () => {
      const room = makeRoom();
      room.addPlayer(makePlayer("p1"));
      room.addPlayer(makePlayer("p2"));
      room.occupySitSpot("p1", "spot-1");
      expect(room.occupySitSpot("p2", "spot-1")).toBe(false);
    });

    it("sets sitSpotId on the player", () => {
      const room = makeRoom();
      room.addPlayer(makePlayer("p1"));
      room.occupySitSpot("p1", "spot-1");
      expect(room.getPlayer("p1")!.sitSpotId).toBe("spot-1");
    });

    it("releases previous spot when claiming a new one", () => {
      const room = makeRoom();
      room.addPlayer(makePlayer("p1"));
      room.occupySitSpot("p1", "spot-1");
      room.occupySitSpot("p1", "spot-2");
      expect(room.isSitSpotOccupied("spot-1")).toBe(false);
      expect(room.isSitSpotOccupied("spot-2")).toBe(true);
      expect(room.getPlayer("p1")!.sitSpotId).toBe("spot-2");
    });

    it("releases spot and clears player sitSpotId", () => {
      const room = makeRoom();
      room.addPlayer(makePlayer("p1"));
      room.occupySitSpot("p1", "spot-1");
      const released = room.releaseSitSpot("p1");
      expect(released).toBe("spot-1");
      expect(room.isSitSpotOccupied("spot-1")).toBe(false);
      expect(room.getPlayer("p1")!.sitSpotId).toBeUndefined();
    });

    it("returns null when releasing a player who is not sitting", () => {
      const room = makeRoom();
      room.addPlayer(makePlayer("p1"));
      expect(room.releaseSitSpot("p1")).toBeNull();
    });

    it("releases sit spot on removePlayer", () => {
      const room = makeRoom();
      room.addPlayer(makePlayer("p1"));
      room.occupySitSpot("p1", "spot-1");
      room.removePlayer("p1");
      expect(room.isSitSpotOccupied("spot-1")).toBe(false);
    });

    it("includes sitSpotId in getState()", () => {
      const room = makeRoom();
      room.addPlayer(makePlayer("p1"));
      room.occupySitSpot("p1", "spot-1");
      const state = room.getState();
      expect(state.players["p1"]?.sitSpotId).toBe("spot-1");
    });
  });
});
