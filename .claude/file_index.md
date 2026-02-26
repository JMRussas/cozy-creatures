# File Index

Complete index of all source files with one-line summaries, line counts, and dependency edges.

**36 source files, ~2,400 lines** (excluding tests and config files).

## Shared Package (`@cozy/shared` — Packages/shared/src/)

### Types

| File | Lines | Summary |
|------|------:|---------|
| [index.ts](../Packages/shared/src/index.ts) | 15 | Barrel re-export of all types and constants |
| [types/player.ts](../Packages/shared/src/types/player.ts) | 32 | `Player`, `Position`, `PlayerProfile` interfaces |
| [types/creature.ts](../Packages/shared/src/types/creature.ts) | 14 | `CreatureDefinition` interface — species metadata |
| [types/room.ts](../Packages/shared/src/types/room.ts) | 30 | `RoomBase`, `RoomConfig`, `RoomInfo`, `RoomState` |
| [types/chat.ts](../Packages/shared/src/types/chat.ts) | 17 | `ChatMessage` — single chat message structure |
| [types/events.ts](../Packages/shared/src/types/events.ts) | 50 | `ClientToServerEvents`, `ServerToClientEvents`, `SocketData` |

### Constants

| File | Lines | Summary |
|------|------:|---------|
| [constants/config.ts](../Packages/shared/src/constants/config.ts) | 35 | Numeric limits: `MAX_PLAYER_NAME`, `MAX_CHAT_MESSAGE`, position bounds, rate limits |
| [constants/creatures.ts](../Packages/shared/src/constants/creatures.ts) | 47 | `CREATURES` registry (cat, fox, bunny, frog), `CreatureTypeId`, `DEFAULT_CREATURE` |
| [constants/rooms.ts](../Packages/shared/src/constants/rooms.ts) | 38 | `ROOMS` registry (3 rooms), `RoomId`, `DEFAULT_ROOM` |

### Dependency Graph

```
creature.ts ← creatures.ts ← player.ts ← events.ts
                                  ↑           ↑
room.ts ← rooms.ts ← config.ts   chat.ts ────┘
```

---

## Server Package (`@cozy/server` — Packages/server/src/)

| File | Lines | Summary |
|------|------:|---------|
| [index.ts](../Packages/server/src/index.ts) | 106 | Express + Socket.io setup, IP rate limiting, graceful shutdown |
| [config.ts](../Packages/server/src/config.ts) | 57 | Env-var-driven config with validation (`PORT`, `CORS_ORIGIN`, rate limits) |
| [rooms/Room.ts](../Packages/server/src/rooms/Room.ts) | 74 | Single room state: player Map, capacity, `getState()`, `getInfo()` |
| [rooms/RoomManager.ts](../Packages/server/src/rooms/RoomManager.ts) | 45 | Manages all Room instances, initializes from `ROOMS` constant |
| [socket/connectionHandler.ts](../Packages/server/src/socket/connectionHandler.ts) | 223 | `player:join`, `player:move`, `player:leave`, `room:list`, `disconnect` handlers |
| [socket/chatHandler.ts](../Packages/server/src/socket/chatHandler.ts) | 141 | `chat:message` handler, in-memory ring buffer history, rate limiting |
| [socket/profanityFilter.ts](../Packages/server/src/socket/profanityFilter.ts) | 35 | Word-list replacement filter — `filterProfanity()` |
| [socket/validation.ts](../Packages/server/src/socket/validation.ts) | 81 | `stripControlChars`, `sanitizePosition`, `createRateLimiter`, `isFiniteNumber`, `clamp` |

### Dependency Graph

```
index.ts
  ├── config.ts ← @cozy/shared
  ├── RoomManager.ts ← Room.ts ← @cozy/shared
  ├── connectionHandler.ts
  │     ├── validation.ts ← @cozy/shared
  │     ├── chatHandler.ts (sendChatHistory, cleanupChat)
  │     ├── RoomManager.ts
  │     └── config.ts
  └── chatHandler.ts
        ├── validation.ts (stripControlChars, createRateLimiter)
        ├── profanityFilter.ts
        └── config.ts
```

---

## Client Package (`@cozy/client` — apps/client/src/)

### Entry & App Shell

| File | Lines | Summary |
|------|------:|---------|
| [main.tsx](../apps/client/src/main.tsx) | 17 | React DOM mount point |
| [App.tsx](../apps/client/src/App.tsx) | 135 | Join form + in-room view (scene, HUD, ChatPanel) |
| [config.ts](../apps/client/src/config.ts) | 114 | All client visual/gameplay constants (movement, camera, creature geometry, lighting) |

### Networking

| File | Lines | Summary |
|------|------:|---------|
| [networking/socket.ts](../apps/client/src/networking/socket.ts) | 43 | Typed Socket.io singleton with `connect`/`disconnect` lifecycle |
| [networking/NetworkSync.tsx](../apps/client/src/networking/NetworkSync.tsx) | 42 | Subscribes to playerStore, emits throttled `player:move` (~10Hz) |

