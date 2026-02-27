// Cozy Creatures - Room Browser
//
// Card-based room browser with live player counts. Used both on the join
// screen (inline mode) and as an in-game modal (modal mode).
//
// Depends on: @cozy/shared (RoomId, RoomInfo, ROOMS), networking/socket.ts,
//             stores/roomStore, ui/rooms/RoomCard
// Used by:    App.tsx

import { useState, useEffect, useCallback } from "react";
import type { RoomId, RoomInfo } from "@cozy/shared";
import { ROOMS } from "@cozy/shared";
import { getSocket } from "../../networking/socket";
import { useRoomStore } from "../../stores/roomStore";
import RoomCard from "./RoomCard";

const socket = getSocket();

interface RoomBrowserProps {
  /** "inline" for join screen, "modal" for in-room overlay. */
  mode: "inline" | "modal";
  /** Currently selected room (join screen). */
  selectedRoom?: RoomId;
  /** Room selection callback (join screen). */
  onSelect?: (roomId: RoomId) => void;
  /** Room switch callback (in-room). */
  onSwitch?: (roomId: RoomId) => void;
  /** Close modal. */
  onClose?: () => void;
  disabled?: boolean;
}

export default function RoomBrowser({
  mode,
  selectedRoom,
  onSelect,
  onSwitch,
  onClose,
  disabled,
}: RoomBrowserProps) {
  const currentRoomId = useRoomStore((s) => s.roomId);
  const roomCounts = useRoomStore((s) => s.roomCounts);
  const [rooms, setRooms] = useState<RoomInfo[]>([]);

  // Fetch room list on mount
  useEffect(() => {
    if (!socket.connected && mode === "inline") {
      // Not connected yet — build from constants with zero counts
      const staticRooms: RoomInfo[] = Object.values(ROOMS).map((r) => ({
        id: r.id,
        name: r.name,
        theme: r.theme,
        maxPlayers: r.maxPlayers,
        playerCount: 0,
      }));
      setRooms(staticRooms);
      return;
    }

    socket.emit("room:list", (roomList) => {
      setRooms(roomList);
    });
  }, [mode]);

  // Update counts from live room:player-count events
  const mergedRooms = rooms.map((r) => ({
    ...r,
    playerCount: roomCounts[r.id] ?? r.playerCount,
  }));

  // If rooms haven't loaded yet and we have none, use static data
  const displayRooms =
    mergedRooms.length > 0
      ? mergedRooms
      : Object.values(ROOMS).map((r) => ({
          id: r.id,
          name: r.name,
          theme: r.theme,
          maxPlayers: r.maxPlayers,
          playerCount: roomCounts[r.id] ?? 0,
        }));

  const handleCardClick = useCallback(
    (roomId: string) => {
      if (mode === "inline" && onSelect) {
        onSelect(roomId as RoomId);
      } else if (mode === "modal" && onSwitch) {
        onSwitch(roomId as RoomId);
        onClose?.();
      }
    },
    [mode, onSelect, onSwitch, onClose],
  );

  // Escape to close in modal mode
  useEffect(() => {
    if (mode !== "modal" || !onClose) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose!();
      }
    }
    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [mode, onClose]);

  const content = (
    <div className="flex flex-col gap-2">
      {mode === "modal" && (
        <div className="flex items-center justify-between pb-1">
          <h2 className="text-lg font-bold text-purple-300">Switch Room</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
            aria-label="Close"
          >
            &#x2715;
          </button>
        </div>
      )}
      <div className="grid grid-cols-3 gap-2">
        {displayRooms.map((room) => (
          <RoomCard
            key={room.id}
            room={room}
            isCurrent={mode === "modal" && room.id === currentRoomId}
            isSelected={mode === "inline" && room.id === selectedRoom}
            onClick={() => handleCardClick(room.id)}
            disabled={disabled}
          />
        ))}
      </div>
    </div>
  );

  if (mode === "modal") {
    return (
      <div
        className="pointer-events-auto absolute inset-0 z-50 flex items-center justify-center bg-black/60"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose?.();
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Room Browser"
      >
        <div className="w-full max-w-lg rounded-xl bg-gray-800 p-6 shadow-2xl">
          {content}
        </div>
      </div>
    );
  }

  return content;
}
