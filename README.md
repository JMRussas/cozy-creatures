# cozy-creatures

**Multiplayer social hangout where players are cute low-poly animal avatars.**

A web-based social space built with React Three Fiber. Pick a creature, join a themed room, hang out with friends via text and spatial voice chat. Collect skins with cosmetic effects. Designed around the LoL/TFT collectible cosmetics model.

```
Browser Client                     Server                          Infrastructure
==============            ========================           ===================

 React Three Fiber  ←───→  Socket.io (real-time)  ←───→   SQLite (persistence)
 (3D scene, avatars)       Express (REST API)              LiveKit (voice SFU)
 Zustand (state)           Room management
 Web Audio (spatial)       Chat + profanity filter
 TailwindCSS (UI)          Skin inventory
```

## Features

**Creatures** — 6 animal avatars (otter, red panda, sloth, chipmunk, possum, pangolin) with glTF models, skeleton animations, and crossfade transitions. Bring your own models or use the procedural capsule fallbacks.

**Rooms** — 3 themed environments with procedural 3D geometry, per-room lighting, and interactive sit spots:
- Cozy Cafe — warm amber lighting, tables, bar counter, pendant lights
- Rooftop Garden — sunset sky, potted plants, benches, fairy lights
- Starlight Lounge — purple ambiance, constellation floor effect, glowing orbs

**Skins** — 30 collectible skins (5 per creature, 4 rarities) with HSL color-shift shaders, 10 procedural bone-attached accessories, and 4 GPU particle effects for legendary skins. SQLite-backed inventory with REST API.

**Voice Chat** — LiveKit WebRTC SFU with spatial audio (Web Audio PannerNode + HRTF), push-to-talk, per-user volume, mute/deafen. Self-hosted via Docker.

**Chat** — Text chat with profanity filter, floating 3D speech bubbles (drei Html), server-side history ring buffer.

**Multiplayer** — Socket.io real-time sync, click-to-move with position interpolation, room switching with fade transitions, server-authoritative sit spot occupancy.

## Quick Start

```bash
git clone https://github.com/JMRussas/cozy-creatures.git
cd cozy-creatures
pnpm install
docker compose up -d    # LiveKit voice server (port 7880)
pnpm dev                # Client (5173) + Server (3001)
```

> **3D Models:** Creature models (`.glb`) are not included (commercial assets). The app runs without them using procedural fallbacks. See [`apps/client/public/assets/creatures/README.md`](apps/client/public/assets/creatures/README.md) for format requirements.

## Architecture

```
apps/client/                              Packages/server/
├── scene/                                ├── socket/
│   ├── IsometricScene.tsx                │   ├── connectionHandler.ts
│   ├── environments/                     │   ├── chatHandler.ts
│   │   ├── CozyCafe.tsx                  │   └── voiceHandler.ts
│   │   ├── RooftopGarden.tsx             ├── rooms/
│   │   ├── StarlightLounge.tsx           │   ├── Room.ts
│   │   ├── SitSpotMarker.tsx             │   └── RoomManager.ts
│   │   └── ClickPlane.tsx                ├── db/
│   └── Camera.tsx                        │   ├── database.ts (SQLite)
├── creatures/                            │   ├── playerQueries.ts
│   ├── Creature.tsx (local player)       │   └── inventoryQueries.ts
│   ├── RemoteCreature.tsx                └── api/
│   ├── CreatureModel.tsx (glTF)          │   ├── voice.ts (LiveKit tokens)
│   ├── shaders/hslShader.ts              │   └── skins.ts (inventory REST)
│   ├── accessories/                      │
│   └── effects/ParticleEffect.tsx        Packages/shared/
├── stores/                               ├── types/ (Player, Room, Skin, Events)
│   ├── playerStore.ts                    └── constants/ (creatures, rooms, skins)
│   ├── roomStore.ts
│   ├── chatStore.ts
│   ├── voiceStore.ts
│   └── skinStore.ts
├── networking/
│   ├── NetworkSync.tsx (throttled position emit)
│   └── useVoice.ts (LiveKit lifecycle)
└── ui/
    ├── chat/ChatPanel.tsx
    ├── voice/VoiceControls.tsx
    ├── skins/SkinShop.tsx
    └── rooms/RoomBrowser.tsx
```

### Key Design Decisions

- **Shared types package.** All client/server types and constants live in `@cozy/shared`. Socket events are typed end-to-end with discriminated unions.
- **Imperative animation API.** `CreatureModel` exposes a `setAnimation()` ref handle — parents drive animations without React re-renders, keeping the render loop in `useFrame`.
- **Server-authoritative sit spots.** Sit spot occupancy is managed server-side with synchronous claim/release. Room switching pre-checks capacity before leaving the current room.
- **Zustand targeted selectors.** Store subscriptions use narrowly-scoped selectors (returning booleans/primitives) to avoid re-renders on unrelated state changes.
- **HSL shader injection.** Skin color shifts use `onBeforeCompile` GLSL injection on cloned MeshStandardMaterials — no custom shader needed, works with standard PBR lighting.
- **Spatial voice via Web Audio.** Each remote participant gets a PannerNode with HRTF positioning, driven by creature world positions each frame.

## Tech Stack

| Layer | Tech |
|-------|------|
| 3D Rendering | React Three Fiber + drei |
| UI | React 19 + TailwindCSS |
| State | Zustand |
| Real-time | Socket.io |
| Voice | LiveKit (self-hosted WebRTC SFU) |
| Backend | Express + TypeScript |
| Database | SQLite (better-sqlite3, WAL mode) |
| Build | Vite 6, pnpm workspaces |
| Testing | Vitest (382 tests across 24 files) |

## Development

```bash
pnpm dev              # Client + server in parallel
pnpm dev:client       # Client only (port 5173)
pnpm dev:server       # Server only (port 3001)
pnpm build            # Production build
pnpm test             # Run all tests
pnpm test:watch       # Watch mode
```

LiveKit requires Docker: `docker compose up -d` (dev key pair: `devkey:secret`).

Vite proxies `/api` and `/socket.io` to the server in dev mode.

## Project Structure

```
cozy-creatures/
├── apps/client/          React + Vite + R3F (browser client)
├── Packages/server/      Express + Socket.io (game server)
├── Packages/shared/      Shared types and constants (@cozy/shared)
├── tools/                Asset conversion scripts
├── docker-compose.yml    LiveKit SFU
└── pnpm-workspace.yaml   Monorepo config
```

## License

MIT
