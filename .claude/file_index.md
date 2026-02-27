# File Index

Complete index of all source files with one-line summaries, line counts, and dependency edges.

**85+ source files, ~6,400+ lines** (excluding tests and config files).

## Shared Package (`@cozy/shared` — Packages/shared/src/)

### Types

| File | Lines | Summary |
|------|------:|---------|
| [index.ts](../Packages/shared/src/index.ts) | 15 | Barrel re-export of all types and constants |
| [types/player.ts](../Packages/shared/src/types/player.ts) | 39 | `Player` (incl. `sitSpotId?`), `Position`, `PlayerProfile` interfaces |
| [types/creature.ts](../Packages/shared/src/types/creature.ts) | 14 | `CreatureDefinition` interface — species metadata |
| [types/room.ts](../Packages/shared/src/types/room.ts) | 59 | `RoomBase`, `RoomConfig` (with `environment`), `RoomInfo`, `RoomState`, `WalkableBounds`, `SitSpot`, `RoomEnvironment` |
| [types/chat.ts](../Packages/shared/src/types/chat.ts) | 17 | `ChatMessage` — single chat message structure |
| [types/voice.ts](../Packages/shared/src/types/voice.ts) | 26 | `VoiceState`, `VoiceTokenRequest`, `VoiceTokenResponse` |
| [types/events.ts](../Packages/shared/src/types/events.ts) | 97 | `ClientToServerEvents`, `ServerToClientEvents`, `SocketData` (incl. room switch, sit/stand, player count events) |
| [types/skin.ts](../Packages/shared/src/types/skin.ts) | 90 | `SkinRarity`, `SkinColorShift`, `SkinAccessory`, `SkinParticleEffect`, `SkinDefinition`, `SkinSet`, `InventoryItem`, `RarityInfo` |

### Constants

| File | Lines | Summary |
|------|------:|---------|
| [constants/config.ts](../Packages/shared/src/constants/config.ts) | 60 | Numeric limits, rate limits, voice constants, room transition/sit spot thresholds |
| [constants/creatures.ts](../Packages/shared/src/constants/creatures.ts) | 69 | `CREATURES` registry (otter, red-panda, sloth, chipmunk, possum, pangolin), `CreatureTypeId`, `DEFAULT_CREATURE`, `BASE_ANIMATIONS` |
| [constants/rooms.ts](../Packages/shared/src/constants/rooms.ts) | 67 | `ROOMS` registry (3 rooms with environments, bounds, sit spots), `RoomId`, `DEFAULT_ROOM` |
| [constants/skins.ts](../Packages/shared/src/constants/skins.ts) | 447 | `SKINS` registry (30 skins), `SKIN_SETS` (4 themed sets), `RARITIES`, `DEFAULT_SKIN_IDS`, `SkinId`, `SkinSetId` |

### Dependency Graph

```
creature.ts ← creatures.ts ← player.ts ← events.ts
                    ↑             ↑           ↑
skin.ts ← skins.ts─┘  config.ts  chat.ts ────┘
                                  voice.ts ───┘
room.ts ← rooms.ts ← config.ts
```

---

## Server Package (`@cozy/server` — Packages/server/src/)

