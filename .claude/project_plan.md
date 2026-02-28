# Cozy Creatures — Development Plan

> Web-based social app where users are cute low-poly creature avatars
> hanging out in isometric themed spaces. Collectible skins (LoL/TFT model).
> Female audience focus: cozy aesthetic, expressive identity, social-first.

## Tech Stack

| Layer | Tech | Version |
|-------|------|---------|
| 3D Rendering | React Three Fiber + drei | 9.5.0 |
| UI Framework | React + TailwindCSS | 19.0 |
| Build Tool | Vite | 6.0 |
| State | Zustand | 5.0 |
| Real-time | Socket.io | 4.x |
| Voice Chat | LiveKit (self-hosted SFU) | latest |
| Backend | Node.js + Express | (TypeScript) |
| Database | SQLite (→ Postgres later) | better-sqlite3 |
| 3D Assets | glTF format | loaded via drei useGLTF |
| Language | TypeScript throughout | 5.7 |
| Monorepo | pnpm workspaces | latest |

## Monorepo Structure

```
cozy-creatures/
├── pnpm-workspace.yaml
├── package.json                    # root scripts (pnpm dev, build, test)
├── tsconfig.base.json              # shared TS config
├── docker-compose.yml              # LiveKit SFU (voice chat)
├── vitest.workspace.ts             # test workspace (server + shared + client)
│
├── apps/
│   └── client/                     # React + Vite + R3F (port 5173)
│       ├── vite.config.ts          # proxy /api + /socket.io → server
│       └── src/
│           ├── main.tsx
│           ├── App.tsx             # Join form + InRoomView
│           ├── config.ts           # Client visual/gameplay constants
│           ├── scene/              # Three.js scene, camera, lighting
│           │   ├── IsometricScene.tsx
│           │   ├── CameraRig.tsx
│           │   ├── Ground.tsx
│           │   └── Lighting.tsx
│           ├── creatures/          # glTF models, animations, shaders, accessories, particles
│           │   ├── Creature.tsx              # Local player creature
│           │   ├── CreatureModel.tsx         # glTF loader + animation + skin rendering
│           │   ├── CreatureFallback.tsx      # Procedural fallback (Suspense)
│           │   ├── CreatureShadow.tsx        # Shared shadow circle
│           │   ├── RemotePlayers.tsx         # Maps players → RemoteCreature
│           │   ├── RemoteCreature.tsx        # Remote player with interpolation
│           │   ├── overlays/
│           │   │   ├── ChatBubble.tsx        # drei Html overlay
│           │   │   ├── SpeakingIndicator.tsx # Pulsing torus above head
│           │   │   └── AudioRangeRing.tsx    # Spatial audio range ring
│           │   ├── shaders/
│           │   │   └── hslShader.ts          # HSL color-shift via onBeforeCompile
│           │   ├── accessories/
│           │   │   ├── boneUtils.ts          # Bone search utilities
│           │   │   ├── accessoryFactories.ts # 10 procedural accessory types
│           │   │   └── AccessoryAttacher.tsx # Bone attachment component
│           │   └── effects/
│           │       └── ParticleEffect.tsx    # GPU particles (4 effect types)
│           ├── ui/                 # React UI components (feature subfolders)
│           │   ├── chat/
│           │   │   └── ChatPanel.tsx         # Side panel + message list
│           │   ├── voice/
│           │   │   ├── VoiceControls.tsx     # Mic/deafen toggles
│           │   │   └── VoiceSettings.tsx     # Mic selector, volume, PTT
│           │   ├── skins/
│           │   │   ├── SkinShop.tsx          # Full-screen skin browser
│           │   │   ├── SkinInventory.tsx     # Owned skins grid
│           │   │   ├── SkinPreview.tsx       # 3D skin turntable preview
│           │   │   └── RarityBadge.tsx       # Rarity pill badge
│           │   └── creatures/
│           │       ├── CreaturePicker.tsx    # 3x2 creature selection grid
│           │       └── CreaturePreview.tsx   # 3D turntable preview
│           ├── networking/
│           │   ├── socket.ts                 # Typed Socket.io singleton
│           │   ├── NetworkSync.tsx           # Throttled position sync (~10Hz)
│           │   ├── useVoice.ts               # LiveKit Room lifecycle
│           │   └── SpatialAudioManager.tsx   # Web Audio PannerNode spatial
│           ├── stores/             # Zustand stores
│           │   ├── playerStore.ts            # Local player position/state
│           │   ├── roomStore.ts              # Room state + socket listeners
│           │   ├── chatStore.ts              # Messages + bubble lifecycle
│           │   ├── voiceStore.ts             # Voice state + LiveKit sync
│           │   └── skinStore.ts              # Inventory, equip, REST fetch
│           ├── input/
│           │   └── useMovement.ts
│           └── utils/
│               └── math.ts                   # lerpAngle
│
├── Packages/
│   ├── server/                     # Express + Socket.io (port 3001)
│   │   └── src/
│   │       ├── index.ts            # Server entry + middleware
│   │       ├── config.ts           # Env-var-driven config
│   │       ├── socket/
│   │       │   ├── connectionHandler.ts  # join/move/leave/equip-skin/disconnect
│   │       │   ├── chatHandler.ts        # chat:message, ring buffer history
│   │       │   ├── voiceHandler.ts       # voice:state broadcast
│   │       │   ├── validation.ts         # sanitize, rate limit, clamp
│   │       │   ├── profanityFilter.ts    # Word-list filter
│   │       │   └── types.ts              # TypedServer, TypedSocket
│   │       ├── rooms/
│   │       │   ├── RoomManager.ts
│   │       │   └── Room.ts
│   │       ├── db/
│   │       │   ├── database.ts           # SQLite singleton (better-sqlite3, WAL)
│   │       │   ├── playerQueries.ts      # Player CRUD + equipped skin
│   │       │   └── inventoryQueries.ts   # Skin inventory CRUD
│   │       ├── api/
│   │       │   ├── voice.ts              # POST /api/voice/token (LiveKit JWT)
│   │       │   └── skins.ts             # GET/POST /api/skins (catalog, inventory, equip)
│   │       └── auth/               # Auth (simple → OAuth)
│   │
│   └── shared/                     # @cozy/shared — types + constants
│       └── src/
│           ├── index.ts            # Barrel re-export
│           ├── types/
│           │   ├── player.ts       # Player, Position, PlayerProfile
│           │   ├── creature.ts     # CreatureDefinition
│           │   ├── room.ts         # RoomBase, RoomConfig, RoomState
│           │   ├── chat.ts         # ChatMessage
│           │   ├── voice.ts        # VoiceState, VoiceTokenRequest/Response
│           │   ├── skin.ts         # SkinDefinition, SkinSet, SkinRarity, InventoryItem
│           │   └── events.ts       # ClientToServerEvents, ServerToClientEvents, SocketData
│           └── constants/
│               ├── config.ts       # Numeric limits, rate limits, voice constants
│               ├── creatures.ts    # 6 creatures (otter, red-panda, sloth, chipmunk, possum, pangolin)
│               ├── rooms.ts        # 3 rooms (cozy-cafe, rooftop-garden, starlight-lounge)
│               └── skins.ts        # 30 skins, 4 sets, 4 rarities
│
├── tools/
│   └── convert_creatures.py        # Blender FBX→glTF batch converter
│
└── apps/client/public/assets/      # Static creature models (served by Vite)
    └── creatures/
        ├── otter/model.glb
        ├── red-panda/model.glb
        ├── sloth/model.glb
        ├── chipmunk/model.glb
        ├── possum/model.glb
        └── pangolin/model.glb
```

