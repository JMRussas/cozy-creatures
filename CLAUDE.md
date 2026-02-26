# Cozy Creatures

Web-based social app where users are cute low-poly creature avatars hanging out in isometric themed spaces. Collectible skins (LoL/TFT model). Built with React Three Fiber + TypeScript.

## Quick Start

```bash
pnpm install          # Install all dependencies
pnpm dev              # Start client (5173) + server (3001) in parallel
pnpm dev:client       # Client only
pnpm dev:server       # Server only
pnpm build            # Production build
```

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
│       │   ├── App.tsx           # Root component
│       │   ├── scene/            # Three.js scene, camera, lighting
│       │   ├── creatures/        # Creature rendering + animation
│       │   ├── ui/               # React UI components
│       │   ├── networking/       # Socket.io client
│       │   ├── stores/           # Zustand state stores
│       │   ├── input/            # Click-to-move, keyboard
│       │   └── assets/           # Static assets
│       └── vite.config.ts        # Vite config + proxy to server
│
├── Packages/
│   ├── server/                   # Express + Socket.io (port 3001)
│   │   └── src/
│   │       ├── index.ts          # Server entry point
│   │       ├── config.ts         # Server config (env vars)
│   │       ├── socket/           # Socket.io event handlers
│   │       ├── rooms/            # Room management
│   │       ├── auth/             # Auth (simple → OAuth)
│   │       ├── db/               # Database layer
│   │       └── api/              # REST endpoints
│   │
│   └── shared/                   # Shared TypeScript types (@cozy/shared)
│       └── src/
│           ├── types/            # Player, Creature, Room, Chat, Events
│           └── constants/        # Creature defs, room configs
│
└── assets/                       # Source 3D models (glTF)
    ├── creatures/                # cat, fox, bunny, frog
    ├── environments/             # cozy-cafe, rooftop-garden
    └── props/
```

## Deep-Dive Docs

| Doc | Topic |
|-----|-------|
| [.claude/project_plan.md](.claude/project_plan.md) | Full development plan (stages 0-8) |
| [.claude/architecture.md](.claude/architecture.md) | System architecture, state machines, data flow |
| [.claude/asset_pipeline.md](.claude/asset_pipeline.md) | Asset catalog, import workflow |

## Tech Stack

| Layer | Tech |
|-------|------|
| 3D Rendering | React Three Fiber + drei |
| UI Framework | React 19 + TailwindCSS |
| Build Tool | Vite 6 |
| State | Zustand |
| Real-time | Socket.io |
| Backend | Express (TypeScript) |
| Database | SQLite (→ Postgres later) |
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
