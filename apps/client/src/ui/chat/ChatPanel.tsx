// Cozy Creatures - Chat Panel
//
// Side panel with message list, input field, and send button.
// Scrolls to bottom on new messages. Shows unread badge when collapsed.
//
// Depends on: stores/chatStore, stores/roomStore, stores/voiceStore,
//             @cozy/shared (MAX_CHAT_MESSAGE), zustand/react/shallow
// Used by:    App.tsx

import { useState, useRef, useEffect } from "react";
import { useShallow } from "zustand/react/shallow";
import { useChatStore } from "../../stores/chatStore";
import { useRoomStore } from "../../stores/roomStore";
import { useVoiceStore } from "../../stores/voiceStore";
import { MAX_CHAT_MESSAGE } from "@cozy/shared";

export default function ChatPanel() {
  const { messages, unreadCount, isPanelOpen, togglePanel, sendMessage } =
    useChatStore(
      useShallow((s) => ({
        messages: s.messages,
        unreadCount: s.unreadCount,
        isPanelOpen: s.isPanelOpen,
        togglePanel: s.togglePanel,
        sendMessage: s.sendMessage,
      })),
    );
  const localPlayerId = useRoomStore((s) => s.localPlayerId);

  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom when new messages arrive while panel is open
  useEffect(() => {
    if (isPanelOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length, isPanelOpen]);

  // Focus input when panel opens (instead of autoFocus which steals from canvas)
  useEffect(() => {
    if (isPanelOpen) {
      inputRef.current?.focus();
    }
  }, [isPanelOpen]);

  // Close panel on Escape key — window-level so it works regardless of focus
  useEffect(() => {
    if (!isPanelOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") togglePanel();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPanelOpen, togglePanel]);

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage(input);
    setInput("");
  }

  // Collapsed: floating chat button with unread badge
  if (!isPanelOpen) {
    return (
      <button
        onClick={togglePanel}
        className="pointer-events-auto fixed bottom-4 right-4 flex items-center gap-2 rounded-full bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-purple-500"
      >
        Chat
        {unreadCount > 0 && (
          <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>
    );
  }

  // Open: chat panel
  return (
    <div
      className="pointer-events-auto fixed bottom-4 right-4 flex h-80 w-72 flex-col rounded-xl bg-gray-900/95 shadow-lg"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-700 px-3 py-2">
        <span className="text-sm font-semibold text-purple-300">Chat</span>
        <button
          onClick={togglePanel}
          className="text-sm text-gray-400 transition-colors hover:text-white"
          aria-label="Close chat"
        >
          {"\u00d7"}
        </button>
      </div>

      {/* Message list */}
      <div className="flex-1 overflow-y-auto px-3 py-2 text-sm" aria-live="polite">
        {messages.length === 0 && (
          <p className="text-center text-xs text-gray-500">No messages yet</p>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className="mb-1">
            <span
              className={`font-semibold ${
                msg.senderId === localPlayerId
                  ? "text-purple-300"
                  : "text-blue-300"
              }`}
            >
              {msg.senderName}
              <SpeakingDot
                playerId={msg.senderId}
                isLocal={msg.senderId === localPlayerId}
              />
              :
            </span>{" "}
            <span className="text-gray-200">{msg.content}</span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="flex border-t border-gray-700 p-2">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={MAX_CHAT_MESSAGE}
          placeholder="Say something..."
          className="flex-1 rounded-l bg-gray-800 px-2 py-1 text-sm text-white placeholder-gray-500 outline-none focus:ring-1 focus:ring-purple-500"
        />
        <button
          type="submit"
          className="rounded-r bg-purple-600 px-3 py-1 text-sm font-semibold text-white transition-colors hover:bg-purple-500"
        >
          Send
        </button>
      </form>
    </div>
  );
}

/** Per-player speaking dot — isolates voiceStore re-renders from ChatPanel. */
function SpeakingDot({
  playerId,
  isLocal,
}: {
  playerId: string;
  isLocal: boolean;
}) {
  const speaking = useVoiceStore((s) =>
    isLocal ? s.speaking : (s.remoteSpeaking[playerId] ?? false),
  );
  if (!speaking) return null;
  return (
    <span
      className="ml-1 inline-block h-2 w-2 rounded-full bg-green-400"
      title="Speaking"
    />
  );
}