---

## STAGE 0 — Project Foundation ✅
> **Goal:** Monorepo running, both client and server start with one command.

### Tasks
- [x] Initialize pnpm monorepo with workspace config
- [x] Scaffold `apps/client` with Vite + React 19 + TypeScript
- [x] Scaffold `Packages/server` with Express + TypeScript + tsx
- [x] Scaffold `Packages/shared` with TypeScript types
- [x] Configure path aliases so client and server import from `@cozy/shared`
- [x] Root `pnpm dev` starts both client (5173) and server (3001) in parallel
- [x] Add `.gitignore`, `CLAUDE.md`, `.claude/` docs
- [x] Vite proxy: `/api` and `/socket.io` → server

### Deliverable
`pnpm dev` opens a browser with a blank React page. Server logs "listening on 3001".

---

## STAGE 1 — Isometric Scene + Placeholder Creature
> **Goal:** A 3D isometric world visible in the browser with a creature you can move.
> **Duration estimate:** 1-2 days

### Tasks
- [x] Set up R3F `<Canvas>` with `OrthographicCamera` (isometric angle)
- [x] Create ground plane (flat color or simple grid)
- [x] Add soft ambient + directional lighting (warm, cozy tone)
- [x] Load a placeholder creature (simple box or low-poly model)
- [x] Implement click-to-move on the ground plane (raycasting)
- [x] Smooth creature movement (lerp toward target position)
- [x] Basic idle animation (gentle bob or breathing)
- [x] Zustand `playerStore` for local player position/state
- [x] Camera follows player with smooth damping

### Deliverable
Open browser → see an isometric ground with a little creature. Click anywhere → creature walks there.

### Parallelism
**This stage and Stage 2 are fully independent. Work them in parallel.**

---

