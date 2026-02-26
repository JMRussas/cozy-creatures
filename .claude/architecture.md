# Architecture

## System Overview

```
Browser (React + R3F)         Server (Express + Socket.io)
┌─────────────────────┐      ┌──────────────────────┐
│ App.tsx              │      │ index.ts             │
│ ├── JoinScreen       │      │ ├── connectionHandler│
│ └── IsometricScene   │◄────►│ ├── chatHandler      │
│     ├── CameraRig    │ws    │ ├── RoomManager      │
│     ├── Ground       │      │ │   └── Room[]       │
│     ├── Creature     │      │ └── validation       │
│     ├── RemotePlayers│      └──────────────────────┘
│     └── NetworkSync  │
│                      │
│ Stores:              │      Shared (@cozy/shared):
│ ├── playerStore      │      ├── types/ (Player, ChatMessage, Events)
│ ├── roomStore        │      └── constants/ (config, creatures, rooms)
│ └── chatStore        │
└─────────────────────┘
```

## State Machines

### Connection State
```
idle -> joining -> joined
 ^        |          |
 +- error +          |
 +------ leave ------+
```

### Creature Movement
```
Idle <-> Walking (click-to-move)
  |        |
  v        v
Bobbing (idle animation, always active)
```

## Data Flow: Player Join

```
User submits join form
  -> roomStore.join(name, creature, roomId)
  -> connectSocket()
  -> socket.emit("player:join", data, callback)
  -> Server: connectionHandler validates, creates Player
  -> roomManager.joinRoom() adds to Room
  -> callback({ success: true, playerId })
  -> socket.emit("room:state", fullState) to joining player
  -> socket.to(room).emit("player:joined", player) to others
  -> sendChatHistory(socket, roomId) sends recent messages
```

## Data Flow: Chat Message

```
User types in ChatPanel
  -> chatStore.sendMessage(content)
  -> socket.emit("chat:message", { content })
  -> Server: chatHandler validates, sanitizes, filters profanity
  -> addToHistory(roomId, message) — ring buffer, max 50
  -> io.to(roomId).emit("chat:message", message) to ALL in room
  -> Client: chatStore listener appends to messages[]
  -> ChatPanel renders in message list
  -> addBubble(senderId, content) — shows above creature
  -> setTimeout removes bubble after 5 seconds
```

## Data Flow: Position Sync

```
Player clicks ground
  -> playerStore.setTarget(x, z), setIsMoving(true)
  -> Creature.useFrame() lerps toward target each frame
  -> playerStore.setPosition() updates current position
  -> NetworkSync subscribes to playerStore
  -> Throttled (100ms) socket.emit("player:move", {position})
  -> Server: connectionHandler rate-limits, sanitizes position
  -> room.updatePlayerPosition()
  -> socket.to(room).emit("player:moved", {id, position})
  -> Client: roomStore updates players[id].position
  -> RemoteCreature.useFrame() lerps toward network position
```

## Server Event Handlers

| Handler | File | Events |
|---------|------|--------|
| connectionHandler | socket/connectionHandler.ts | player:join, player:move, player:leave, room:list, disconnect |
| chatHandler | socket/chatHandler.ts | chat:message |

Both register via `io.on("connection")`. connectionHandler calls chatHandler's `sendChatHistory()` on join and `cleanupChat()` on disconnect.

## Validation Pipeline

All server inputs go through validation (socket/validation.ts):

| Function | Purpose |
|----------|---------|
| `stripControlChars(s)` | Remove ASCII control chars, zero-width spaces, bidi overrides, BOM |
| `sanitizePosition(raw)` | Clamp to [POSITION_MIN, POSITION_MAX], default 0 |
| `createRateLimiter(ms)` | Per-key throttle with sweep for cleanup |
| `filterProfanity(text)` | Replace blocked words with *** (profanityFilter.ts) |

## Client Stores

| Store | State | Responsibilities |
|-------|-------|------------------|
| playerStore | position, target, isMoving, name, creature | Local movement, animation state |
| roomStore | roomId, players, localPlayerId, connection | Socket.io listeners, join/leave flow |
| chatStore | messages, bubbles, unreadCount, isPanelOpen | Chat message history, bubble lifecycle |

## Dependency Map

| File | Role | Depends On | Used By |
|------|------|------------|---------|
| **Shared** | | | |
| types/player.ts | Player, Position types | creatures, rooms | All |
| types/chat.ts | ChatMessage type | rooms | chatStore, chatHandler |
| types/events.ts | Socket event interfaces | All types | socket.ts, handlers |
| constants/config.ts | Shared limits/timing | nothing | Client + server config |
| **Server** | | | |
| index.ts | Express + Socket.io setup | config, connectionHandler, chatHandler, RoomManager | Entry point |
| config.ts | Env-var-driven config | @cozy/shared | handlers |
| connectionHandler.ts | Join/move/leave/list events | validation, chatHandler, RoomManager, config | index.ts |
| chatHandler.ts | Chat message handling + history | validation, profanityFilter, config | index.ts, connectionHandler |
| profanityFilter.ts | Word-list filter | nothing | chatHandler |
| validation.ts | Input sanitization + rate limiter | @cozy/shared | connectionHandler, chatHandler |
| Room.ts | Player management per room | @cozy/shared | RoomManager |
| RoomManager.ts | All room instances | Room, @cozy/shared | connectionHandler |
| **Client** | | | |
| App.tsx | Join screen + scene container | roomStore, IsometricScene, ChatPanel | main.tsx |
| IsometricScene.tsx | R3F Canvas composition | CameraRig, Ground, Lighting, Creature, RemotePlayers, NetworkSync | App.tsx |
| Creature.tsx | Local player movement | playerStore, roomStore, ChatBubble | IsometricScene |
| RemoteCreature.tsx | Remote player interpolation | roomStore, ChatBubble | RemotePlayers |
| ChatBubble.tsx | drei Html bubble overlay | chatStore | Creature, RemoteCreature |
| ChatPanel.tsx | Chat UI panel | chatStore, roomStore | App.tsx |
| NetworkSync.tsx | Throttled position emission | playerStore, socket | IsometricScene |
| chatStore.ts | Chat messages + bubbles | socket, @cozy/shared | ChatPanel, ChatBubble, roomStore |
| roomStore.ts | Room state + Socket.io listeners | socket, playerStore, chatStore | App, RemotePlayers |
| playerStore.ts | Local player state | nothing | Creature, NetworkSync, roomStore |
| socket.ts | Typed Socket.io singleton | @cozy/shared | roomStore, chatStore, NetworkSync |

## Gotchas & Pitfalls

- **Shared package dist:** Server resolves `@cozy/shared` from `dist/`. After adding new shared constants, run `pnpm --filter @cozy/shared build` before server tests will pick them up.
- **Socket.io multiple connection listeners:** Both connectionHandler and chatHandler register `io.on("connection")`. Socket.io supports this — both callbacks fire for each connection.
- **Chat bubbles in R3F:** drei's `Html` component renders DOM inside a portal. TailwindCSS classes work because the stylesheet is global, but `pointer-events: none` is needed to prevent click interception.
- **Bubble timers outside store:** `setTimeout` handles for chat bubbles live in module scope (not Zustand state) to enable proper `clearTimeout` cleanup.