| File | Lines | Summary |
|------|------:|---------|
| [index.ts](../Packages/server/src/index.ts) | 116 | Express + Socket.io setup, IP rate limiting, voice router mount, graceful shutdown |
| [config.ts](../Packages/server/src/config.ts) | 95 | Env-var-driven config with validation (`PORT`, `CORS_ORIGIN`, rate limits, LiveKit keys) |
| [api/voice.ts](../Packages/server/src/api/voice.ts) | 61 | `POST /api/voice/token` — validates request, creates LiveKit JWT, returns token + URL |
| [rooms/Room.ts](../Packages/server/src/rooms/Room.ts) | 117 | Single room state: player Map, capacity, sit spot occupancy (`occupySitSpot`, `releaseSitSpot`), `getState()`, `getInfo()` |
| [rooms/RoomManager.ts](../Packages/server/src/rooms/RoomManager.ts) | 45 | Manages all Room instances, initializes from `ROOMS` constant |
| [socket/connectionHandler.ts](../Packages/server/src/socket/connectionHandler.ts) | 626 | All socket handlers: join, move (bounds-clamped), leave, switch-room, sit, stand, equip-skin, room:list, disconnect + rate limiters |
| [socket/chatHandler.ts](../Packages/server/src/socket/chatHandler.ts) | 141 | `chat:message` handler, in-memory ring buffer history, rate limiting |
| [socket/voiceHandler.ts](../Packages/server/src/socket/voiceHandler.ts) | 58 | `voice:state` broadcast to room, rate-limited, `cleanupVoice()` export |
| [socket/profanityFilter.ts](../Packages/server/src/socket/profanityFilter.ts) | 35 | Word-list replacement filter — `filterProfanity()` |
| [socket/validation.ts](../Packages/server/src/socket/validation.ts) | 81 | `stripControlChars`, `sanitizePosition`, `createRateLimiter`, `isFiniteNumber`, `clamp` |
| [api/skins.ts](../Packages/server/src/api/skins.ts) | 121 | REST endpoints: `GET /api/skins`, `GET /api/skins/inventory/:playerId`, `POST /api/skins/equip` |
| [db/database.ts](../Packages/server/src/db/database.ts) | 72 | SQLite singleton via better-sqlite3, WAL mode, schema init (players + player_inventory tables) |
| [db/playerQueries.ts](../Packages/server/src/db/playerQueries.ts) | 67 | Player CRUD: `findPlayerByName`, `createPlayer`, `updatePlayerOnJoin`, `getEquippedSkin`, `setEquippedSkin` |
| [db/inventoryQueries.ts](../Packages/server/src/db/inventoryQueries.ts) | 71 | Inventory CRUD: `getPlayerInventory`, `addToInventory`, `playerOwnsSkin`, `removeFromInventory`, `grantDefaultSkins` |

### Dependency Graph

```
index.ts
  ├── config.ts ← @cozy/shared
  ├── voiceRouter (api/voice.ts) ← config.ts, livekit-server-sdk
  ├── skinsRouter (api/skins.ts) ← db/database.ts, db/inventoryQueries.ts, db/playerQueries.ts, @cozy/shared
  ├── RoomManager.ts ← Room.ts ← @cozy/shared
  ├── db/database.ts ← better-sqlite3, config.ts
  │     ├── db/playerQueries.ts ← @cozy/shared
  │     └── db/inventoryQueries.ts ← @cozy/shared
  ├── connectionHandler.ts
  │     ├── validation.ts ← @cozy/shared
  │     ├── chatHandler.ts (sendChatHistory, cleanupChat)
  │     ├── voiceHandler.ts (cleanupVoice)
  │     ├── db/playerQueries.ts
  │     ├── db/inventoryQueries.ts
  │     ├── RoomManager.ts
  │     └── config.ts
  ├── chatHandler.ts
  │     ├── validation.ts (stripControlChars, createRateLimiter)
  │     ├── profanityFilter.ts
  │     └── config.ts
  └── voiceHandler.ts
        ├── validation.ts (createRateLimiter)
        └── config.ts
```

---

## Client Package (`@cozy/client` — apps/client/src/)

### Entry & App Shell

| File | Lines | Summary |
|------|------:|---------|
| [main.tsx](../apps/client/src/main.tsx) | 17 | React DOM mount point |
| [App.tsx](../apps/client/src/App.tsx) | 229 | Join form (RoomBrowser + CreaturePicker + CreaturePreview) + InRoomView (HUD with Rooms/Skins buttons) + RoomTransition |
| [config.ts](../apps/client/src/config.ts) | 159 | All client visual/gameplay constants (movement, camera, creature geometry, lighting, room lighting presets, sit spot markers) |

### Networking

| File | Lines | Summary |
|------|------:|---------|
| [networking/socket.ts](../apps/client/src/networking/socket.ts) | 43 | Typed Socket.io singleton with `connect`/`disconnect` lifecycle |
| [networking/NetworkSync.tsx](../apps/client/src/networking/NetworkSync.tsx) | 45 | Subscribes to playerStore, emits throttled `player:move` (~10Hz), suppressed while sitting |
| [networking/useVoice.ts](../apps/client/src/networking/useVoice.ts) | 196 | LiveKit Room lifecycle: connect/disconnect, mute/deafen sync, push-to-talk, speaker detection |
| [networking/SpatialAudioManager.tsx](../apps/client/src/networking/SpatialAudioManager.tsx) | 140 | Web Audio PannerNode per remote participant, HRTF spatial positioning via useFrame |

### Stores (Zustand)