### Stores (Zustand)

| File | Lines | Summary |
|------|------:|---------|
| [stores/playerStore.ts](../apps/client/src/stores/playerStore.ts) | 49 | Local player: position, target, isMoving, creatureType, name |
| [stores/roomStore.ts](../apps/client/src/stores/roomStore.ts) | 180 | Room state + Socket.io listeners: join/leave flow, player sync |
| [stores/chatStore.ts](../apps/client/src/stores/chatStore.ts) | 117 | Chat messages, bubble lifecycle (setTimeout-based), unread count |

### 3D Scene

| File | Lines | Summary |
|------|------:|---------|
| [scene/IsometricScene.tsx](../apps/client/src/scene/IsometricScene.tsx) | 33 | R3F `<Canvas>` composing all 3D elements |
| [scene/CameraRig.tsx](../apps/client/src/scene/CameraRig.tsx) | 52 | Orthographic camera with smooth follow via `useFrame` |
| [scene/Ground.tsx](../apps/client/src/scene/Ground.tsx) | 47 | Invisible click plane + drei `<Grid>` for visual |
| [scene/Lighting.tsx](../apps/client/src/scene/Lighting.tsx) | 39 | Ambient + 2 directional lights (warm key, cool fill) |

### Creatures

| File | Lines | Summary |
|------|------:|---------|
| [creatures/Creature.tsx](../apps/client/src/creatures/Creature.tsx) | 95 | Local player: click-to-move interpolation, idle bob, shadow |
| [creatures/CreatureModel.tsx](../apps/client/src/creatures/CreatureModel.tsx) | 71 | Shared mesh: capsule body, cone ears, sphere eyes (forwardRef) |
| [creatures/RemotePlayers.tsx](../apps/client/src/creatures/RemotePlayers.tsx) | 29 | Maps `players` record to `<RemoteCreature>` instances |
| [creatures/RemoteCreature.tsx](../apps/client/src/creatures/RemoteCreature.tsx) | 97 | Remote player: network position lerp, rotation, idle bob |
| [creatures/ChatBubble.tsx](../apps/client/src/creatures/ChatBubble.tsx) | 35 | drei `<Html>` overlay above creature — shows latest message |

### UI

| File | Lines | Summary |
|------|------:|---------|
| [ui/ChatPanel.tsx](../apps/client/src/ui/ChatPanel.tsx) | 141 | Collapsible chat panel: message list, input, unread badge, Escape to close |

### Utilities

| File | Lines | Summary |
|------|------:|---------|
| [utils/math.ts](../apps/client/src/utils/math.ts) | 16 | `lerpAngle` — shortest-path angle interpolation |

### Dependency Graph

```
main.tsx → App.tsx
              ├── roomStore ← socket, playerStore, chatStore
              ├── IsometricScene
              │     ├── CameraRig ← playerStore, config
              │     ├── Ground ← playerStore, config
              │     ├── Lighting ← config
              │     ├── Creature ← playerStore, roomStore, CreatureModel, ChatBubble, config, math
              │     ├── RemotePlayers ← roomStore
              │     │     └── RemoteCreature ← roomStore, CreatureModel, ChatBubble, config, math
              │     └── NetworkSync ← playerStore, socket
              └── ChatPanel ← chatStore, roomStore
```

---

## Test Files (11 files, ~19 new + 78 pre-existing = 100 unique tests)

| File | Tests | What it covers |
|------|------:|----------------|
| `Packages/shared/src/constants/config.test.ts` | 4 | Constants are positive, reasonable values |
| `Packages/shared/src/constants/creatures.test.ts` | 3 | DEFAULT_CREATURE exists, all creatures have required fields |
| `Packages/shared/src/constants/rooms.test.ts` | 2 | DEFAULT_ROOM exists, all rooms have required fields |
| `Packages/server/src/socket/validation.test.ts` | 24 | isFiniteNumber, clamp, stripControlChars, sanitizePosition, createRateLimiter |
| `Packages/server/src/rooms/Room.test.ts` | 19 | add/remove/get player, capacity, getState, getInfo |
| `Packages/server/src/rooms/RoomManager.test.ts` | 12 | Init, getRoom, listRooms, joinRoom, leaveRoom |
| `Packages/server/src/socket/chatHandler.test.ts` | 13 | sanitizeChatContent (8 cases), chat history ring buffer (5 cases) |
| `Packages/server/src/socket/profanityFilter.test.ts` | 9 | Replacement, case insensitivity, partial words, punctuation |
| `apps/client/src/utils/math.test.ts` | 5 | lerpAngle boundary behavior |
| `apps/client/src/stores/playerStore.test.ts` | 7 | Store actions: setTarget, setPosition, reset |
| `apps/client/src/config.test.ts` | 2 | CREATURE_COLORS completeness and hex format |