## STAGE 2 — Multiplayer Server Core ✅
> **Goal:** Multiple browser tabs show each other's creatures moving in real time.
> **Duration estimate:** 1-2 days

### Tasks
- [x] Express server with Socket.io attached
- [x] Define shared event types: `playerJoin`, `playerMove`, `playerLeave`
- [x] Server-side `RoomManager`: create room, join, leave, broadcast
- [x] Client `socket.ts`: connect, emit movement, listen for other players
- [x] `roomStore` tracks all players in the current room
- [x] Render other players' creatures (position interpolation)
- [x] Handle disconnect/reconnect gracefully
- [x] Rate-limit position updates (10-15Hz, not every frame)

### Deliverable
Open 2-3 browser tabs → each sees the others' creatures. Move one → others see it move.

### Parallelism
**Independent from Stage 1 (scene rendering). Can be built with console logging first, then connected to the scene.**

---

## STAGE 3 — Chat System ✅
> **Goal:** Text chat in rooms with chat bubbles over creatures.

### Tasks
- [x] Define shared chat events: `chat:message`, `chat:history`
- [x] Server `chatHandler`: receive message, broadcast to room, in-memory ring buffer history (50 msgs/room)
- [x] Client `ChatPanel.tsx`: message list, input field, send button, Escape to close
- [x] `chatStore` with message history, bubble lifecycle (setTimeout-based), unread count
- [x] Chat bubbles above creatures (drei `Html` component in creature groups)
- [x] Chat bubble auto-fade after configurable duration (`CHAT_BUBBLE_DURATION_MS`)
- [x] Profanity filter (server-side, word-list replacement)
- [x] Message length limit (`MAX_CHAT_MESSAGE` from shared config)
- [x] Scroll-to-bottom behavior, unread indicator

### Deliverable
Type a message → it appears in the chat panel AND as a bubble over your creature. Other players see it.

### Parallelism
- **Chat UI** (ChatPanel, bubbles) can be built independently of the **server chat handler**
- **Profanity filter** is independent of both

---

## STAGE 3.5 — Voice Chat ✅
> **Goal:** Players can talk to each other in rooms via voice. Spatial audio mode available.

### Tech: LiveKit (Self-Hosted SFU)

LiveKit is an open-source WebRTC SFU that handles media routing, encoding, and room management.
The client uses `livekit-client` SDK; the server generates access tokens via `livekit-server-sdk`.
LiveKit runs as a Docker Compose service alongside the Express server.

### Tasks

#### 3.5A — LiveKit Infrastructure
- [x] Add LiveKit as a Docker Compose service (port 7880 WS, 7881 TCP, 7882 UDP)
- [x] Configure LiveKit server (API key/secret in env vars, dev key pair: `devkey:secret`)
- [x] Add `livekit-server-sdk` to `@cozy/server` for token generation
- [x] REST endpoint: `POST /api/voice/token` — generates a LiveKit access token scoped to the player's current room
- [x] Token includes player ID and room name as metadata

#### 3.5B — Client Voice Connection
- [x] Add `livekit-client` to `@cozy/client`
- [x] `voiceStore` (Zustand): connection state, muted/deafened, speaking participants, spatial mode toggle
- [x] `useVoice.ts` hook: connect to LiveKit room, publish/unpublish audio track
- [x] On room join → fetch token from `/api/voice/token` → connect to LiveKit room
- [x] On room leave → disconnect from LiveKit room
- [x] Handle reconnection (LiveKit SDK handles most of this)

#### 3.5C — Voice UI
- [x] Mic toggle button (mute/unmute) in HUD — prominent, always visible
- [x] Deafen toggle (stop hearing others) via `RemoteTrackPublication.setEnabled()`
- [x] Speaking indicator on creatures (pulsing green torus above head — `SpeakingIndicator.tsx`)
- [x] Speaking indicator in chat panel (animated dots)
- [x] Push-to-talk option (configurable keybind, default: V)
- [x] Voice settings panel (`VoiceSettings.tsx`): input device selection, input volume, output volume
- [x] Visual feedback: mic level meter in settings

#### 3.5D — Spatial Audio
- [x] Default mode: room-wide (all participants at equal volume)
- [x] Spatial mode toggle in voice settings
- [x] When spatial enabled: Web Audio API `PannerNode` per remote participant (`SpatialAudioManager.tsx`)
- [x] Map creature world position → audio listener position (update via `useFrame`)
- [x] Configurable falloff: `VOICE_SPATIAL_MIN_DISTANCE`, `VOICE_SPATIAL_MAX_DISTANCE` in shared config
- [x] Players beyond max distance are silent; between min/max follows inverse distance (HRTF panning)
- [x] Visual indicator: `AudioRangeRing.tsx` — ring at spatial max distance (only visible to self, only in spatial mode)

