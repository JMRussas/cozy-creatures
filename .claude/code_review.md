# Code Review — Post Stage 2 (Second Review)

Thorough hiring-manager-perspective code review conducted after Stage 2 completion and initial bug fixes. 18 findings organized by severity, resolved in 4 passes.

## Findings

### Red Flags (5)

| # | Finding | Location | Fix |
|---|---------|----------|-----|
| 1 | Duplicated `lerpAngle` | `Creature.tsx`, `RemoteCreature.tsx` | Extracted to `utils/math.ts` (Pass 2a) |
| 2 | Loose `string` types at wire boundary | `events.ts`, `chat.ts` | Tightened to `CreatureTypeId`/`RoomId` unions (Pass 1c) |
| 3 | Creature color not wired to `creatureType` | `Creature.tsx`, `RemoteCreature.tsx` | Added `CREATURE_COLORS` config, wired through stores (Pass 2b) |
| 4 | `playerStore` not synced with join data | `playerStore.ts`, `roomStore.ts` | Added `setName`/`setCreatureType`, synced on join (Pass 2d) |
| 5 | No client-side tests | `apps/client/` | Added vitest+jsdom, 14 tests across 3 files (Pass 4) |

### Yellow Flags (7)

| # | Finding | Location | Fix |
|---|---------|----------|-----|
| 6 | Weak HMR workaround comment | `roomStore.ts` | Enhanced comment explaining why `import.meta.hot.dispose()` wasn't used (Pass 2f) |
| 7 | Inline JSX materials cause GC churn | `CreatureModel.tsx` | Cached via `useMemo` + module-level singleton (Pass 2e) |
| 8 | `RoomConfig` in constants/ not types/ | `rooms.ts` | Moved to `types/room.ts`, extracted `RoomBase` interface (Pass 1a) |
| 10 | Magic numbers scattered in scene code | `Ground.tsx`, `Lighting.tsx`, `CreatureModel.tsx`, etc. | Extracted to `config.ts` (Pass 2c) |
| 11 | `connectionsPerIp` map can leak stale entries | `index.ts` | Added 60s periodic sweep from actual sockets (Pass 3a) |
| 12 | Test files compiled into shared `dist/` | `Packages/shared/tsconfig.json` | Added `exclude: ["src/**/*.test.ts"]` (Pass 1f) |
| 13 | `maxPlayers: 20` hardcoded in each room | `rooms.ts` | Extracted `DEFAULT_MAX_PLAYERS` constant (Pass 1b) |

### Minor Flags (6)

| # | Finding | Location | Fix |
|---|---------|----------|-----|
| 14 | `player:join` payload types too loose | `events.ts` | Covered by finding 2 (Pass 1c) |
| 15 | No `noUncheckedIndexedAccess` | `tsconfig.base.json` | Enabled, fixed all indexed access sites (Pass 1g) |
| 16 | `animations` array mutable on `CreatureDefinition` | `creature.ts` | Changed to `readonly string[]` (Pass 1d) |
| 18 | Duplicate test assertions | `creatures.test.ts`, `rooms.test.ts` | Removed redundant tests (Pass 1e) |

### Skipped (with rationale)

| # | Finding | Why skipped |
|---|---------|-------------|
| 9 | Redundant `id` fields in CREATURES/ROOMS | Self-describing objects useful when passed without key. High churn, low benefit. |
| 17 | Empty `InterServerEvents` | Idiomatic Socket.io placeholder required by `Server<>` generic. |

## Resolution Summary

| Pass | Scope | Findings | Status |
|------|-------|----------|--------|
| 1 | Shared package type tightening | 2, 8, 12, 13, 14, 15, 16, 18 | Done |
| 2 | Client refactoring | 1, 3, 4, 6, 7, 10 | Done |
| 3 | Server hardening | 11 | Done |
| 4 | Client test infrastructure | 5 | Done |

## Test Results After All Passes

- **78 tests across 9 files** — all passing
- **Typecheck clean** across all 3 packages
- 3 new client test files: `math.test.ts` (5), `playerStore.test.ts` (7), `config.test.ts` (2)
