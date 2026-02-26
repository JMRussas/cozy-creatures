// Cozy Creatures - RoomManager
//
// Manages all active rooms. Initializes from shared room constants.
//
// Depends on: Room.ts, @cozy/shared (ROOMS, RoomInfo, Player)
// Used by:    index.ts, connectionHandler.ts

import type { Player, RoomInfo } from "@cozy/shared";
import { ROOMS } from "@cozy/shared";
import { Room } from "./Room.js";

export class RoomManager {
  private rooms: Map<string, Room> = new Map();

  constructor() {
    for (const config of Object.values(ROOMS)) {
      this.rooms.set(config.id, new Room(config));
    }
    console.log(`[rooms] initialized ${this.rooms.size} rooms`);
  }

  getRoom(id: string): Room | undefined {
    return this.rooms.get(id);
  }

  listRooms(): RoomInfo[] {
    return Array.from(this.rooms.values()).map((room) => room.getInfo());
  }

  joinRoom(roomId: string, player: Player): Room | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;
    if (!room.addPlayer(player)) return null;
    return room;
  }

  leaveRoom(roomId: string, playerId: string): void {
    const room = this.rooms.get(roomId);
    if (room) {
      room.removePlayer(playerId);
    }
  }
}

export const roomManager = new RoomManager();
