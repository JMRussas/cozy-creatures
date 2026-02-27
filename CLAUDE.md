# Cozy Creatures

Web-based social app where users are cute low-poly creature avatars hanging out in isometric themed spaces. Collectible skins (LoL/TFT model). Built with React Three Fiber + TypeScript.

## Quick Start

```bash
pnpm install          # Install all dependencies
docker compose up -d  # Start LiveKit server (port 7880)
pnpm dev              # Start client (5173) + server (3001) in parallel
pnpm dev:client       # Client only
pnpm dev:server       # Server only
pnpm build            # Production build
```

> **3D Models:** Creature models (`.glb` files) are not included — they are commercial assets. The app runs without them using procedural fallbacks. See [`apps/client/public/assets/creatures/README.md`](apps/client/public/assets/creatures/README.md) for model format requirements.

## Project Structure

```
cozy-creatures/
├── pnpm-workspace.yaml           # Monorepo config
├── tsconfig.base.json            # Shared TS config
├── package.json                  # Root scripts (pnpm dev, build)
│
├── apps/
│   └── client/                   # React + Vite + R3F (port 5173)
│       ├── src/
│       │   ├── main.tsx          # Entry point
│       │   ├── App.tsx           # Root component (join form + InRoomView + room browser)
│       │   ├── scene/            # Three.js scene, camera
│       │   │   └── environments/ # Per-room 3D environments, click plane, sit spots, lighting
│       │   ├── creatures/        # glTF models, animations, shaders, accessories, particles, overlays/
│       │   ├── ui/               # Feature subfolders: chat/, voice/, skins/, creatures/, rooms/, transitions/
│       │   ├── networking/       # Socket.io client, LiveKit voice, spatial audio
│       │   ├── stores/           # Zustand stores (player, room, chat, voice, skin)
│       │   ├── utils/            # Shared math helpers
│       │   ├── input/            # Click-to-move, keyboard
│       │   └── assets/           # Static assets
│       └── vite.config.ts        # Vite config + proxy to server
│
├── Packages/
│   ├── server/                   # Express + Socket.io (port 3001)
│   │   └── src/
│   │       ├── index.ts          # Server entry point
│   │       ├── config.ts         # Server config (env vars)
│   │       ├── socket/           # Socket.io handlers (connection, chat, voice)
│   │       ├── rooms/            # Room management
│   │       ├── auth/             # Auth (simple → OAuth)
│   │       ├── db/               # SQLite (better-sqlite3) — player + inventory persistence
│   │       └── api/              # REST endpoints (voice token, skins)
│   │
│   └── shared/                   # Shared TypeScript types (@cozy/shared)
│       └── src/
│           ├── types/            # Player, Creature, Room, Chat, Voice, Skin, Events
│           └── constants/        # Creature defs, room configs, voice config, skin registry
│
├── tools/
│   └── convert_creatures.py      # Blender FBX→glTF batch converter
│
└── apps/client/public/assets/    # Static creature models (served by Vite)
    └── creatures/                # otter, red-panda, sloth, chipmunk, possum, pangolin
        └── */model.glb           # glTF with embedded textures + animations
```

## Deep-Dive Docs

| Doc | Topic |
|-----|-------|
| [.claude/project_plan.md](.claude/project_plan.md) | Full development plan (stages 0-8) |
| [.claude/architecture.md](.claude/architecture.md) | System architecture, state machines, data flow |
| [.claude/asset_pipeline.md](.claude/asset_pipeline.md) | Asset catalog, import workflow |
| [.claude/code_review.md](.claude/code_review.md) | Post-Stage 2 code review findings (18 items, all resolved) |
| [.claude/code_review_stage3.md](.claude/code_review_stage3.md) | Post-Stage 3 code review (43 findings, all resolved) |
| [.claude/code_review_voice.md](.claude/code_review_voice.md) | Voice chat code review (28 findings, all resolved) |
| [.claude/code_review_stage4.md](.claude/code_review_stage4.md) | Creature system code review (14 findings, all resolved) |
| [.claude/code_review_stage5.md](.claude/code_review_stage5.md) | Skin system code review (52 findings, all resolved) |
| [.claude/code_review_holistic.md](.claude/code_review_holistic.md) | Holistic cross-package review (7H, 10M, 12L — all H/M resolved) |
| [.claude/code_review_stage6.md](.claude/code_review_stage6.md) | Stage 6 code review (2C, 4H, 10M, 12L — all C/H/M resolved) |
| [.claude/file_index.md](.claude/file_index.md) | Complete file index: summaries, line counts, dependency graphs |

## Tech Stack

| Layer | Tech |
|-------|------|
| 3D Rendering | React Three Fiber + drei |
| UI Framework | React 19 + TailwindCSS |
| Build Tool | Vite 6 |
| State | Zustand |
| Real-time | Socket.io |
| Voice Chat | LiveKit (self-hosted SFU) |
| Backend | Express (TypeScript) |
| Database | SQLite via better-sqlite3 (→ Postgres later) |
| 3D Assets | Cute Zoo 4 (SURIYUN) glTF via drei useGLTF |
| Language | TypeScript throughout |
| Monorepo | pnpm workspaces |

## Conventions

- **Language:** TypeScript everywhere, strict mode
- **Naming:** PascalCase for components/types, camelCase for functions/variables
- **File headers:** Every source file has dependency header (Depends on / Used by)
- **Config:** Server config via env vars (see `config.ts`), never hardcoded
- **Shared types:** All client/server shared types live in `@cozy/shared`
- **Imports:** Client and server import from `@cozy/shared` via workspace protocol
- **Proxy:** Vite proxies `/api` and `/socket.io` to the server in dev

## Gotchas

- **Packages/ casing:** The `Packages/` directory is capital-P (inherited from Unity). The pnpm-workspace.yaml uses `Packages/*` to match.
- **esbuild:** Must be in `onlyBuiltDependencies` in pnpm-workspace.yaml or Vite won't work.
- **LiveKit Docker:** Must run `docker compose up -d` before `pnpm dev` for voice chat. Dev key pair: `devkey:secret`.
- **LiveKit env vars:** `LIVEKIT_WS_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET` — defaults to local Docker dev values.
- **better-sqlite3:** Must be in `onlyBuiltDependencies` in pnpm-workspace.yaml (native C++ addon). Requires node-gyp build toolchain on Windows.
- **SkeletonUtils.clone():** Use `SkeletonUtils.clone(scene)` not `scene.clone()` for glTF models with animations — `scene.clone()` breaks skeleton bindings.
