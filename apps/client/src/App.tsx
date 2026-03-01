// Cozy Creatures - App Root Component
//
// Shows a join screen before the scene. Once joined, renders the
// isometric 3D scene with multiplayer and voice chat. Persists
// name, creature, and room selection to localStorage.
//
// Depends on: scene/IsometricScene, stores/roomStore, stores/skinStore,
//             ui/ChatPanel, ui/VoiceControls, ui/camera/ZoomControls, ui/SkinShop,
//             ui/rooms/RoomBrowser, ui/transitions/RoomTransition,
//             ui/CreaturePicker, ui/CreaturePreview,
//             networking/useVoice, @cozy/shared
// Used by:    main.tsx

import { useState, useEffect, memo } from "react";
import type { CreatureTypeId, RoomId } from "@cozy/shared";
import {
  CREATURES,
  DEFAULT_CREATURE,
  MAX_PLAYER_NAME,
  ROOMS,
  DEFAULT_ROOM,
} from "@cozy/shared";
import { useRoomStore } from "./stores/roomStore";
import { useSkinStore } from "./stores/skinStore";
import IsometricScene from "./scene/IsometricScene";
import ChatPanel from "./ui/chat/ChatPanel";
import VoiceControls from "./ui/voice/VoiceControls";
import SkinShop from "./ui/skins/SkinShop";
import RoomBrowser from "./ui/rooms/RoomBrowser";
import RoomTransition from "./ui/transitions/RoomTransition";
import CreaturePicker from "./ui/creatures/CreaturePicker";
import CreaturePreview from "./ui/creatures/CreaturePreview";
import ZoomControls from "./ui/camera/ZoomControls";
import useVoice from "./networking/useVoice";

// --- localStorage keys ---
const LS_NAME = "cozy-creatures:name";
const LS_CREATURE = "cozy-creatures:creature";
const LS_ROOM = "cozy-creatures:room";

function loadStored<T extends string>(key: string, validate: (v: string) => boolean, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    if (v && validate(v)) return v as T;
  } catch { /* localStorage unavailable */ }
  return fallback;
}

function saveStored(key: string, value: string): void {
  try { localStorage.setItem(key, value); } catch { /* ignore */ }
}

const MemoizedScene = memo(IsometricScene);

export default function App() {
  const roomId = useRoomStore((s) => s.roomId);
  const isConnected = useRoomStore((s) => s.isConnected);
  const playerCount = useRoomStore((s) => Object.keys(s.players).length);
  const joinState = useRoomStore((s) => s.joinState);
  const joinError = useRoomStore((s) => s.joinError);
  const join = useRoomStore((s) => s.join);
  const leaveRoom = useRoomStore((s) => s.leave);
  const localPlayerId = useRoomStore((s) => s.localPlayerId);
  const fetchInventory = useSkinStore((s) => s.fetchInventory);
  const resetSkins = useSkinStore((s) => s.resetSkins);

  function leave() {
    leaveRoom();
    resetSkins();
  }

  const [name, setName] = useState<string>(() => loadStored(LS_NAME, (v) => v.trim().length > 0 && v.length <= MAX_PLAYER_NAME, ""));
  const [creature, setCreature] = useState<CreatureTypeId>(
    () => loadStored(LS_CREATURE, (v) => v in CREATURES, DEFAULT_CREATURE),
  );
  const [selectedRoom, setSelectedRoom] = useState<RoomId>(
    () => loadStored(LS_ROOM, (v) => v in ROOMS, DEFAULT_ROOM),
  );

  // Fetch skin inventory after joining
  useEffect(() => {
    if (localPlayerId) {
      fetchInventory(localPlayerId);
    }
  }, [localPlayerId, fetchInventory]);

  // Persist selections to localStorage
  useEffect(() => { saveStored(LS_NAME, name); }, [name]);
  useEffect(() => { saveStored(LS_CREATURE, creature); }, [creature]);
  useEffect(() => { saveStored(LS_ROOM, selectedRoom); }, [selectedRoom]);

  function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    join(name.trim(), creature, selectedRoom);
  }

  if (!roomId) {
    const isJoining = joinState === "joining";

    return (
      <div className="flex h-full w-full items-center justify-center">
        <form
          onSubmit={handleJoin}
          className="flex flex-col gap-4 rounded-xl bg-gray-800 p-8 shadow-lg"
          style={{ maxWidth: "540px", width: "100%" }}
        >
          <h1 className="text-3xl font-bold text-purple-300">Cozy Creatures</h1>
          <p className="text-sm text-gray-400">Pick a name and creature, then join a room</p>

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

          {/* Creature selection: preview + picker grid */}
          <div className="flex gap-4">
            <CreaturePreview creatureType={creature} />
            <div className="flex-1">
              <CreaturePicker
                selected={creature}
                onSelect={setCreature}
                disabled={isJoining}
              />
            </div>
          </div>

          {/* Room selection: card browser */}
          <RoomBrowser
            mode="inline"
            selectedRoom={selectedRoom}
            onSelect={setSelectedRoom}
            disabled={isJoining}
          />

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

  // roomId is guaranteed non-null here — the !inRoom early return handles null
  return <InRoomView roomId={roomId} isConnected={isConnected} playerCount={playerCount} leave={leave} />;
}

/** Separate component so hooks (useVoice) are never called conditionally. */
function InRoomView({
  roomId,
  isConnected,
  playerCount,
  leave,
}: {
  roomId: string;
  isConnected: boolean;
  playerCount: number;
  leave: () => void;
}) {
  useVoice();
  const [showSkins, setShowSkins] = useState(false);
  const [showRooms, setShowRooms] = useState(false);
  const switchRoom = useRoomStore((s) => s.switchRoom);
  const isTransitioning = useRoomStore((s) => s.isTransitioning);

  return (
    <div className="relative h-full w-full">
      <MemoizedScene />
      <RoomTransition isTransitioning={isTransitioning} />

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
        <div className="flex items-center gap-2">
          <button
            onClick={leave}
            className="pointer-events-auto w-fit rounded bg-red-600/80 px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-red-500"
          >
            Leave
          </button>
          <button
            onClick={() => setShowRooms(true)}
            className="pointer-events-auto w-fit rounded bg-indigo-600/80 px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-indigo-500"
          >
            Rooms
          </button>
          <button
            onClick={() => setShowSkins(true)}
            className="pointer-events-auto w-fit rounded bg-purple-600/80 px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-purple-500"
          >
            Skins
          </button>
          <VoiceControls />
        </div>
      </div>

      <ChatPanel />
      <ZoomControls />

      {showSkins && <SkinShop onClose={() => setShowSkins(false)} />}
      {showRooms && (
        <RoomBrowser
          mode="modal"
          onSwitch={switchRoom}
          onClose={() => setShowRooms(false)}
        />
      )}
    </div>
  );
}