### Shared Types (`@cozy/shared`)
- [ ] `VoiceState`: `{ muted: boolean, deafened: boolean, speaking: boolean, spatialEnabled: boolean }`
- [ ] `VOICE_SPATIAL_MIN_DISTANCE`, `VOICE_SPATIAL_MAX_DISTANCE` constants
- [ ] Voice-related Socket.io events: `voice:state` (broadcast mute/speaking status to other players)

### Deliverable
Join a room → click mic button → talk to other players. Toggle spatial audio → volume changes based on creature distance. Speaking indicators visible on active talkers.

### Parallelism
- **3.5A (infrastructure)** and **3.5C (UI mockup)** can start in parallel
- **3.5B (connection)** depends on 3.5A
- **3.5D (spatial audio)** depends on 3.5B
- **Speaking indicators** (part of 3.5C) depend on 3.5B for real data

---

## STAGE 4 — Creature System ✅
> **Goal:** Multiple creature types with proper models, animations, and selection.

### Tasks

#### 4A — Asset Pipeline
- [x] Sourced Cute Zoo 4 (SURIYUN) — 6 low-poly creature models with 5+ animation clips each
- [x] Creatures: otter, red-panda, sloth, chipmunk, possum, pangolin
- [x] Blender 4.4 batch converter (`tools/convert_creatures.py`): FBX → glTF with animations
- [x] Models placed in `apps/client/public/assets/creatures/<id>/model.glb`

#### 4B — Creature Rendering
- [x] `CreatureModel.tsx`: glTF loader via `useGLTF` + `SkeletonUtils.clone()` (not `scene.clone()`)
- [x] Imperative `setAnimation()` handle exposed via `useImperativeHandle`
- [x] Smooth animation crossfade (`ANIMATION_CROSSFADE_DURATION`)
- [x] `CreatureFallback.tsx`: procedural capsule mesh for Suspense fallback
- [x] `CreatureShadow.tsx`: shared shadow circle extracted from Creature + RemoteCreature

#### 4C — Creature Selection UI
- [x] `CreaturePicker.tsx`: 3x2 grid of creature cards with accent border on selection
- [x] `CreaturePreview.tsx`: small R3F Canvas with auto-rotating creature + targeted preload
- [x] Selection saved to localStorage (`cozy-creatures:creature`)
- [x] Creature type synced over network (included in `player:join` event)

#### 4D — Persistence
- [x] SQLite via better-sqlite3 (WAL mode) — `db/database.ts` singleton
- [x] `db/playerQueries.ts`: `findPlayerByName`, `createPlayer`, `updatePlayerOnJoin`
- [x] Name-based soft matching (pre-auth): returning players reuse their DB row

### Deliverable
Each player picks a creature type. Different players can be different creatures. All animate correctly. Creature choice persists across sessions.

### Parallelism
- **4A (asset pipeline)** ran parallel with code work
- **4B (rendering)** depended on at least 1 model from 4A
- **4C (UI)** depended on 4B
- **4D (persistence)** ran parallel with 4B/4C

---

## STAGE 5 — Skin & Collection System ✅
> **Goal:** Creatures have collectible skins with rarity tiers. Inventory and shop UI.

### Tasks

#### 5A — Shared Types & Constants
- [x] `types/skin.ts`: `SkinRarity`, `SkinColorShift`, `SkinAccessory`, `SkinParticleEffect`, `SkinDefinition`, `SkinSet`, `InventoryItem`, `RarityInfo`
- [x] `constants/skins.ts`: 30 skin definitions (5 per creature: 2 Common + 1 Rare + 1 Epic + 1 Legendary)
- [x] 4 themed sets: cozy-cafe, starlight, garden-party, frost-festival
- [x] 4 rarity tiers with color/glow metadata; `DEFAULT_SKIN_IDS` (auto-granted Commons)
- [x] Tests: all skins reference valid creatures/sets/rarities, colorShift bounds, particles only on legendary

#### 5B — HSL Shader System
- [x] `hslShader.ts`: `onBeforeCompile` GLSL injection — RGB→HSL→shift→RGB after `#include <map_fragment>`
- [x] Material cloning (glTF materials are shared), `customProgramCacheKey` for cache isolation
- [x] Uniforms stored on `material.userData.hslUniforms` for live updates
- [x] `CreatureModel.tsx`: applies `applyHSLShift()` to all `MeshStandardMaterial` instances when skin has `colorShift`

