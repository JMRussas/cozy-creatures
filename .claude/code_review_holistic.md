# Holistic Code Review — All Packages

Post-Stage 5 cross-cutting review. Covers `@cozy/client`, `@cozy/server`, `@cozy/shared`.

## Summary

- **7 HIGH** findings, all resolved
- **10 MEDIUM** findings, 9 resolved (1 skipped — see M7)
- **12 LOW** findings documented for future

## HIGH — Resolved

| ID | Package | Issue | Resolution |
|----|---------|-------|------------|
| H1 | client | `SkinPreview.tsx` created a second WebGL Canvas in the modal | Merged into `CreaturePreview` (added `skinId`, `size` props). Deleted `SkinPreview.tsx`. |
| H2 | client | `player:moved` spreads entire `players` record per update (~10Hz/player) | Downgraded: `RemoteCreature` already reads position imperatively via `useFrame` — no React re-renders. Only cost is GC pressure (~200 short-lived objects/sec in a 20-player room). Documented as optimization opportunity. |
| H3 | client | `new AudioContext()` without resume guard | Added suspended-state check + one-shot click/keydown resume listeners in `SpatialAudioManager.tsx`. |
| H4 | client | `accessoryFactories.ts` — every factory call creates new geometry/material | Added template cache (`Map<string, Object3D>`). `createAccessory()` returns `.clone()` which shares geometry/materials. |
| H5 | client | `skinStore.ts` `fetchInventory` silently swallows errors | Added `inventoryError` state, set on fetch failure, cleared on success/reset. |
| H6 | shared | `skinId` typed as `string` in 5 places where `SkinId` union exists | Changed `Player.skinId`, `PlayerProfile.equippedSkinId`, event types, and `VoiceTokenRequest.roomId` to proper union types. |
| H7 | shared | `SkinAccessory.type: string` should be union | Added `AccessoryType` union of 10 valid accessory type names. |

## MEDIUM — Resolved

| ID | Package | Issue | Resolution |
|----|---------|-------|------------|
| M1 | client | `CreatureShadow.tsx` inline geometry/material | Extracted module-scope singletons (`shadowGeometry`, `shadowMaterial`). |
| M2 | client | `AudioRangeRing.tsx` inline geometry/material | Extracted module-scope singletons (`ringGeometry`, `ringMaterial`). |
| M3 | client | `SkinShop.tsx` Escape handler conflicts with ChatPanel | Changed to capture-phase listener with `stopPropagation()`. |
| M4 | client | `App.tsx` `loadStored` name validator allows strings exceeding `MAX_PLAYER_NAME` | Added `v.length <= MAX_PLAYER_NAME` to validator. |
| M5 | client | Non-null assertions replaceable with narrowing | Replaced `!` with proper narrowing in `App.tsx`. |
| M6 | client | `CreatureModel.tsx` clone Object3D wrappers never disposed | Added skeleton disposal on unmount (`SkinnedMesh.skeleton.dispose()`). |
| M7 | client | `Ground.tsx` invisible raycasting plane uses transparent material | **SKIPPED** — `visible={false}` also disables raycasting. Transparent material is correct here. |
| M8 | server | Player-existence check duplicated in `api/skins.ts` | Extracted `playerExists()` to `playerQueries.ts`, updated skins API to use it. |
| M9 | server | `Room.addPlayer` returned `boolean` — duplicate join reports wrong error | Changed to `null \| "duplicate" \| "full"`. Updated `RoomManager.joinRoom` to return discriminated union. Updated `connectionHandler` error mapping. |
| M10 | server | No rate limiting on REST `/api/skins/*` and `/api/voice/token` | Added IP-based rate limiter middleware (200ms/req default, configurable via `API_RATE_MS`). Health endpoint exempt. |

## LOW — Documented Only

| ID | Package | Issue |
|----|---------|-------|
| L1 | shared | Several exports only used by one consumer (could be internal) |
| L2 | server | Console logging throughout — no structured logging |
| L3 | client | Missing `aria-label` on some interactive elements |
| L4 | all | No authentication (planned for Stage 7) |
| L5 | client | Minor type casts at SKINS lookup boundaries (`as SkinId`) |
| L6 | client | Unused accessory factory types (no skins reference them yet) |
| L7 | server | `chatHandler` ring buffer is unbounded per-room count |
| L8 | client | Voice settings panel has no error boundary |
| L9 | server | SQLite WAL mode checkpoint not explicitly managed |
| L10 | client | `useGLTF.preload` not called — models load on first render |
| L11 | shared | `InventoryItem.skinId` remains `string` (circular dep prevents `SkinId`) |
| L12 | client | `noUncheckedIndexedAccess` required `!` assertions on typed array indices |

## Type Safety Notes

The `SKINS` constant uses `satisfies Record<string, SkinDefinition>` to preserve literal types for autocomplete. This creates narrow union types when doing `SKINS[id]` — TypeScript sees a union of all 30 literal object types instead of `SkinDefinition`. Fixed by adding explicit `SkinDefinition` type annotations at lookup sites and `as SkinDefinition[]` casts on `Object.values(SKINS)`.

The `noUncheckedIndexedAccess: true` setting (in `tsconfig.base.json`) means `array[i]` returns `T | undefined` even for typed arrays (`Float32Array`). Fixed with `!` assertions where bounds are statically guaranteed.

## Test Results

- **373 tests** across 35 files — all passing
- `pnpm build` clean (no type errors)
- `pnpm test` clean (zero failures)
