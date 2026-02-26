// Cozy Creatures - Chat Types
//
// Chat message structures for room text chat.
//
// Depends on: constants/rooms.ts
// Used by:    client chat store, server chat handler

import type { RoomId } from "../constants/rooms.js";

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  roomId: RoomId;
  timestamp: number;
}