#### 5C — Accessory System
- [x] `boneUtils.ts`: `findBoneByPattern()` — case-insensitive bone search using Unity-style bone naming
- [x] `accessoryFactories.ts`: 10 procedural accessory types from Three.js primitives (top-hat, beret, crown, scarf, flower-crown, backpack, cape, nightcap, tiny-shield, rose)
- [x] `AccessoryAttacher.tsx`: imperatively attaches accessories to creature bones via `useEffect` with cleanup/disposal
- [x] `CreatureModel.tsx`: renders `AccessoryAttacher` when skin has accessories

#### 5D — Particle Effects (Legendary)
- [x] `ParticleEffect.tsx`: GPU particles via `Points` + custom `ShaderMaterial`, `AdditiveBlending`
- [x] 4 effect types: sparkle (random sphere), glow (orbiting ring), flame (upward turbulence), hearts (sinusoidal sway)
- [x] 32-48 particles per effect, updated per frame in `useFrame`
- [x] `CreatureModel.tsx`: renders `ParticleEffect` when skin has `particleEffect`

#### 5E — Backend (DB + API + Socket)
- [x] `player_inventory` SQLite table + `equipped_skin` column on players
- [x] `inventoryQueries.ts`: `getPlayerInventory`, `addToInventory`, `playerOwnsSkin`, `grantDefaultSkins` (idempotent)
- [x] `api/skins.ts`: `GET /api/skins` (catalog), `GET /api/skins/inventory/:playerId`, `POST /api/skins/equip`
- [x] `connectionHandler.ts`: `player:equip-skin` socket event with validation (ownership, creature match), `player:skin-changed` broadcast
- [x] `player:join`: grants default skins, loads equipped skin from DB, clears stale skin on creature type change

#### 5F — Client UI
- [x] `skinStore.ts`: Zustand store — inventory, equippedSkinId, equipSkin (socket + 5s timeout + connected guard), fetchInventory (REST)
- [x] `SkinShop.tsx`: full-screen modal with "My Skins" / "All Skins" tabs, set filter, rarity-sorted grid, 3D preview, Escape/backdrop close, ARIA
- [x] `SkinInventory.tsx`: owned skins grid filtered by creature type, equip/unequip, useMemo for derived collections
- [x] `SkinPreview.tsx`: R3F Canvas turntable with full skin (HSL + accessories + particles)
- [x] `RarityBadge.tsx`: rarity pill badge with color, legendary pulse (`motion-reduce:animate-none`)
- [x] `roomStore.ts`: `player:skin-changed` listener for real-time remote skin sync
- [x] `Creature.tsx` / `RemoteCreature.tsx`: pass skinId to `CreatureModel` with runtime `in SKINS` guard

### Deliverable
Players can browse skins, equip them, and see each other's skins in real time. Skins range from simple recolors (Common) to elaborate HSL shift + accessory + particle combos (Legendary). Inventory persists across sessions.

### Parallelism
- **5A** first (foundation types/constants)
- **5B + 5C + 5D + 5E** in parallel
- **5F** last (needs everything)

---

## STAGE 6 — Hangout Spaces ✅
> **Goal:** Multiple themed rooms players can browse and join.

### Tasks

#### 6A — Room System
- [x] Room browser: inline (join screen) + modal (in-game), live player counts via `room:player-count`
- [x] Join room → loads that room's 3D environment (`RoomEnvironment` theme router)
- [x] Room capacity limits (configurable per room via `maxPlayers`)
- [x] Player count shown in room browser (live via Socket.io)
- [x] Smooth transition between rooms (fade out → emit switch → reset → fade in)

#### 6B — Environment Art
- [x] 3 procedural 3D environments (all R3F primitives, no glTF):
  - **Cozy Cafe** — warm lighting, tables with chairs, bar counter + stools, couch, pendant lights, coffee cups, rug
  - **Rooftop Garden** — plants, fairy lights, sunset sky (drei Sky), benches, swing, cushion
  - **Starlight Lounge** — dark purple, constellation floor, glowing orbs, sofas, bar counter
- [x] Per-room lighting (`RoomLighting.tsx`) with warm/natural/cool presets
- [x] Walkable bounds clamping per room

#### 6C — Room Interaction Points
- [x] Sit spots: per-room data with position, rotation, label, and optional animation
- [x] `SitSpotMarker` — interactive circles at sit spot positions, walk-to-sit on click
- [x] Server-validated occupancy (`Room.sitSpotOccupants`, `occupySitSpot`, `releaseSitSpot`)
- [x] Per-spot animations (eat at tables, idle at bar, rest on couch)

#### 6D — Furniture Collision
- [x] Circle + AABB obstacle shapes per room (`collision.ts`)
- [x] Multi-pass push-out resolution (`resolveCollisions`, `clampAndResolve`)
- [x] Client-side collision in movement loop + click plane
- [x] Obstacle bypass when walking to sit spots (creature needs to reach furniture)
- [x] Cafe furniture geometry: chairs around tables, bar stools, 3 couch seats

