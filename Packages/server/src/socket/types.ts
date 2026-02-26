// Cozy Creatures - Server Socket Types
//
// Typed Socket.io Server and Socket aliases parameterized with shared event types.
// Single source of truth — avoids duplicating generic parameters across handlers.
//
// Depends on: socket.io, @cozy/shared (event types, SocketData)
// Used by:    socket/connectionHandler.ts, socket/chatHandler.ts

import type { Server, Socket } from "socket.io";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from "@cozy/shared";

export type TypedServer = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

export type TypedSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;
