// Cozy Creatures - Chat Types
//
// Chat message structures for room text chat.
//
// Depends on: nothing
// Used by:    client chat store, server chat handler

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  roomId: string;
  timestamp: number;
}