### Deliverable
Room browser shows 3 themed rooms. Click to join. Walk around, sit at spots, chat. Different rooms feel distinct. Creatures can't walk through furniture.

### Parallelism
- **6A (room system code)** and **6B (environment art)** ran fully parallel
- **6C (interactions)** depended on both 6A and 6B
- **6D (collision)** depended on 6B (obstacle positions from environment geometry)

---

## STAGE 7 — Social Features & Polish
> **Goal:** Friends, profiles, emotes, camera controls, and visual polish.
> **Duration estimate:** 3-5 days

### Tasks

#### 7A — Emote System
- [ ] Emote wheel UI (right-click or button)
- [ ] 8-10 emotes: wave, dance, laugh, heart, sparkle, sleep, applaud, shrug
- [ ] Emote plays animation + shows floating emoji above creature
- [ ] Emotes synced to other players via Socket.io

#### 7B — Player Profiles
- [ ] `MiniProfile.tsx`: click another player's creature → see name, creature, skin
- [ ] Profile popup: add friend, whisper, view inventory
- [ ] Username display above creatures (drei `Html` or `Text`)
- [ ] Player name colors based on rarity of equipped skin

#### 7C — Friends System
- [ ] Friend request send/accept/decline
- [ ] Friends list with online status + current room
- [ ] "Join friend" button → teleport to their room
- [ ] Whisper (private) chat channel

#### 7D — Camera Controls
- [ ] Zoom in/out with +/- buttons (UI overlay)
- [ ] Scroll wheel zoom support
- [ ] Zoom level clamped to min/max bounds
- [ ] Smooth zoom transition (lerp)

#### 7E — Visual Polish
- [ ] Brighten Starlight Lounge ambient lighting (currently too dark)
- [ ] Ambient particles per room (floating leaves, fireflies, steam)
- [ ] Footstep puffs when creatures walk
- [ ] Smooth UI transitions (panel slide-in, fade)
- [ ] Sound design: ambient room sounds, UI clicks, emote sounds
- [ ] Day/night cycle or time-of-day lighting shifts

### Parallelism
- **7A (emotes)**, **7B (profiles)**, **7C (friends)**, **7D (camera)** are all independent
- **7E (polish)** can happen continuously alongside everything else

---

## STAGE 8 — Mini-Game Framework
> **Goal:** Extensible system for adding small games to rooms.
> **Duration estimate:** 3-5 days for framework + first game

### Tasks

#### 8A — Game Module Architecture
- [ ] `GameModule` interface: `setup()`, `update()`, `teardown()`, `render()`
- [ ] Game state sync via Socket.io (separate event namespace per game)
- [ ] Games run within a room — all players in room can join/spectate
- [ ] Game UI renders as an overlay on top of the social view
- [ ] Shared types for game state, scores, turns

#### 8B — First Mini-Game: Drawing Guess
- [ ] One player draws on a canvas, others guess via chat
- [ ] Word selection, timer, scoring
- [ ] Drawing tool: simple brush, colors, eraser
- [ ] Canvas synced in real-time to all players

#### 8C — Second Mini-Game: Trivia
- [ ] Question packs (themed: animals, food, pop culture)
- [ ] Timed answers, score tracking
- [ ] Creatures react to correct/wrong answers (animation)

### Parallelism
- **8A (framework)** first, then **8B and 8C can be parallel**
- Mini-game art/content is parallel with code

---

## Parallelism Summary

