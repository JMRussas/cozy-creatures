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
├── package.json                    # root scripts
├── tsconfig.base.json              # shared TS config
│
├── apps/
│   └── client/                     # React + Vite + R3F
│       ├── package.json
│       ├── vite.config.ts
│       ├── index.html
│       └── src/
│           ├── main.tsx
│           ├── App.tsx
│           ├── scene/              # Three.js scene, camera, lighting
│           │   ├── IsometricScene.tsx
│           │   ├── Ground.tsx
│           │   └── Lighting.tsx
│           ├── creatures/          # Creature rendering + animation
│           │   ├── CreatureModel.tsx
│           │   ├── CreatureAnimator.tsx
│           │   └── CreatureRegistry.ts
│           ├── ui/                 # React UI components
│           │   ├── ChatPanel.tsx
│           │   ├── EmoteBar.tsx
│           │   ├── RoomBrowser.tsx
│           │   ├── SkinShop.tsx
│           │   ├── Inventory.tsx
│           │   ├── MiniProfile.tsx
│           │   ├── VoiceControls.tsx  # Mic/deafen toggles, settings
│           │   └── Layout.tsx
│           ├── networking/         # Socket.io client
│           │   ├── socket.ts
│           │   ├── useRoom.ts
│           │   ├── useChat.ts
│           │   └── useVoice.ts     # LiveKit voice connection
│           ├── stores/             # Zustand stores
│           │   ├── playerStore.ts
│           │   ├── roomStore.ts
│           │   ├── chatStore.ts
│           │   ├── voiceStore.ts   # Voice state (muted, spatial, etc.)
│           │   └── inventoryStore.ts
│           ├── input/              # Click-to-move, keyboard
│           │   └── useMovement.ts
│           └── assets/             # Static assets (textures, icons)
│
├── packages/
│   ├── server/                     # Node.js + Express + Socket.io
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts
│   │       ├── config.ts
│   │       ├── socket/             # Socket.io event handlers
│   │       │   ├── roomHandler.ts
│   │       │   ├── chatHandler.ts
│   │       │   └── movementHandler.ts
│   │       ├── rooms/              # Room management
│   │       │   ├── RoomManager.ts
│   │       │   └── Room.ts
│   │       ├── auth/               # Auth (simple → OAuth)
│   │       │   └── auth.ts
│   │       ├── db/                 # Database layer
│   │       │   ├── schema.ts
│   │       │   ├── migrations/
│   │       │   └── queries/
│   │       └── api/                # REST endpoints
│   │           ├── rooms.ts
│   │           ├── players.ts
│   │           ├── skins.ts
│   │           └── voice.ts       # LiveKit token generation
│   │
│   └── shared/                     # Shared TypeScript types
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── index.ts
│           ├── types/
│           │   ├── player.ts
│           │   ├── creature.ts
│           │   ├── room.ts
│           │   ├── chat.ts
│           │   ├── skin.ts
│           │   └── events.ts       # Socket event type definitions
│           └── constants/
│               ├── creatures.ts    # Creature IDs, base stats
│               └── rooms.ts        # Room IDs, configs
│
└── assets/                         # Source 3D models (glTF)
    ├── creatures/
    │   ├── cat/
    │   ├── fox/
    │   ├── bunny/
    │   └── frog/
    ├── environments/
    │   ├── cozy-cafe/
    │   └── rooftop-garden/
    └── props/
