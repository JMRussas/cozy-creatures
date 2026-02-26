// Cozy Creatures - Chat Handler Tests
//
// Tests for exported pure functions: sanitizeChatContent, getHistory, addToHistory.
//
// Depends on: socket/chatHandler.ts, @cozy/shared
// Used by:    test runner

import { describe, it, expect, beforeEach } from "vitest";
import { sanitizeChatContent, getHistory, addToHistory } from "./chatHandler.js";
import { MAX_CHAT_MESSAGE, CHAT_HISTORY_SIZE } from "@cozy/shared";
import type { ChatMessage, RoomId } from "@cozy/shared";

function makeMessage(
  overrides: Partial<Omit<ChatMessage, "roomId">> & { roomId?: string } = {},
): ChatMessage {
  return {
    id: "msg-1",
    senderId: "player-1",
    senderName: "TestPlayer",
    content: "hello",
    roomId: "cozy-cafe" as RoomId,
    timestamp: Date.now(),
    ...overrides,
  } as ChatMessage;
}

describe("sanitizeChatContent", () => {
  it("returns sanitized content for valid input", () => {
    expect(sanitizeChatContent("hello world")).toBe("hello world");
  });

  it("returns null for non-string input", () => {
    expect(sanitizeChatContent(42)).toBeNull();
    expect(sanitizeChatContent(null)).toBeNull();
    expect(sanitizeChatContent(undefined)).toBeNull();
    expect(sanitizeChatContent({ content: "hi" })).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(sanitizeChatContent("")).toBeNull();
  });

  it("returns null for whitespace-only string", () => {
    expect(sanitizeChatContent("   ")).toBeNull();
    expect(sanitizeChatContent("\t\n")).toBeNull();
  });

  it("trims leading and trailing whitespace", () => {
    expect(sanitizeChatContent("  hello  ")).toBe("hello");
  });

  it("strips control characters", () => {
    expect(sanitizeChatContent("hello\x00world")).toBe("helloworld");
  });

  it("truncates to MAX_CHAT_MESSAGE length", () => {
    const long = "a".repeat(MAX_CHAT_MESSAGE + 50);
    const result = sanitizeChatContent(long);
    expect(result).not.toBeNull();
    expect(result!.length).toBe(MAX_CHAT_MESSAGE);
  });

  it("applies profanity filter", () => {
    expect(sanitizeChatContent("that is damn cool")).toBe("that is *** cool");
  });
});

describe("chat history", () => {
  // Use a unique room ID per test to avoid shared state
  let roomId: string;
  let counter = 0;

  beforeEach(() => {
    counter++;
    roomId = `test-room-${counter}-${Date.now()}`;
  });

  it("returns empty array for uninitialized room", () => {
    expect(getHistory(roomId)).toEqual([]);
  });

  it("adds a message and retrieves it", () => {
    const msg = makeMessage({ roomId });
    addToHistory(roomId, msg);
    expect(getHistory(roomId)).toEqual([msg]);
  });

  it("maintains insertion order", () => {
    const msg1 = makeMessage({ id: "m1", roomId });
    const msg2 = makeMessage({ id: "m2", roomId });
    addToHistory(roomId, msg1);
    addToHistory(roomId, msg2);
    const history = getHistory(roomId);
    expect(history[0]!.id).toBe("m1");
    expect(history[1]!.id).toBe("m2");
  });

  it("evicts oldest messages when exceeding CHAT_HISTORY_SIZE", () => {
    for (let i = 0; i < CHAT_HISTORY_SIZE + 5; i++) {
      addToHistory(roomId, makeMessage({ id: `msg-${i}`, roomId }));
    }
    const history = getHistory(roomId);
    expect(history.length).toBe(CHAT_HISTORY_SIZE);
    // Oldest 5 should have been evicted
    expect(history[0]!.id).toBe("msg-5");
    expect(history[history.length - 1]!.id).toBe(
      `msg-${CHAT_HISTORY_SIZE + 4}`,
    );
  });

  it("keeps separate histories per room", () => {
    const roomA = `room-a-${Date.now()}`;
    const roomB = `room-b-${Date.now()}`;
    addToHistory(roomA, makeMessage({ id: "a1", roomId: roomA }));
    addToHistory(roomB, makeMessage({ id: "b1", roomId: roomB }));
    expect(getHistory(roomA).length).toBe(1);
    expect(getHistory(roomB).length).toBe(1);
    expect(getHistory(roomA)[0]!.id).toBe("a1");
    expect(getHistory(roomB)[0]!.id).toBe("b1");
  });
});