```
TIMELINE (not to scale)
═══════════════════════════════════════════════════════════
Stages 0-6 complete. 403 tests passing across 36 files.

Stage 0: Foundation ✅
  ████

Stage 1 + 2 (parallel): ✅
  ┌── Stage 1: Scene + Creature ────┐
  │   ████████                       │
  └── Stage 2: Server + Multiplayer ─┘
      ████████

Stage 3: Chat ✅
  ████████
  ├── Chat UI (parallel)
  └── Chat Server (parallel)

Stage 3.5: Voice Chat ✅
  ████████████
  ├── 3.5A: LiveKit infra ──┐
  ├── 3.5B: Client voice ───┘
  ├── 3.5C: Voice UI
  └── 3.5D: Spatial audio

Stage 4: Creature System ✅
  ████████████████
  ├── 4A: Asset pipeline (Cute Zoo 4 FBX→glTF, 6 models)
  ├── 4B: Creature rendering (useGLTF, SkeletonUtils.clone, animations)
  ├── 4C: Selection UI (CreaturePicker, CreaturePreview, localStorage)
  └── 4D: SQLite persistence (better-sqlite3, player queries)

Stage 5: Skin & Collection System ✅
  ████████████████
  ├── 5A: Shared types/constants (30 skins, 4 sets, 4 rarities)
  ├── 5B: HSL shader (onBeforeCompile GLSL injection) ──┐
  ├── 5C: Accessories (10 types, bone attachment) ───────┤ parallel
  ├── 5D: Particle effects (4 types, legendary skins) ──┤
  ├── 5E: Backend (SQLite inventory, REST API, socket) ──┘
  └── 5F: Client UI (SkinShop, SkinInventory, skinStore)

Stage 6: Hangout Spaces ✅
  ████████████████
  ├── 6A: Room system (browser, switching, transitions)
  ├── 6B: Room art (3 procedural environments) ──┐ parallel
  ├── 6C: Sit spots (server-validated, per-spot animations)
  └── 6D: Furniture collision (circle + AABB obstacles)

─── COMPLETED ABOVE ─── PLANNED BELOW ───────────────────

Stage 7: Social + Polish (sub-tasks all parallel)
  ████████████████████
  ├── 7A: Emotes
  ├── 7B: Profiles
  ├── 7C: Friends
  ├── 7D: Camera controls (zoom in/out buttons + scroll wheel)
  └── 7E: Polish (Starlight Lounge brightness, particles, sounds)

Stage 8: Mini-Games
  ████████████████
  ├── 8A: Framework
  ├── 8B: Drawing game ─┐
  └── 8C: Trivia ───────┘ (parallel after framework)

Stage 9: Expressive Avatars
  ████████████████████████
  ├── 9A: Audio lip sync ────── (can ship with Stage 3.5)
  ├── 9B: Face tracking ──────┐
  ├── 9C: Networking ──────────┘ (parallel)
  ├── 9D: Creature expressions ── (needs morph targets from 4A)
  └── 9E: Privacy UX ─────────── (independent)

ART / ASSET PIPELINE (runs continuously in parallel)
  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
  NOTE: Creature models (Stage 4A) should include morph targets
        for expressions even before Stage 9 is built
```

### Where Two People Could Work Simultaneously

| Person A (Frontend/3D) | Person B (Backend/Server) |
|------------------------|--------------------------|
| Stage 1: Isometric scene | Stage 2: Socket.io server |
| Stage 3: Chat UI + bubbles | Stage 3: Chat server handler |
| Stage 3.5C: Voice UI + indicators | Stage 3.5A: LiveKit infra + token API |
| Stage 3.5D: Spatial audio | Stage 3.5B: Voice connection wiring |
| Stage 4B: Creature rendering | Stage 5A+5B: Skin data + API |
| Stage 5C+5D: Skin shop UI | Stage 6A: Room management |
| Stage 6C: Sit spots/interactions | Stage 7C: Friends system backend |
| Stage 7A: Emote wheel | Stage 8A: Game module framework |
| Stage 7D: Visual polish | Stage 8B: Drawing game logic |
| Stage 9B: Face tracking pipeline | Stage 9C: Expression networking |
| Stage 9D: Creature expression rendering | Stage 9E: Privacy UX + settings |

### Where a Designer/Artist Could Work in Parallel

Starting from Day 1, an artist can produce:
1. Creature model concepts → low-poly models → glTF exports (Stage 4A)
2. Skin designs per creature per theme set (Stage 5)
3. Room environment concepts → 3D models (Stage 6B)
4. Emote animations (Stage 7A)
5. UI design mockups (any stage)
6. Sound design (Stage 7D)
7. **Creature morph targets for expressions** — eyelids, jaw, brows (Stage 4A, needed by Stage 9)

---

## STAGE 9 — Expressive Avatars (Face Tracking)
> **Goal:** Map player facial expressions to creature avatars via webcam/phone camera.
> **Duration estimate:** 4-6 days

### Tech: MediaPipe Face Mesh + Web Audio

MediaPipe Face Mesh runs entirely client-side (WASM/WebGL), tracking 478 facial landmarks
and outputting 52 ARKit-compatible blendshape coefficients. No video leaves the device —
only numeric expression values are networked.

### Tasks

#### 9A — Audio-Driven Lip Sync (pairs with Voice Chat, Stage 3.5)
- [ ] Analyze mic audio stream amplitude using Web Audio API `AnalyserNode`
- [ ] Map volume level → `mouthOpen` blendshape value (smoothed, with configurable gain)
- [ ] Drive creature jaw bone or morph target from `mouthOpen` value
- [ ] Works for all players with mic enabled — no camera required
- [ ] Shared type: `ExpressionState { mouthOpen: number }` (extended in 9B)

