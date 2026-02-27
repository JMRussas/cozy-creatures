// Cozy Creatures - Room Card
//
// Individual room card for the room browser. Displays name, description,
// player count, and a themed accent color.
//
// Depends on: @cozy/shared (RoomInfo)
// Used by:    ui/rooms/RoomBrowser.tsx

import type { RoomId, RoomInfo } from "@cozy/shared";
import { ROOMS } from "@cozy/shared";

/** Theme accent colors for room cards. */
const THEME_COLORS: Record<string, string> = {
  "cozy-cafe": "#d4a574",
  "rooftop-garden": "#81c784",
  "starlight-lounge": "#b39ddb",
};

interface RoomCardProps {
  room: RoomInfo;
  /** Whether this is the currently active room (in-room mode). */
  isCurrent?: boolean;
  /** Whether this room is selected (join-screen mode). */
  isSelected?: boolean;
  onClick: () => void;
  disabled?: boolean;
}

export default function RoomCard({
  room,
  isCurrent,
  isSelected,
  onClick,
  disabled,
}: RoomCardProps) {
  const isFull = room.playerCount >= room.maxPlayers;
  const accentColor = THEME_COLORS[room.theme] ?? "#9e9e9e";

  return (
    <button
      onClick={onClick}
      disabled={disabled || isCurrent || isFull}
      className={`flex flex-col rounded-lg p-3 text-left transition-colors ${
        isCurrent
          ? "cursor-default border-2 border-green-500/60 bg-gray-700/80"
          : isSelected
            ? "ring-2 ring-purple-400 bg-gray-700/80"
            : isFull
              ? "cursor-not-allowed bg-gray-800/40 opacity-60"
              : "bg-gray-800/60 hover:bg-gray-700/60"
      }`}
      style={{ borderTop: `3px solid ${accentColor}` }}
    >
      {/* Room name + status badge */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-white">{room.name}</span>
        {isCurrent && (
          <span className="rounded bg-green-600/80 px-1.5 py-0.5 text-[10px] font-bold text-white">
            CURRENT
          </span>
        )}
        {isFull && !isCurrent && (
          <span className="rounded bg-red-600/60 px-1.5 py-0.5 text-[10px] font-bold text-white">
            FULL
          </span>
        )}
      </div>

      {/* Description */}
      <p className="mt-1 text-xs text-gray-400">
        {room.id in ROOMS ? ROOMS[room.id as RoomId].description : ""}
      </p>

      {/* Player count */}
      <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
        <span
          className="inline-block h-2 w-2 rounded-full"
          style={{ backgroundColor: room.playerCount > 0 ? "#4ade80" : "#6b7280" }}
        />
        {room.playerCount} / {room.maxPlayers} players
      </div>
    </button>
  );
}