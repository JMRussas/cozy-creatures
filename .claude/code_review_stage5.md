# Code Review — Skin & Collection System (Stage 5)

Thorough code review of the skin system implementation (HSL shader, accessories, particles, backend persistence, shop UI). All 52 findings resolved across 2 review passes (server+shared and client in parallel).

## Summary

- **52 findings**: 1 critical, 3 high, 16 medium, 32 low
- **All resolved** in 2 passes (server + client parallel review, then fixes)
- **Tests**: 350 → 352 (2 new tests added during review fixes)
- **12 files modified** during review fixes

## Findings — Server & Shared

### High (2)

| ID | Finding | Fix | File |
|----|---------|-----|------|
| S-H1 | `player:equip-skin` handler skips creature type check when player not found in room (room/player null check was after creature type validation) | Reordered: validate room AND player exist first, then skinId, then creature match, then ownership | connectionHandler.ts |
| S-H2 | Socket `player:equip-skin` has no unequip path — only REST `POST /api/skins/equip` supports `null` skinId; socket typed as `string` only | Added empty string convention: `skinId === ""` means unequip, persists `null` to DB, broadcasts `skinId: null` | connectionHandler.ts |

### Medium (7)

| ID | Finding | Fix | File |
|----|---------|-----|------|
| S-M1 | `skins.ts` API uses inline `getDb()` SQL instead of query abstractions from `inventoryQueries.ts` | Acknowledged — REST endpoint is thin layer, inline is acceptable for reads | skins.ts (no change) |
| S-M2 | `grantDefaultSkins` only called for new players, not returning players with new creature type | Called `grantDefaultSkins` for both `existing` and new player paths (idempotent) | connectionHandler.ts |
| S-M3 | Equipped skin not cleared on creature type switch — stale skin persists in DB | Added creature type validation on join: if equipped skin doesn't match new creature, call `setEquippedSkin(playerId, null)` | connectionHandler.ts |
| S-M4 | `ALTER TABLE` try-catch swallows all errors including real failures (disk full, corruption) | Check error message for "duplicate column" substring; re-throw anything else | database.ts |
| S-M5 | Missing test for unknown skinId in POST equip endpoint | Added test case: "returns 400 for unknown skinId" | skins.test.ts |
| S-M6 | `inventoryQueries.ts` `removeFromInventory` unused — added for completeness but never called | Acknowledged — useful for future admin/trading features | (no change) |
| S-M7 | `connectionHandler.ts` now imports `SKINS` from shared — coupling acceptable? | Yes — shared constants are designed to be imported by both client and server | (no change) |

### Low (10)

Minor items: consistent error message wording, JSDoc on new DB functions, `as keyof typeof SKINS` casts (safe — guarded by `in` check), import ordering.

## Findings — Client

### Critical (1)

| ID | Finding | Fix | File |
|----|---------|-----|------|
| C-C1 | `skinStore.equipSkin()` has no timeout — if server never responds to `player:equip-skin`, `isEquipping` stays `true` forever, permanently blocking equips | Added `EQUIP_TIMEOUT_MS` (5s) with `clearEquipTimeout` helper, matching roomStore's join timeout pattern | skinStore.ts |

### High (1)

| ID | Finding | Fix | File |
|----|---------|-----|------|
| C-H1 | `skinStore.equipSkin()` emits to socket without checking `socket.connected` — emitting on disconnected socket silently fails, `isEquipping` never resets | Added `socket.connected` guard with early return and error message | skinStore.ts |

### Medium (9)

| ID | Finding | Fix | File |
|----|---------|-----|------|
| C-M1 | SkinShop has no Escape key handler to close | Added `useEffect` with `keydown` listener for Escape | SkinShop.tsx |
| C-M2 | SkinShop has no backdrop click to close | Added `onClick` on backdrop overlay | SkinShop.tsx |
| C-M3 | SkinShop missing ARIA attributes for modal | Added `role="dialog"`, `aria-modal="true"`, `aria-label` | SkinShop.tsx |
| C-M4 | `SkinInventory` `ownedSkins` array recomputed on every render (filter + sort) | Wrapped in `useMemo` with proper dependency array | SkinInventory.tsx |
| C-M5 | `skinStore.test.ts` `globalThis.fetch` mock not restored between tests | Added `afterEach` that restores `originalFetch` | skinStore.test.ts |
| C-M6 | Missing test for disconnected socket guard in skinStore | Added test: "does not emit when disconnected" | skinStore.test.ts |
| C-M7 | `SkinPreview` creates separate Canvas (second WebGL context) | Acknowledged — same pattern as `CreaturePreview`, documented tradeoff in Stage 4 review | (no change) |
| C-M8 | `SkinShop` hardcodes "All Sets" string for unfiltered state | Acceptable — UI-only string, not shared constant material | (no change) |
| C-M9 | `SkinInventory` sorts by rarity order on every filter, not just on inventory change | Covered by useMemo fix (C-M4) | SkinInventory.tsx |

### Low (12)

Minor items: `RarityBadge` animate-pulse accessibility (`motion-reduce:animate-none` added), unsafe `as SkinId` casts in Creature/RemoteCreature (runtime `in SKINS` guards added), consistent button styling, minor TypeScript refinements.

## File Changes

| File | Change |
|------|--------|
| `connectionHandler.ts` | Reordered equip-skin validations, added unequip path, grant default skins for returning players, clear stale skin on creature switch |
| `database.ts` | ALTER TABLE catch checks for "duplicate column" specifically |
| `skins.test.ts` (API) | Added unknown skinId test |
| `skinStore.ts` | Added equip timeout (5s), socket.connected guard, clearEquipTimeout helper |
| `skinStore.test.ts` | Restored globalThis.fetch in afterEach, added disconnected guard test |
| `SkinShop.tsx` | Escape key close, backdrop click close, ARIA dialog attributes |
| `SkinInventory.tsx` | useMemo for ownedSkins |
| `Creature.tsx` | Runtime `in SKINS` guard before SkinId cast |
| `RemoteCreature.tsx` | Runtime `in SKINS` guard before SkinId cast |
| `RarityBadge.tsx` | Added `motion-reduce:animate-none` to pulse animation |
