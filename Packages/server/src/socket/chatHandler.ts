// Cozy Creatures - Chat Handler
//
// Handles chat:message events, broadcasts to rooms, and maintains
// per-room message history (in-memory ring buffer).
//
// Depends on: @cozy/shared (ChatMessage, MAX_CHAT_MESSAGE, CHAT_HISTORY_SIZE),
//             socket/types.ts, socket/validation.ts (stripControlChars, createRateLimiter),
//             socket/profanityFilter.ts, config.ts
// Used by:    index.ts, socket/connectionHandler.ts (sendChatHistory, cleanupChat, clearHistory)

import { randomUUID } from "crypto";
import type { ChatMessage } from "@cozy/shared";
import { MAX_CHAT_MESSAGE, CHAT_HISTORY_SIZE } from "@cozy/shared";
import { config } from "../config.js";
import type { TypedServer, TypedSocket } from "./types.js";
import { stripControlChars, createRateLimiter } from "./validation.js";
import { filterProfanity } from "./profanityFilter.js";

// --- Chat history (in-memory ring buffer per room) ---

const chatHistory = new Map<string, ChatMessage[]>();

/** Get the history array for a room, creating it if needed. @internal */
export function getHistory(roomId: string): ChatMessage[] {
  let history = chatHistory.get(roomId);
  if (!history) {
    history = [];
    chatHistory.set(roomId, history);
  }
  return history;
}

/** Append a message to a room's history, evicting the oldest if full. @internal */
export function addToHistory(roomId: string, message: ChatMessage): void {
  const history = getHistory(roomId);
  history.push(message);
  if (history.length > CHAT_HISTORY_SIZE) {
    history.shift();
  }
}

/** Remove a room's chat history. Useful when the last player leaves. */
export function clearHistory(roomId: string): void {
  chatHistory.delete(roomId);
}

// --- Content sanitization ---

/**
 * Validate and sanitize raw chat content. Returns the cleaned string,
 * or null if the input is invalid/empty.
 * @internal Exported for testing.
 */
export function sanitizeChatContent(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const sanitized = stripControlChars(raw).trim().slice(0, MAX_CHAT_MESSAGE);
  if (sanitized.length === 0) return null;
  return filterProfanity(sanitized);
}

// --- Rate limiting ---

const chatLimiter = createRateLimiter(config.chatRateMs);

setInterval(() => chatLimiter.sweep(config.sweepMaxAgeMs), config.sweepIntervalMs).unref();

// --- Public API ---

/** Send chat history to a newly joined player. Called by connectionHandler after successful join. */
export function sendChatHistory(socket: TypedSocket, roomId: string): void {
  const history = getHistory(roomId);
  if (history.length > 0) {
    socket.emit("chat:history", history);
  }
}

/** Clean up rate limiter entry on disconnect. Called by connectionHandler. */
export function cleanupChat(socketId: string): void {
  chatLimiter.clear(socketId);
}

/** Register chat event listeners on each socket connection. */
export function registerChatHandler(io: TypedServer): void {
  io.on("connection", (socket: TypedSocket) => {
    socket.on("chat:message", (data) => {
      try {
        if (!data || typeof data !== "object") return;

        const { playerId, playerName, roomId } = socket.data;
        if (!playerId || !playerName || !roomId) return;

        if (chatLimiter.isRateLimited(socket.id)) return;

        const content = sanitizeChatContent(data.content);
        if (!content) return;

        const message: ChatMessage = {
          id: randomUUID(),
          senderId: playerId,
          senderName: playerName,
          content,
          roomId,
          timestamp: Date.now(),
        };

        addToHistory(roomId, message);

        // Broadcast to ALL in room (including sender — they see the filtered version)
        io.to(roomId).emit("chat:message", message);

        console.log(`[chat] ${playerName} in ${roomId} (${content.length} chars)`);
      } catch (err) {
        console.error("[chat] chat:message error:", err);
      }
    });
  });
}
