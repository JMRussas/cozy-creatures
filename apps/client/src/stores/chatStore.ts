// Cozy Creatures - Chat Store
//
// Zustand store for chat messages and bubble state.
// Wires Socket.io listeners to receive messages and history from the server.
//
// Depends on: @cozy/shared (ChatMessage, CHAT_BUBBLE_DURATION_MS, CHAT_HISTORY_SIZE),
//             networking/socket.ts
// Used by:    ui/ChatPanel.tsx, creatures/ChatBubble.tsx, stores/roomStore.ts

import { create } from "zustand";
import type { ChatMessage } from "@cozy/shared";
import { CHAT_BUBBLE_DURATION_MS, CHAT_HISTORY_SIZE } from "@cozy/shared";
import { getSocket } from "../networking/socket";

const socket = getSocket();

interface ChatBubble {
  content: string;
  timestamp: number;
}

interface ChatStore {
  // State
  messages: ChatMessage[];
  bubbles: Record<string, ChatBubble>;
  unreadCount: number;
  isPanelOpen: boolean;

  // Actions
  sendMessage: (content: string) => void;
  markRead: () => void;
  togglePanel: () => void;
  setPanel: (open: boolean) => void;
  clearChat: () => void;
}

// Bubble auto-removal timers, tracked outside store for cleanup
const bubbleTimers = new Map<string, ReturnType<typeof setTimeout>>();

function addBubble(playerId: string, content: string): void {
  const existing = bubbleTimers.get(playerId);
  if (existing) clearTimeout(existing);

  useChatStore.setState((prev) => ({
    bubbles: {
      ...prev.bubbles,
      [playerId]: { content, timestamp: Date.now() },
    },
  }));

  const timer = setTimeout(() => {
    useChatStore.setState((prev) => {
      const { [playerId]: _, ...rest } = prev.bubbles;
      return { bubbles: rest };
    });
    bubbleTimers.delete(playerId);
  }, CHAT_BUBBLE_DURATION_MS);

  bubbleTimers.set(playerId, timer);
}

export const useChatStore = create<ChatStore>((set, get) => ({
  messages: [],
  bubbles: {},
  unreadCount: 0,
  isPanelOpen: false,

  sendMessage: (content) => {
    const trimmed = content.trim();
    if (!trimmed) return;
    socket.emit("chat:message", { content: trimmed });
  },

  markRead: () => set({ unreadCount: 0 }),

  togglePanel: () => {
    const wasOpen = get().isPanelOpen;
    set({ isPanelOpen: !wasOpen, unreadCount: wasOpen ? get().unreadCount : 0 });
  },

  setPanel: (open) => {
    set({ isPanelOpen: open });
    if (open) set({ unreadCount: 0 });
  },

  clearChat: () => {
    // Clear all bubble timers
    for (const timer of bubbleTimers.values()) {
      clearTimeout(timer);
    }
    bubbleTimers.clear();
    set({ messages: [], bubbles: {}, unreadCount: 0 });
  },
}));

// --- Socket event listeners ---
// Uses .off().on() pattern to prevent duplicate listeners on Vite HMR,
// matching the same pattern in roomStore.ts.

socket.off("chat:message").on("chat:message", (message: ChatMessage) => {
  useChatStore.setState((prev) => ({
    messages: [...prev.messages, message].slice(-CHAT_HISTORY_SIZE),
    unreadCount: prev.isPanelOpen ? prev.unreadCount : prev.unreadCount + 1,
  }));
  addBubble(message.senderId, message.content);
});

socket.off("chat:history").on("chat:history", (messages: ChatMessage[]) => {
  // History is loaded on room join — clear any stale bubble timers from a
  // previous session. Intentionally does NOT trigger bubbles for history
  // messages (they'd all pop at once and be meaningless).
  for (const timer of bubbleTimers.values()) {
    clearTimeout(timer);
  }
  bubbleTimers.clear();
  useChatStore.setState({ messages, bubbles: {} });
});