| File | Lines | Summary |
|------|------:|---------|
| [stores/playerStore.ts](../apps/client/src/stores/playerStore.ts) | 73 | Local player: position, target, isMoving, isSitting, sitSpotId, pendingSitId, creatureType, name; `reset()` clears all |
| [stores/roomStore.ts](../apps/client/src/stores/roomStore.ts) | 303 | Room state + Socket.io listeners: join/leave/switchRoom, player sync, roomCounts, sit/stand, voice reset |
| [stores/chatStore.ts](../apps/client/src/stores/chatStore.ts) | 117 | Chat messages, bubble lifecycle (setTimeout-based), unread count |
| [stores/voiceStore.ts](../apps/client/src/stores/voiceStore.ts) | 139 | Voice state: muted, deafened, speaking, spatial, remote speaking, device settings |
| [stores/skinStore.ts](../apps/client/src/stores/skinStore.ts) | 103 | Skin inventory, equipped skin, equip/unequip via socket with timeout, REST inventory fetch |

### 3D Scene

| File | Lines | Summary |
|------|------:|---------|
| [scene/IsometricScene.tsx](../apps/client/src/scene/IsometricScene.tsx) | 42 | R3F `<Canvas>` composing camera, RoomEnvironment, creatures, networking |
| [scene/CameraRig.tsx](../apps/client/src/scene/CameraRig.tsx) | 52 | Orthographic camera with smooth follow via `useFrame` |

### Room Environments (`scene/environments/`)

| File | Lines | Summary |
|------|------:|---------|
| [environments/RoomEnvironment.tsx](../apps/client/src/scene/environments/RoomEnvironment.tsx) | 27 | Theme router: switches on room theme → renders CozyCafe/RooftopGarden/StarlightLounge |
| [environments/RoomLighting.tsx](../apps/client/src/scene/environments/RoomLighting.tsx) | 45 | Per-room ambient + directional lighting from `ROOM_LIGHTING` config |
| [environments/ClickPlane.tsx](../apps/client/src/scene/environments/ClickPlane.tsx) | 54 | Invisible ground plane for click-to-move, clamps to bounds, auto-stands on click |
| [environments/SitSpotMarker.tsx](../apps/client/src/scene/environments/SitSpotMarker.tsx) | 114 | Interactive sit spot circles: hover highlight + label, click to walk-and-sit, occupancy tracking |
| [environments/CozyCafe.tsx](../apps/client/src/scene/environments/CozyCafe.tsx) | 139 | Procedural cafe: warm wood floor, tables, coffee cups, bar counter, pendant lights, couch, rug |
| [environments/RooftopGarden.tsx](../apps/client/src/scene/environments/RooftopGarden.tsx) | 197 | Procedural garden: sunset Sky, plants, benches, fairy lights, railing, swing, grass patches |
| [environments/StarlightLounge.tsx](../apps/client/src/scene/environments/StarlightLounge.tsx) | 235 | Procedural lounge: constellation floor (twinkling Points), glowing orbs, sofas, neon strips, bar |

### Creatures

| File | Lines | Summary |
|------|------:|---------|
| [creatures/Creature.tsx](../apps/client/src/creatures/Creature.tsx) | 168 | Local player: click-to-move, bounds clamping, sit/stand flow, imperative animation drive (idle/walk/rest), Suspense fallback |
| [creatures/CreatureModel.tsx](../apps/client/src/creatures/CreatureModel.tsx) | 121 | glTF model loader (useGLTF + SkeletonUtils.clone), imperative `setAnimation()` handle, crossfade, HSL skin shader, accessories, particles |
| [creatures/CreatureFallback.tsx](../apps/client/src/creatures/CreatureFallback.tsx) | 68 | Suspense fallback: procedural capsule+cones+eyes mesh (plain function component) |
| [creatures/CreatureShadow.tsx](../apps/client/src/creatures/CreatureShadow.tsx) | 23 | Shared shadow circle mesh extracted from Creature + RemoteCreature |
| [creatures/RemotePlayers.tsx](../apps/client/src/creatures/RemotePlayers.tsx) | 29 | Maps `players` record to `<RemoteCreature>` instances |
| [creatures/RemoteCreature.tsx](../apps/client/src/creatures/RemoteCreature.tsx) | 160 | Remote player: position lerp, hysteresis-based animation, sit spot snap (rest animation) |
| [creatures/overlays/ChatBubble.tsx](../apps/client/src/creatures/overlays/ChatBubble.tsx) | 35 | drei `<Html>` overlay above creature — shows latest message |
| [creatures/overlays/SpeakingIndicator.tsx](../apps/client/src/creatures/overlays/SpeakingIndicator.tsx) | 70 | R3F torus above creature head, pulsing green opacity when speaking |
| [creatures/overlays/AudioRangeRing.tsx](../apps/client/src/creatures/overlays/AudioRangeRing.tsx) | 32 | Ring geometry at spatial max distance, shown when spatial audio enabled |
| [creatures/shaders/hslShader.ts](../apps/client/src/creatures/shaders/hslShader.ts) | 190 | HSL color-shift shader via `onBeforeCompile` GLSL injection, material cloning, uniform storage |
| [creatures/accessories/boneUtils.ts](../apps/client/src/creatures/accessories/boneUtils.ts) | 42 | `findBoneByPattern()` — case-insensitive bone search; `findSkeleton()` |
| [creatures/accessories/accessoryFactories.ts](../apps/client/src/creatures/accessories/accessoryFactories.ts) | 177 | 10 procedural accessory types (top-hat, beret, crown, scarf, etc.) from Three.js primitives |
| [creatures/accessories/AccessoryAttacher.tsx](../apps/client/src/creatures/accessories/AccessoryAttacher.tsx) | 97 | Imperatively attaches accessories to creature bones via `useEffect` with cleanup/disposal |
| [creatures/effects/ParticleEffect.tsx](../apps/client/src/creatures/effects/ParticleEffect.tsx) | 230 | GPU particle system: `Points` + custom `ShaderMaterial`, 4 effect types (sparkle, glow, flame, hearts) |