#### 9B — Face Tracking Pipeline
- [ ] Add `@mediapipe/tasks-vision` (Face Landmarker) to `@cozy/client`
- [ ] `input/faceTracking.ts` module: initialize camera, run MediaPipe, extract blendshapes
- [ ] Reduce 52 raw blendshapes to ~10 creature-relevant values:
  - `eyeBlinkLeft`, `eyeBlinkRight` — blink
  - `jawOpen` — mouth open (overrides audio lip sync when camera active)
  - `mouthSmileLeft`, `mouthSmileRight` — smile
  - `browInnerUp`, `browDownLeft`, `browDownRight` — eyebrow expression
  - `headYaw`, `headPitch`, `headRoll` — head rotation
- [ ] `expressionStore` (Zustand): holds current expression values, camera enabled state
- [ ] Expression values update at ~30fps locally, networked at ~10Hz
- [ ] Stylization layer: exaggerate values (2-3x multiplier) so they read on low-poly creatures
- [ ] Per-creature expression mapping (a frog blinks differently than a cat)

#### 9C — Networking
- [ ] Shared type: `ExpressionState { eyeBlink, mouthOpen, smile, browRaise, headYaw, headPitch, headRoll }`
- [ ] Socket.io event: `player:expression` — throttled alongside `player:move` (~10Hz)
- [ ] Compact encoding: quantize floats to uint8 (0-255) — ~10 bytes per update
- [ ] Server: broadcast expression data to room (no server-side processing needed)

#### 9D — Creature Expression Rendering
- [ ] Creature meshes need morph targets or bone rigs for: eyelids, jaw, eyebrows
- [ ] Plan morph targets into asset pipeline (Stage 4A) even before tracking is built
- [ ] `CreatureExpressionDriver.tsx`: applies `ExpressionState` to creature mesh
- [ ] Smooth interpolation on received expression data (lerp, same as position)
- [ ] Idle expression fallback: periodic auto-blinks, subtle breathing, for players without camera

#### 9E — Privacy & UX
- [ ] Camera access is opt-in: clear permission prompt explaining what's captured
- [ ] Camera indicator visible when active (icon in HUD)
- [ ] Easy toggle: on/off button in voice controls area
- [ ] Settings: camera device selection, expression sensitivity slider, mirror preview
- [ ] Mirror preview: small PiP showing what the camera sees + expression debug overlay
- [ ] No video data ever leaves the client — only expression coefficients

### Deliverable
Enable camera → your creature's face mirrors your expressions in real time. Blink → creature blinks. Smile → creature smiles. Talk → mouth moves. Other players see your expressions. Players without cameras get natural idle animations.

### Parallelism
- **9A (audio lip sync)** can ship with Stage 3.5 (voice chat) — no camera dependency
- **9B (face tracking)** and **9C (networking)** can develop in parallel
- **9D (creature rendering)** depends on creature meshes with morph targets (Stage 4A planning)
- **9E (UX)** is independent UI work
- **Asset pipeline note:** Morph targets should be planned into creature models from Stage 4A onward

### Key Dependencies
- Stage 3.5 (voice chat) for audio lip sync
- Stage 4A (creature models) must include morph targets / expression bones
- MediaPipe WASM binary (~4MB) — lazy-load only when camera is enabled

---

## Key Decision Points

| When | Decision | Options |
|------|----------|---------|
| Stage 0 | Auth strategy | **Chose:** Simple username (fast). OAuth deferred. |
| Stage 2 | Tick rate | **Chose:** 10Hz — good enough for social, lower bandwidth |
| Stage 3.5 | LiveKit hosting | **Chose:** Local Docker for dev (self-host for prod later) |
| Stage 4 | Creature art source | **Chose:** Cute Zoo 4 (SURIYUN) commercial asset pack — 6 creatures |
| Stage 5 | Monetization | Free skins via play time, premium currency, seasonal battle pass, or all free |
| Stage 6 | Room creation | Only pre-made rooms, or user-created rooms with decoration? |
| Stage 8 | Game scope | 2-3 simple games vs 1 deep game |
| Stage 9 | Lip sync first? | Audio-only lip sync with voice chat (fast) vs full face tracking from start |
| Stage 9 | MediaPipe version | @mediapipe/tasks-vision (newer, recommended) vs legacy @mediapipe/face_mesh |
| Stage 9 | Expression fidelity | ~10 blendshapes (performant) vs full 52 ARKit set (detailed but heavier network) |

---

## MVP Definition (Stages 0-3) ✅

The **minimum viable product** that you could show someone:
- Open a link → pick a name → see an isometric room
- Your creature appears and you can click to move
- Other people in the room are visible and moving
- You can chat via text panel and see chat bubbles

**MVP complete.** Stages 0-6 shipped. 3 themed rooms with procedural environments, furniture collision, sit spots with per-spot animations, room browser, and room switching. Voice chat, 6 creature models, 30 skins with HSL shader/accessories/particles.
