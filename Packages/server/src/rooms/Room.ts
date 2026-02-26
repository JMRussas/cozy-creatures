// Cozy Creatures - Room
//
// Holds the state for a single room: players, metadata, capacity.
//
// Depends on: @cozy/shared (Player, RoomState, RoomInfo, RoomConfig)
// Used by:    RoomManager.ts, connectionHandler.ts

import type { Player, RoomState, RoomInfo } from "@cozy/shared";
import type { RoomConfig } from "@cozy/shared";

export class Room {
  readonly id: string;
  readonly name: string;
  readonly theme: string;
  readonly maxPlayers: number;
  private players: Map<string, Player> = new Map();

  constructor(config: RoomConfig) {
    this.id = config.id;
    this.name = config.name;
    this.theme = config.theme;
    this.maxPlayers = config.maxPlayers;
  }

  addPlayer(player: Player): boolean {
    if (this.players.has(player.id)) return false;
    if (this.players.size >= this.maxPlayers) return false;
    this.players.set(player.id, player);
    return true;
  }

  removePlayer(id: string): boolean {
    return this.players.delete(id);
  }

  getPlayer(id: string): Player | undefined {
    return this.players.get(id);
  }

  updatePlayerPosition(id: string, position: Player["position"]): void {
    const player = this.players.get(id);
    if (player) {
      player.position = position;
    }
  }

  get playerCount(): number {
    return this.players.size;
  }

  isFull(): boolean {
    return this.players.size >= this.maxPlayers;
  }

  getState(): RoomState {
    return {
      id: this.id,
      name: this.name,
      theme: this.theme,
      maxPlayers: this.maxPlayers,
      players: Object.fromEntries(this.players),
    };
  }

  getInfo(): RoomInfo {
    return {
      id: this.id,
      name: this.name,
      theme: this.theme,
      playerCount: this.players.size,
      maxPlayers: this.maxPlayers,
    };
  }
}
