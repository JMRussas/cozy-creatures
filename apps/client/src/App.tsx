// Cozy Creatures - App Root Component
//
// Shows a join screen before the scene. Once joined, renders the
// isometric 3D scene with multiplayer.
//
// Depends on: scene/IsometricScene, stores/roomStore, ui/ChatPanel, @cozy/shared
// Used by:    main.tsx

import { useState, memo } from "react";
import type { CreatureTypeId, RoomId } from "@cozy/shared";
import {
  CREATURES,
  DEFAULT_CREATURE,
  MAX_PLAYER_NAME,
  ROOMS,
  DEFAULT_ROOM,
} from "@cozy/shared";
import { useRoomStore } from "./stores/roomStore";
import IsometricScene from "./scene/IsometricScene";
import ChatPanel from "./ui/ChatPanel";

const MemoizedScene = memo(IsometricScene);

export default function App() {
  const roomId = useRoomStore((s) => s.roomId);
  const isConnected = useRoomStore((s) => s.isConnected);
  const playerCount = useRoomStore((s) => Object.keys(s.players).length);
  const joinState = useRoomStore((s) => s.joinState);
  const joinError = useRoomStore((s) => s.joinError);
  const join = useRoomStore((s) => s.join);
  const leave = useRoomStore((s) => s.leave);

  const [name, setName] = useState("");
  const [creature, setCreature] = useState<CreatureTypeId>(DEFAULT_CREATURE);
  const [selectedRoom, setSelectedRoom] = useState<RoomId>(DEFAULT_ROOM);

  const inRoom = roomId !== null;

  function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    join(name.trim(), creature, selectedRoom);
  }

  if (!inRoom) {
    const isJoining = joinState === "joining";

    return (
      <div className="flex h-full w-full items-center justify-center">
        <form
          onSubmit={handleJoin}
          className="flex flex-col gap-4 rounded-xl bg-gray-800 p-8 shadow-lg"
        >
          <h1 className="text-3xl font-bold text-purple-300">Cozy Creatures</h1>
          <p className="text-sm text-gray-400">Pick a name and join a room</p>

          {joinError && (
            <p className="text-sm text-red-400">{joinError}</p>
          )}

          <input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={MAX_PLAYER_NAME}
            autoFocus
            disabled={isJoining}
            className="rounded bg-gray-700 px-3 py-2 text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
          />

          <select
            value={creature}
            onChange={(e) => setCreature(e.target.value as CreatureTypeId)}
            disabled={isJoining}
            className="rounded bg-gray-700 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
          >
            {Object.values(CREATURES).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={selectedRoom}
            onChange={(e) => setSelectedRoom(e.target.value as RoomId)}
            disabled={isJoining}
            className="rounded bg-gray-700 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
          >
            {Object.values(ROOMS).map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>

          <button
            type="submit"
            disabled={isJoining}
            className="rounded bg-purple-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-purple-500 disabled:opacity-50"
          >
            {isJoining ? "Joining..." : "Join Room"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <MemoizedScene />

      {/* HUD overlay */}
      <div className="pointer-events-none absolute left-4 top-4 flex flex-col gap-2">
        <div className="pointer-events-auto rounded bg-gray-900/80 px-3 py-2 text-sm text-gray-200">
          <span className="font-semibold text-purple-300">
            {(roomId && roomId in ROOMS ? ROOMS[roomId as RoomId]?.name : roomId) ?? "Unknown"}
          </span>
          {" — "}
          {playerCount} player{playerCount !== 1 ? "s" : ""}
          {isConnected ? "" : " (reconnecting...)"}
        </div>
        <button
          onClick={leave}
          className="pointer-events-auto w-fit rounded bg-red-600/80 px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-red-500"
        >
          Leave
        </button>
      </div>

      <ChatPanel />
    </div>
  );
}
