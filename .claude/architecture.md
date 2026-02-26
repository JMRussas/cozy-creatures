# Architecture

## System Overview

```
Browser (React + R3F)             Server (Express + Socket.io)
┌──────────────────────────┐     ┌───────────────────────────┐
│ App.tsx                   │     │ index.ts                  │
│ ├── JoinScreen            │     │ ├── connectionHandler     │
│ └── InRoomView            │     │ ├── chatHandler           │
│     ├── useVoice (LiveKit)│◄───►│ ├── voiceHandler          │
│     ├── IsometricScene    │ws   │ ├── voiceRouter (REST)    │
│     │   ├── CameraRig     │     │ ├── RoomManager           │
│     │   ├── Ground        │     │ │   └── Room[]            │
│     │   ├── Creature      │     │ ├── db/ (SQLite)          │
│     │   ├── RemotePlayers │     │ │   └── playerQueries     │
│     │   ├── NetworkSync   │     │ └── validation            │
│     │   └── SpatialAudio  │     └───────────────────────────┘
│     ├── ChatPanel         │     LiveKit SFU (Docker):
│     └── VoiceControls     │     ┌───────────────────────────┐
│                           │     │ livekit-server (WebRTC)   │
│ Stores:                   │◄───►│ :7880 WS, :7881 TCP,      │
│ ├── playerStore           │     │ :7882 UDP                 │
│ ├── roomStore             │     └───────────────────────────┘
│ ├── chatStore             │     Shared (@cozy/shared):
│ └── voiceStore            │     ├── types/ (Player, Chat, Voice, Events)
└──────────────────────────┘     └── constants/ (config, creatures, rooms)
```

## State Machines

### Connection State
```
idle -> joining -> joined
 ^        |          |
 +- error +          |
 +------ leave ------+
```

### Voice Connection State
```
disconnected -> connecting -> connected
     ^             |              |
     +--- error ---+              |
     +-------- disconnect --------+
     +-------- room leave --------+
```

### Creature Animation
```
idle <-> walk (click-to-move, crossfade 0.3s)
Local: driven by playerStore.isMoving
Remote: derived from position deltas (hysteresis: 2 frames moving, 3 frames still)
Available clips: idle, walk, run, eat, rest (from Cute Zoo 4 glTF)
```

## Data Flow: Player Join

```
User submits join form
  -> roomStore.join(name, creature, roomId)
  -> connectSocket()
  -> socket.emit("player:join", data, callback)
  -> Server: connectionHandler validates, creates Player
  -> findPlayerByName() — lookup in SQLite, create or update
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

## Data Flow: Voice Chat

```
Player joins room
  -> useVoice hook fires (roomId set)
  -> POST /api/voice/token { playerId, playerName, roomId }
  -> Server: voice.ts creates AccessToken with room grant (livekit-server-sdk)
  -> Returns { token: "JWT...", url: "ws://localhost:7880" }
  -> useVoice connects to LiveKit Room with token
  -> LiveKit SFU handles WebRTC media routing

Player unmutes mic
  -> voiceStore.toggleMute() → muted: false
  -> useVoice useEffect syncs to LiveKit: localParticipant.setMicrophoneEnabled(true)
  -> Browser prompts for mic permission (first time only)
  -> LiveKit publishes audio track to SFU
  -> SFU forwards to other participants

Speaking detection
  -> LiveKit ActiveSpeakersChanged event fires
  -> useVoice updates voiceStore.speaking / remoteSpeaking[id]
  -> socket.emit("voice:state", { muted, deafened, speaking })
  -> Server broadcasts to room: io.to(roomId).emit("voice:state", { id, ... })
  -> Remote clients update voiceStore.remoteSpeaking
  -> SpeakingIndicator renders green torus above creature

Spatial audio (when enabled)
  -> SpatialAudioManager runs in useFrame loop
  -> Updates AudioListener position from playerStore
  -> Per remote participant: creates PannerNode (HRTF, inverse distance)
  -> Routes LiveKit audio MediaStream through PannerNode
  -> Volume scales between VOICE_SPATIAL_MIN_DISTANCE (full) and MAX_DISTANCE (silent)
