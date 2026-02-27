// Cozy Creatures - RoomManager Tests
//
// Depends on: rooms/RoomManager.ts, @cozy/shared (ROOMS, DEFAULT_ROOM, Player)
// Used by:    test runner

import { describe, it, expect } from "vitest";
import { RoomManager } from "./RoomManager.js";
import { ROOMS, DEFAULT_ROOM } from "@cozy/shared";
import type { Player } from "@cozy/shared";

function makePlayer(id: string): Player {
  return {
    id,
    name: "Test",
    creatureType: "otter",
    position: { x: 0, y: 0, z: 0 },
    roomId: DEFAULT_ROOM,
  };
}

describe("RoomManager", () => {
  it("initializes all rooms from the ROOMS constant", () => {
    const mgr = new RoomManager();
    const rooms = mgr.listRooms();
    expect(rooms).toHaveLength(Object.keys(ROOMS).length);
  });

  describe("getRoom", () => {
    it("returns a room by id", () => {
      const mgr = new RoomManager();
      const room = mgr.getRoom(DEFAULT_ROOM);
      expect(room).toBeDefined();
      expect(room!.id).toBe(DEFAULT_ROOM);
    });

    it("returns undefined for non-existent room", () => {
      const mgr = new RoomManager();
      expect(mgr.getRoom("non-existent")).toBeUndefined();
    });
  });

  describe("listRooms", () => {
    it("returns RoomInfo for every room", () => {
      const mgr = new RoomManager();
      const rooms = mgr.listRooms();
      for (const info of rooms) {
        expect(info).toHaveProperty("id");
        expect(info).toHaveProperty("name");
        expect(info).toHaveProperty("playerCount");
        expect(info).toHaveProperty("maxPlayers");
      }
    });

    it("starts with zero players in every room", () => {
      const mgr = new RoomManager();
      for (const info of mgr.listRooms()) {
        expect(info.playerCount).toBe(0);
      }
    });
  });

  describe("joinRoom", () => {
    it("adds a player and returns the room", () => {
      const mgr = new RoomManager();
      const result = mgr.joinRoom(DEFAULT_ROOM, makePlayer("p1"));
      expect("room" in result).toBe(true);
      if ("room" in result) {
        expect(result.room.getPlayer("p1")).toBeDefined();
      }
    });

    it("returns error for non-existent room", () => {
      const mgr = new RoomManager();
      expect(mgr.joinRoom("nope", makePlayer("p1"))).toEqual({ error: "not_found" });
    });

    it("returns error when room is full", () => {
      const mgr = new RoomManager();
      const roomId = DEFAULT_ROOM;
      const maxPlayers = ROOMS[roomId].maxPlayers;
      for (let i = 0; i < maxPlayers; i++) {
        mgr.joinRoom(roomId, makePlayer(`p${i}`));
      }
      expect(mgr.joinRoom(roomId, makePlayer("overflow"))).toEqual({ error: "full" });
    });

    it("updates player count in listRooms", () => {
      const mgr = new RoomManager();
      mgr.joinRoom(DEFAULT_ROOM, makePlayer("p1"));
      const info = mgr.listRooms().find((r) => r.id === DEFAULT_ROOM);
      expect(info!.playerCount).toBe(1);
    });
  });

  describe("rejoin after stale session (evict-and-retry)", () => {
    it("allows a player to rejoin after being evicted from a stale session", () => {
      const mgr = new RoomManager();
      const player = makePlayer("p1");

      // First join succeeds
      const result1 = mgr.joinRoom(DEFAULT_ROOM, player);
      expect("room" in result1).toBe(true);

      // Second join with same ID fails (duplicate)
      const result2 = mgr.joinRoom(DEFAULT_ROOM, player);
      expect(result2).toEqual({ error: "duplicate" });

      // Evict (simulates what connectionHandler.evictPlayer does)
      mgr.leaveRoom(DEFAULT_ROOM, "p1");

      // Retry succeeds
      const result3 = mgr.joinRoom(DEFAULT_ROOM, player);
      expect("room" in result3).toBe(true);
      if ("room" in result3) {
        expect(result3.room.getPlayer("p1")).toBeDefined();
      }
    });
  });

  describe("leaveRoom", () => {
    it("removes a player from the room", () => {
      const mgr = new RoomManager();
      mgr.joinRoom(DEFAULT_ROOM, makePlayer("p1"));
      mgr.leaveRoom(DEFAULT_ROOM, "p1");
      const room = mgr.getRoom(DEFAULT_ROOM)!;
      expect(room.getPlayer("p1")).toBeUndefined();
    });

    it("does nothing for non-existent room", () => {
      const mgr = new RoomManager();
      // Should not throw
      mgr.leaveRoom("nope", "p1");
    });

    it("does nothing for non-existent player", () => {
      const mgr = new RoomManager();
      // Should not throw
      mgr.leaveRoom(DEFAULT_ROOM, "ghost");
    });
  });
});
