// Cozy Creatures - Socket Event Types
//
// Type-safe Socket.io event definitions shared between client and server.
//
// Depends on: player.ts, room.ts, chat.ts
// Used by:    client socket.ts, server socket handlers

import type { Player, Position } from "./player.js";
import type { RoomInfo, RoomState } from "./room.js";
import type { ChatMessage } from "./chat.js";

// Client → Server events
export interface ClientToServerEvents {
  "player:join": (data: { name: string; creatureType: string; roomId: string }) => void;
  "player:move": (data: { position: Position }) => void;
  "player:leave": () => void;
  "chat:message": (data: { content: string }) => void;
  "room:list": (callback: (rooms: RoomInfo[]) => void) => void;
}

// Server → Client events
export interface ServerToClientEvents {
  "room:state": (state: RoomState) => void;
  "player:joined": (player: Player) => void;
  "player:moved": (data: { id: string; position: Position }) => void;
  "player:left": (data: { id: string }) => void;
  "chat:message": (message: ChatMessage) => void;
  "chat:history": (messages: ChatMessage[]) => void;
}

// Inter-server events (unused for now)
export interface InterServerEvents {}

// Socket data attached to each connection
export interface SocketData {
  playerId: string;
  playerName: string;
  roomId: string;
}