```

## Server Event Handlers

| Handler | File | Events |
|---------|------|--------|
| connectionHandler | socket/connectionHandler.ts | player:join, player:move, player:leave, room:list, disconnect |
| chatHandler | socket/chatHandler.ts | chat:message |
| voiceHandler | socket/voiceHandler.ts | voice:state |

All three register via `io.on("connection")`. connectionHandler calls chatHandler's `sendChatHistory()` on join, and both `cleanupChat()` and `cleanupVoice()` on disconnect.

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
| roomStore | roomId, players, localPlayerId, connection | Socket.io listeners, join/leave flow, voice reset on leave |
| chatStore | messages, bubbles, unreadCount, isPanelOpen | Chat message history, bubble lifecycle |
| voiceStore | muted, deafened, speaking, connectionState, remoteSpeaking, inputMode, spatialEnabled, device/volume | Voice UI state, Socket.io voice:state listener, broadcast helper |

## Dependency Map

| File | Role | Depends On | Used By |
|------|------|------------|---------|
| **Shared** | | | |
| types/player.ts | Player, Position types | creatures, rooms | All |
| types/chat.ts | ChatMessage type | rooms | chatStore, chatHandler |
| types/voice.ts | VoiceState, VoiceTokenRequest/Response | nothing | voiceStore, voiceHandler, events.ts |
| types/events.ts | Socket event interfaces | All types | socket.ts, handlers |
| constants/config.ts | Shared limits/timing/voice | nothing | Client + server config |
| **Server** | | | |
| index.ts | Express + Socket.io setup | config, connectionHandler, chatHandler, voiceHandler, voiceRouter, RoomManager, db/database | Entry point |
| config.ts | Env-var-driven config | @cozy/shared | handlers, voiceRouter, db/database |
| api/voice.ts | POST /api/voice/token | config, livekit-server-sdk | index.ts |
| connectionHandler.ts | Join/move/leave/list events | validation, chatHandler, voiceHandler, RoomManager, config, db/playerQueries | index.ts |
| chatHandler.ts | Chat message handling + history | validation, profanityFilter, config | index.ts, connectionHandler |
| voiceHandler.ts | Voice state broadcast | validation, config | index.ts, connectionHandler |
| profanityFilter.ts | Word-list filter | nothing | chatHandler |
| validation.ts | Input sanitization + rate limiter | @cozy/shared | connectionHandler, chatHandler, voiceHandler |
| Room.ts | Player management per room | @cozy/shared | RoomManager |
| RoomManager.ts | All room instances | Room, @cozy/shared | connectionHandler |
| db/database.ts | SQLite singleton + schema | better-sqlite3, config | db/playerQueries, index.ts |
| db/playerQueries.ts | Player CRUD (find, create, update) | db/database, @cozy/shared | connectionHandler |
| **Client** | | | |
| App.tsx | Join screen + InRoomView, localStorage persistence | roomStore, IsometricScene, ChatPanel, VoiceControls, CreaturePicker, CreaturePreview, useVoice | main.tsx |
| IsometricScene.tsx | R3F Canvas composition | CameraRig, Ground, Lighting, Creature, RemotePlayers, NetworkSync, SpatialAudioManager | App.tsx |
| Creature.tsx | Local player: click-to-move, animation drive | playerStore, roomStore, CreatureModel, CreatureFallback, ChatBubble, SpeakingIndicator, AudioRangeRing | IsometricScene |
| CreatureModel.tsx | glTF model loader + imperative animation API | useGLTF, useAnimations, SkeletonUtils, @cozy/shared | Creature, RemoteCreature |
| CreatureFallback.tsx | Suspense fallback (procedural mesh) | config, @cozy/shared | Creature, RemoteCreature |
| RemoteCreature.tsx | Remote player: interpolation, hysteresis animation | roomStore, CreatureModel, CreatureFallback, ChatBubble, SpeakingIndicator | RemotePlayers |
| ChatBubble.tsx | drei Html bubble overlay | chatStore | Creature, RemoteCreature |
| SpeakingIndicator.tsx | Pulsing torus above creature | voiceStore | Creature, RemoteCreature |
| AudioRangeRing.tsx | Spatial range ring visual | voiceStore, @cozy/shared | Creature |
| ChatPanel.tsx | Chat UI panel | chatStore, roomStore, voiceStore | App.tsx |
| CreaturePicker.tsx | Visual creature selection grid | @cozy/shared, config | App.tsx |
| CreaturePreview.tsx | 3D turntable preview of selected creature | CreatureModel, CreatureFallback, @react-three/drei | App.tsx |
| VoiceControls.tsx | Voice HUD bar | voiceStore | App.tsx (InRoomView) |
| VoiceSettings.tsx | Voice settings panel | voiceStore | VoiceControls |
| NetworkSync.tsx | Throttled position emission | playerStore, socket | IsometricScene |
| useVoice.ts | LiveKit Room lifecycle | voiceStore, roomStore, playerStore, livekit-client | App.tsx (InRoomView) |
| SpatialAudioManager.tsx | Web Audio spatial positioning | voiceStore, playerStore, roomStore, useVoice | IsometricScene |
| chatStore.ts | Chat messages + bubbles | socket, @cozy/shared | ChatPanel, ChatBubble, roomStore |
| voiceStore.ts | Voice state + socket listener | socket, @cozy/shared | useVoice, VoiceControls, VoiceSettings, SpeakingIndicator, SpatialAudioManager, ChatPanel |
| roomStore.ts | Room state + Socket.io listeners | socket, playerStore, chatStore, voiceStore | App, RemotePlayers |
| playerStore.ts | Local player state | nothing | Creature, NetworkSync, roomStore, SpatialAudioManager |
| socket.ts | Typed Socket.io singleton | @cozy/shared | roomStore, chatStore, voiceStore, NetworkSync |

## Gotchas & Pitfalls

- **Shared package dist:** Server resolves `@cozy/shared` from `dist/`. After adding new shared constants, run `pnpm --filter @cozy/shared build` before server tests will pick them up.
- **Socket.io multiple connection listeners:** Both connectionHandler and chatHandler register `io.on("connection")`. Socket.io supports this — both callbacks fire for each connection.
- **Chat bubbles in R3F:** drei's `Html` component renders DOM inside a portal. TailwindCSS classes work because the stylesheet is global, but `pointer-events: none` is needed to prevent click interception.
- **Bubble timers outside store:** `setTimeout` handles for chat bubbles live in module scope (not Zustand state) to enable proper `clearTimeout` cleanup.
- **LiveKit Docker on Windows:** Docker Desktop must be running. UDP port 7882 needed for WebRTC media; TCP 7881 as fallback. Dev key pair: `devkey:secret`.
- **AudioContext autoplay:** Spatial audio toggle is user-initiated (button click), satisfying browser autoplay policy. LiveKit handles its own AudioContext separately.
- **Mic permission:** Browser prompts on first unmute. Default `muted: true` means no prompt on join — only when user explicitly unmutes.
- **voiceRouter type annotation:** Explicit `IRouter` type needed on `voiceRouter` export to avoid TS2742 (inferred type portability) with pnpm workspaces.
- **RemoteTrackPublication vs RemoteTrack:** `setEnabled()` lives on `RemoteTrackPublication`, not `RemoteTrack`. Used for deafen functionality.
- **Conditional hooks (InRoomView):** `useVoice()` extracted into `InRoomView` component to avoid calling hooks conditionally in `App.tsx`.
- **Voice token auth:** `POST /api/voice/token` verifies player is in the room via `roomManager.getRoom()` + `room.getPlayer()`. Without this, anyone could forge tokens for any room.
- **LiveKit credentials in production:** `config.ts` throws on startup if `LIVEKIT_API_KEY`/`LIVEKIT_API_SECRET` are unset when `NODE_ENV=production`. Dev defaults (`devkey:secret`) only apply in development.
- **spatialSources is a useRef:** The `SpatialSource` map lives in a `useRef` (not module scope) to prevent state leaking between component mounts. Helper functions accept the map as a parameter.
- **Cancelled flag pattern:** `useVoice` and `VoiceSettings` mic meter use `let cancelled = false` in async effects. Every `await` is followed by `if (cancelled) return`. Cleanup sets `cancelled = true` before any other teardown.
- **PTT guard incomplete:** H1 fix guards on `INPUT`/`TEXTAREA`/`SELECT` tagNames, but does not cover `contenteditable` elements. TODO: extend the guard when rich-text or contenteditable inputs are added (e.g., emoji picker, rich chat).
- **SkeletonUtils.clone() required:** `scene.clone()` does NOT deep-clone skeleton bindings — animations break on duplicate instances. Always use `SkeletonUtils.clone()` from `three/examples/jsm/utils/SkeletonUtils.js`.
- **better-sqlite3 native addon:** Must be in `onlyBuiltDependencies` in `pnpm-workspace.yaml` (like esbuild). Build requires C++ toolchain on Windows (node-gyp).
- **SQLite in-memory for tests:** DB tests use `getDb(":memory:")` to avoid disk I/O. `closeDb()` in `afterEach` resets the singleton.
- **Creature model preloading:** `useGLTF.preload()` calls at bottom of CreatureModel.tsx run at import time, not in a component lifecycle.
