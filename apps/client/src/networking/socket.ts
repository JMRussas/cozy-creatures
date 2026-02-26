// Cozy Creatures - Socket Client
//
// Typed Socket.io client. Connects through Vite's dev proxy.
//
// Depends on: @cozy/shared (event types)
// Used by:    stores/roomStore.ts, stores/chatStore.ts, networking/NetworkSync.tsx

import { io, Socket } from "socket.io-client";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@cozy/shared";

export type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

const socket: TypedSocket = io({
  autoConnect: false,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 20,
});

/**
 * Return the singleton socket instance. Prefer connectSocket/disconnectSocket
 * for lifecycle management; use getSocket() only when you need to emit events
 * or register listeners.
 */
export function getSocket(): TypedSocket {
  return socket;
}

export function connectSocket(): void {
  if (!socket.connected) {
    socket.connect();
  }
}

export function disconnectSocket(): void {
  if (socket.connected) {
    socket.disconnect();
  }
}