### UI

| File | Lines | Summary |
|------|------:|---------|
| [ui/chat/ChatPanel.tsx](../apps/client/src/ui/chat/ChatPanel.tsx) | 152 | Collapsible chat panel: message list, input, unread badge, speaking dots, Escape to close |
| [ui/creatures/CreaturePicker.tsx](../apps/client/src/ui/creatures/CreaturePicker.tsx) | 49 | 3x2 grid of creature cards with accent border on selection (type-safe keys) |
| [ui/creatures/CreaturePreview.tsx](../apps/client/src/ui/creatures/CreaturePreview.tsx) | 55 | Small R3F Canvas with auto-rotating creature model preview + targeted preload |
| [ui/voice/VoiceControls.tsx](../apps/client/src/ui/voice/VoiceControls.tsx) | 87 | HUD bar: mic toggle, deafen toggle, settings gear, connection status dot |
| [ui/voice/VoiceSettings.tsx](../apps/client/src/ui/voice/VoiceSettings.tsx) | 211 | Settings panel: mic selector, level meter, volume sliders, PTT/spatial toggles |
| [ui/skins/SkinShop.tsx](../apps/client/src/ui/skins/SkinShop.tsx) | 175 | Full-screen modal: browse all skins by set, inventory tab, 3D preview, equip/unequip |
| [ui/skins/SkinInventory.tsx](../apps/client/src/ui/skins/SkinInventory.tsx) | 100 | Owned skins grid with rarity sorting, equip controls, 3D preview sidebar |
| [ui/skins/SkinPreview.tsx](../apps/client/src/ui/skins/SkinPreview.tsx) | 52 | R3F Canvas turntable preview showing creature with full skin (HSL + accessories + particles) |
| [ui/skins/RarityBadge.tsx](../apps/client/src/ui/skins/RarityBadge.tsx) | 29 | Pill badge displaying rarity with color; legendary pulse animation (respects reduced motion) |
| [ui/rooms/RoomCard.tsx](../apps/client/src/ui/rooms/RoomCard.tsx) | 83 | Room card: theme accent, player count, CURRENT/FULL badges |
| [ui/rooms/RoomBrowser.tsx](../apps/client/src/ui/rooms/RoomBrowser.tsx) | 156 | Room browser (inline + modal modes): card grid, live player counts, room switching |
| [ui/transitions/RoomTransition.tsx](../apps/client/src/ui/transitions/RoomTransition.tsx) | 26 | Full-screen CSS opacity fade overlay for room switches |

### Utilities

| File | Lines | Summary |
|------|------:|---------|
| [utils/math.ts](../apps/client/src/utils/math.ts) | 16 | `lerpAngle` — shortest-path angle interpolation |

### Dependency Graph