```

---

## STAGE 0 — Project Foundation
> **Goal:** Monorepo running, both client and server start with one command.
> **Duration estimate:** Half a day

### Tasks
- [ ] Initialize pnpm monorepo with workspace config
- [ ] Scaffold `apps/client` with Vite + React 19 + TypeScript
- [ ] Scaffold `packages/server` with Express + TypeScript + ts-node-dev
- [ ] Scaffold `packages/shared` with TypeScript types
- [ ] Configure path aliases so client and server import from `@cozy/shared`
- [ ] Root `pnpm dev` starts both client (5173) and server (3001) in parallel
- [ ] Add `.gitignore`, `CLAUDE.md`, `.claude/` docs
- [ ] Vite proxy: `/api` and `/socket.io` → server

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

## STAGE 3 — Chat System
> **Goal:** Text chat in rooms with chat bubbles over creatures.
> **Duration estimate:** 1-2 days

### Tasks
- [ ] Define shared chat events: `chatMessage`, `chatHistory`
- [ ] Server `chatHandler`: receive message, broadcast to room, store recent history
- [ ] Client `ChatPanel.tsx`: message list, input field, send button
- [ ] `chatStore` with message history per room
- [ ] Chat bubbles above creatures (HTML overlay via drei's `Html` component)
- [ ] Chat bubble auto-fade after configurable duration
- [ ] Basic profanity filter (server-side, word list)
- [ ] Message length limit (from shared config)
- [ ] Scroll-to-bottom behavior, unread indicator

### Deliverable
Type a message → it appears in the chat panel AND as a bubble over your creature. Other players see it.

### Parallelism
- **Chat UI** (ChatPanel, bubbles) can be built independently of the **server chat handler**
- **Profanity filter** is independent of both

---

## STAGE 3.5 — Voice Chat
> **Goal:** Players can talk to each other in rooms via voice. Spatial audio mode available.
> **Duration estimate:** 2-3 days

### Tech: LiveKit (Self-Hosted SFU)

LiveKit is an open-source WebRTC SFU that handles media routing, encoding, and room management.
The client uses `livekit-client` SDK; the server generates access tokens via `livekit-server-sdk`.
LiveKit runs as a separate service alongside the Express server.

### Tasks

#### 3.5A — LiveKit Infrastructure
- [ ] Add LiveKit as a Docker Compose service (or install binary for local dev)
- [ ] Configure LiveKit server (port, API key/secret in env vars)
- [ ] Add `livekit-server-sdk` to `@cozy/server` for token generation
- [ ] REST endpoint: `POST /api/voice/token` — generates a LiveKit access token scoped to the player's current room
- [ ] Token includes player ID and room name as metadata

#### 3.5B — Client Voice Connection
- [ ] Add `livekit-client` to `@cozy/client`
- [ ] `voiceStore` (Zustand): connection state, muted/deafened, speaking participants, spatial mode toggle
- [ ] `useVoice.ts` hook: connect to LiveKit room, publish/unpublish audio track
- [ ] On room join → fetch token from `/api/voice/token` → connect to LiveKit room
- [ ] On room leave → disconnect from LiveKit room
- [ ] Handle reconnection (LiveKit SDK handles most of this)

#### 3.5C — Voice UI
- [ ] Mic toggle button (mute/unmute) in HUD — prominent, always visible
- [ ] Deafen toggle (stop hearing others)
- [ ] Speaking indicator on creatures (glow, icon, or animated ring above head)
- [ ] Speaking indicator in player list / chat panel
- [ ] Push-to-talk option (configurable keybind, default: V)
- [ ] Voice settings panel: input device selection, input volume, output volume
- [ ] Visual feedback: mic level meter in settings

#### 3.5D — Spatial Audio
- [ ] Default mode: room-wide (all participants at equal volume)
- [ ] Spatial mode toggle in voice settings
- [ ] When spatial enabled: use Web Audio API `PannerNode` to position each remote audio source
- [ ] Map creature world position → audio listener position (update on movement)
- [ ] Configurable falloff: `VOICE_SPATIAL_MIN_DISTANCE`, `VOICE_SPATIAL_MAX_DISTANCE` in shared config
- [ ] Players beyond max distance are silent; between min/max follows inverse distance
- [ ] Visual indicator: subtle audio range ring around player (only visible to self, only in spatial mode)

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

## STAGE 4 — Creature System
> **Goal:** Multiple creature types with proper models, animations, and selection.
> **Duration estimate:** 3-5 days

### Tasks

#### 4A — Asset Pipeline (can start during Stage 1-2)
- [ ] Source or create 4-6 base creature models (cat, fox, bunny, frog, axolotl, mushroom)
- [ ] Each creature needs: idle, walk, sit, wave animations (minimum)
- [ ] Export as glTF with named animation clips
- [ ] Optimize: < 2000 triangles per creature, single texture atlas
- [ ] Place in `assets/creatures/<name>/model.glb`

#### 4B — Creature Rendering
- [ ] `CreatureModel.tsx`: loads glTF, plays animations via `useAnimations`
- [ ] `CreatureRegistry.ts`: maps creature IDs to model paths + metadata
- [ ] Animation state machine: idle ↔ walk ↔ sit, emote overlays
- [ ] Smooth animation blending (crossfade between clips)

#### 4C — Creature Selection UI
- [ ] Creature picker screen (shown on first visit or from profile)
- [ ] 3D preview of each creature with turntable rotation
- [ ] Selection saved to player profile
- [ ] Creature type synced over network (included in `playerJoin` event)

### Deliverable
Each player picks a creature type. Different players can be different creatures. All animate correctly.

### Parallelism
- **4A (asset creation)** is fully parallel with all code work — can start Day 1
- **4B (rendering)** depends on having at least 1 model from 4A
- **4C (UI)** depends on 4B

---

## STAGE 5 — Skin & Collection System
> **Goal:** Creatures have collectible skins with rarity tiers. Inventory and shop UI.
> **Duration estimate:** 3-5 days

### Tasks

#### 5A — Data Model
- [ ] Shared types: `Skin`, `SkinSet`, `Rarity`, `PlayerInventory`
- [ ] Skin definition format: creature base + color palette + accessory meshes + effects
- [ ] Rarity tiers: Common, Rare, Epic, Legendary
- [ ] Skin sets: themed collections (e.g., "Cozy Cafe", "Starlight", "Garden Party")
- [ ] Database schema: `skins`, `player_inventory`, `skin_sets`

#### 5B — Backend
- [ ] REST endpoints: GET /api/skins, GET /api/inventory, POST /api/inventory/equip
- [ ] Skin unlock logic (for now: grant defaults, admin can give skins)
- [ ] Equipped skin included in `playerJoin` network event

#### 5C — Client Rendering
- [ ] Skin system: swap color palette on creature material
- [ ] Accessory attachment points on creature models (hat, back, held item)
- [ ] Legendary skins: subtle particle effects (sparkles, glow)
- [ ] Other players see your equipped skin

#### 5D — Shop & Inventory UI
- [ ] `Inventory.tsx`: grid of owned skins, equip button, rarity badges
- [ ] `SkinShop.tsx`: browse available skins by set, preview on your creature
- [ ] Skin preview: 3D turntable with the skin applied to your creature
- [ ] Rarity visual treatment: border colors, shimmer effect on Legendary

### Deliverable
Players can browse skins, equip them, and see each other's skins. Skins range from simple recolors (Common) to elaborate accessory + effect combos (Legendary).

### Parallelism
- **5A (types) + 5B (backend)** can run parallel with **5C (rendering) + 5D (UI)**
- **Skin art creation** is parallel with all code work

---

## STAGE 6 — Hangout Spaces
> **Goal:** Multiple themed rooms players can browse and join.
> **Duration estimate:** 3-5 days

### Tasks

#### 6A — Room System
- [ ] Room browser: list of available rooms with player counts + thumbnails
- [ ] Join room → loads that room's 3D environment
- [ ] Room capacity limits (configurable per room)
- [ ] Player count shown in room browser (live via Socket.io)
- [ ] Smooth transition between rooms (fade out → load → fade in)

#### 6B — Environment Art (parallel with code)
- [ ] Design 3 starter environments:
  - **Cozy Cafe** — warm lighting, tiny tables, coffee cup props
  - **Rooftop Garden** — plants, fairy lights, sunset sky
  - **Starlight Lounge** — dark/purple, constellation floor, glowing props
- [ ] Each environment: ground mesh, props, skybox/background, ambient sound
- [ ] Export as glTF, optimize for web (< 50K triangles per room)
- [ ] Walkable area definition (navigation mesh or simple boundary)

#### 6C — Room Interaction Points
- [ ] Sit spots: designated positions where creatures can sit (bench, cushion)
- [ ] Click a sit spot → creature walks there and plays sit animation
- [ ] Interaction prompts (subtle highlight when hovering near a spot)

### Deliverable
Room browser shows 3 themed rooms. Click to join. Walk around, sit at spots, chat. Different rooms feel distinct.

### Parallelism
- **6A (room system code)** and **6B (environment art)** are fully parallel
- **6C (interactions)** depends on both 6A and 6B

---

## STAGE 7 — Social Features & Polish
> **Goal:** Friends, profiles, emotes, and visual polish.
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

#### 7D — Visual Polish
- [ ] Ambient particles per room (floating leaves, fireflies, steam)
- [ ] Footstep puffs when creatures walk
- [ ] Smooth UI transitions (panel slide-in, fade)
- [ ] Sound design: ambient room sounds, UI clicks, emote sounds
- [ ] Day/night cycle or time-of-day lighting shifts

### Parallelism
- **7A (emotes)**, **7B (profiles)**, **7C (friends)** are all independent
- **7D (polish)** can happen continuously alongside everything else

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

Stage 0: Foundation
  ████  (half day)

                   ┌── Stage 1: Scene + Creature ────┐
Stage 1 + 2:       │   ████████                       │
  (parallel)       │                                  │
                   └── Stage 2: Server + Multiplayer ─┘
                       ████████

Stage 3: Chat
  ████████
  ├── Chat UI (parallel)
  └── Chat Server (parallel)

Stage 3.5: Voice Chat
  ████████████
  ├── 3.5A: LiveKit infra ──┐
  ├── 3.5B: Client voice ───┘ (depends on infra)
  ├── 3.5C: Voice UI ──────── (UI mockup parallel with infra)
  └── 3.5D: Spatial audio ─── (depends on client voice)

Stage 4: Creature System ✅
  ████████████████
  ├── 4E: Shared types/constants (6 Cute Zoo 4 creatures) ✅
  ├── 4A: Asset pipeline (FBX→glTF via Blender, 6 models) ✅
  ├── 4D: SQLite persistence (better-sqlite3, player queries) ✅
  ├── 4B: Creature rendering (useGLTF, animations, fallback) ✅
  └── 4C: Selection UI (CreaturePicker, CreaturePreview, localStorage) ✅

Stage 5: Skins                Stage 6: Hangout Spaces
  ████████████████               ████████████████
  ├── 5A+5B: Backend ──┐        ├── 6A: Room code ──────┐
  └── 5C+5D: Client ───┘        ├── 6B: Room art ───────┘ (parallel)
      (parallel)                 └── 6C: Interactions

Stage 7: Social + Polish (sub-tasks all parallel)
  ████████████████████
  ├── 7A: Emotes
  ├── 7B: Profiles
  ├── 7C: Friends
  └── 7D: Polish (ongoing)

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
| Stage 0 | Auth strategy | Simple username (fast) vs OAuth (Google/Discord) from start |
| Stage 2 | Tick rate | 10Hz (good enough for social) vs 30Hz (smoother but more bandwidth) |
| Stage 3.5 | LiveKit hosting | Local Docker for dev, self-host for prod, or LiveKit Cloud |
| Stage 4 | Creature art source | Commission artist, use AI generation as base, modify existing assets |
| Stage 5 | Monetization | Free skins via play time, premium currency, seasonal battle pass, or all free |
| Stage 6 | Room creation | Only pre-made rooms, or user-created rooms with decoration? |
| Stage 8 | Game scope | 2-3 simple games vs 1 deep game |
| Stage 9 | Lip sync first? | Audio-only lip sync with voice chat (fast) vs full face tracking from start |
| Stage 9 | MediaPipe version | @mediapipe/tasks-vision (newer, recommended) vs legacy @mediapipe/face_mesh |
| Stage 9 | Expression fidelity | ~10 blendshapes (performant) vs full 52 ARKit set (detailed but heavier network) |

---

## MVP Definition (Stages 0-3)

The **minimum viable product** that you could show someone:
- Open a link → pick a name → see an isometric room
- Your creature appears and you can click to move
- Other people in the room are visible and moving
- You can chat via text panel and see chat bubbles

**Everything after Stage 3 makes it better. Stages 0-3 make it exist.**
