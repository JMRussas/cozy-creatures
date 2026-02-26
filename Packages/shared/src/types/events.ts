// Cozy Creatures - Socket Event Types
//
// Type-safe Socket.io event definitions shared between client and server.
//
// Depends on: player.ts, room.ts, chat.ts, voice.ts
// Used by:    client socket.ts, server socket handlers

import type { Player, Position } from "./player.js";
import type { RoomInfo, RoomState } from "./room.js";
import type { ChatMessage } from "./chat.js";
import type { VoiceState } from "./voice.js";
import type { CreatureTypeId } from "../constants/creatures.js";
import type { RoomId } from "../constants/rooms.js";

/** Discriminated union for the player:join callback. */
export type JoinResponse =
  | { success: true; playerId: string }
  | { success: false; error: string };

/** Events the client can emit to the server. */
export interface ClientToServerEvents {
  "player:join": (
    data: { name: string; creatureType: CreatureTypeId; roomId: RoomId },
    callback: (response: JoinResponse) => void,
  ) => void;
  "player:move": (data: { position: Position }) => void;
  "player:leave": () => void;

  "chat:message": (data: { content: string }) => void;
  "room:list": (callback: (rooms: RoomInfo[]) => void) => void;

  "voice:state": (data: VoiceState) => void;
}

/** Events the server can emit to clients. */
export interface ServerToClientEvents {
  "room:state": (state: RoomState) => void;
  "player:joined": (player: Player) => void;
  "player:moved": (data: { id: string; position: Position }) => void;
  "player:left": (data: { id: string }) => void;

  "chat:message": (message: ChatMessage) => void;
  "chat:history": (messages: ChatMessage[]) => void;

  "voice:state": (data: { id: string } & VoiceState) => void;
}

// Inter-server events (unused for now)
export interface InterServerEvents {}

/** Per-socket data attached to each connection by the server. */
export interface SocketData {
  playerId?: string;
  playerName?: string;
  roomId?: RoomId;
}