```
main.tsx → App.tsx
              ├── roomStore ← socket, playerStore, chatStore, voiceStore
              ├── skinStore ← socket
              ├── RoomBrowser (inline) ← roomStore, @cozy/shared
              │     └── RoomCard ← @cozy/shared
              ├── InRoomView
              │     ├── useVoice ← voiceStore, roomStore, playerStore, livekit-client
              │     ├── IsometricScene
              │     │     ├── CameraRig ← playerStore, config
              │     │     ├── RoomEnvironment (theme router)
              │     │     │     ├── RoomLighting ← config (ROOM_LIGHTING)
              │     │     │     ├── ClickPlane ← playerStore, @cozy/shared
              │     │     │     ├── SitSpotMarkers ← playerStore, roomStore
              │     │     │     └── CozyCafe | RooftopGarden | StarlightLounge
              │     │     ├── Creature ← playerStore, roomStore, skinStore, socket, @cozy/shared
              │     │     │     └── CreatureModel ← hslShader, AccessoryAttacher, ParticleEffect
              │     │     ├── RemotePlayers ← roomStore
              │     │     │     └── RemoteCreature ← roomStore, @cozy/shared, CreatureModel
              │     │     ├── NetworkSync ← playerStore, socket
              │     │     └── SpatialAudioManager ← voiceStore, playerStore, roomStore
              │     ├── ChatPanel ← chatStore, roomStore, voiceStore
              │     ├── VoiceControls ← voiceStore
              │     │     └── VoiceSettings ← voiceStore
              │     ├── SkinShop ← skinStore, @cozy/shared
              │     │     ├── SkinInventory ← skinStore, SkinPreview, RarityBadge
              │     │     └── SkinPreview ← CreatureModel
              │     ├── RoomBrowser (modal) ← roomStore, @cozy/shared
              │     └── RoomTransition ← roomStore
```

---

## Test Files (35 files, ~382 tests)

| File | Tests | What it covers |
|------|------:|----------------|
| `Packages/shared/src/constants/config.test.ts` | 13 | Constants validation incl. voice spatial, PTT, throttle, room transition |
| `Packages/shared/src/constants/creatures.test.ts` | 4 | DEFAULT_CREATURE exists, all creatures have required fields + description |
| `Packages/shared/src/constants/rooms.test.ts` | 2 | DEFAULT_ROOM exists, all rooms have required fields |
| `Packages/server/src/socket/validation.test.ts` | 24 | isFiniteNumber, clamp, stripControlChars, sanitizePosition, createRateLimiter |
| `Packages/server/src/rooms/Room.test.ts` | 27 | add/remove/get player, capacity, getState, getInfo, sit spot occupancy/release |
| `Packages/server/src/rooms/RoomManager.test.ts` | 12 | Init, getRoom, listRooms, joinRoom, leaveRoom |
| `Packages/server/src/socket/chatHandler.test.ts` | 13 | sanitizeChatContent (8 cases), chat history ring buffer (5 cases) |
| `Packages/server/src/socket/profanityFilter.test.ts` | 9 | Replacement, case insensitivity, partial words, punctuation |
| `Packages/server/src/api/voice.test.ts` | 6 | Token endpoint validation (empty body, missing fields, non-string), success, JWT format |
| `Packages/server/src/socket/voiceHandler.test.ts` | 2 | cleanupVoice safety with unknown/repeated socket ids |
| `apps/client/src/utils/math.test.ts` | 5 | lerpAngle boundary behavior |
| `apps/client/src/stores/playerStore.test.ts` | 7 | Store actions: setTarget, setPosition, reset |
| `apps/client/src/stores/voiceStore.test.ts` | 17 | Toggle mute/deafen, linked states, volume clamping, reset, modes |
| `apps/client/src/config.test.ts` | 2 | CREATURE_COLORS completeness and hex format |
| `Packages/server/src/db/database.test.ts` | 5 | Schema init, singleton, close/reopen, table/index verification |
| `Packages/server/src/db/playerQueries.test.ts` | 6 | CRUD operations, name lookup |
| `Packages/shared/src/constants/skins.test.ts` | 16 | All skins reference valid creatures/sets/rarities, colorShift bounds, particles only on legendary, coverage per creature |
| `apps/client/src/creatures/shaders/hslShader.test.ts` | 8 | Material cloning, uniform storage, degree→radian conversion, cache key uniqueness |
| `apps/client/src/creatures/accessories/boneUtils.test.ts` | 5 | Bone search (case-insensitive substring match), missing bone returns null |
| `apps/client/src/creatures/accessories/accessoryFactories.test.ts` | 3 | All types have factories, each returns Object3D |
| `apps/client/src/creatures/effects/ParticleEffect.test.ts` | 2 | Config validation — all effect types in SKINS have particle counts defined |
| `Packages/server/src/db/inventoryQueries.test.ts` | 8 | Inventory CRUD, ownership check, grantDefaultSkins idempotency |
| `Packages/server/src/api/skins.test.ts` | 11 | REST endpoints: GET catalog, GET inventory, POST equip (ownership, creature match, unknown skin, unequip) |
| `apps/client/src/stores/skinStore.test.ts` | 12 | State management: init, reset, equip emit/callback/timeout/guard, unequip, fetchInventory |
