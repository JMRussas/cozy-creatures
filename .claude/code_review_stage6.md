# Stage 6 Code Review — Hangout Spaces

28 findings total: **2 Critical, 4 High, 10 Medium, 12 Low**

All Critical, High, and Medium findings resolved. Low findings accepted.

## Critical (2/2 resolved)

| # | File | Finding | Resolution |
|---|------|---------|------------|
| C1 | connectionHandler.ts | Room switch leaves player in limbo if target room join fails (handleLeave before join check) | Pre-check target room capacity before calling handleLeave |
| C2 | Creature.tsx | Module-level mutable `wasSitting` shared across instances/HMR | Changed to `useRef` scoped to component instance |

## High (4/4 resolved)

| # | File | Finding | Resolution |
|---|------|---------|------------|
| H3 | connectionHandler.ts | Server doesn't reject `player:move` while player is sitting | Added `movingPlayer.sitSpotId` check before updating position |
| H4 | roomStore.ts | `room:state` listener timing during transition | Accepted risk — guard already works, cosmetic only |
| H5 | SitSpotMarker.tsx | Subscribing to entire `players` object causes re-render on every remote movement | Changed to targeted selectors (`useRoomStore(s => ...)`) returning booleans |
| H6 | roomStore.ts | switchRoom setTimeout not cleared on leave | Added `switchTimeoutHandle` tracking + `clearSwitchTimeout()` called in `leave()` |

## Medium (8/10 resolved, 2 accepted)

| # | File | Finding | Resolution |
|---|------|---------|------------|
| M7 | RoomCard.tsx | Dead code `room.name === room.name` always true | Fixed — now uses `ROOMS[room.id as RoomId].description` |
| M8 | RoomCard.tsx | Duplicated room descriptions vs ROOMS constant | Removed duplicate `getDescription()` function, reads from ROOMS |
| M9 | StarlightLounge.tsx | Star count `120` hardcoded in 4 places | Extracted to `STAR_COUNT` constant |
| M10 | ClickPlane.tsx | Clicking ground doesn't clear `pendingSitId` | Added `setPendingSit(null)` when clicking away from sit spots |
| M11 | SitSpotMarker.tsx | Cursor style not cleaned up on unmount | Added `useEffect` cleanup that resets cursor |
| M12 | connectionHandler.ts | Invalid room ID silently falls back to DEFAULT_ROOM | Changed to reject with error for invalid room IDs |
| M13 | Environments | Geometry objects recreated per mount | Accepted — not critical at current scale (3 rooms × ~20 geometries) |
| M14 | RoomLighting.tsx | Unsafe `as unknown as` casts for readonly position tuples | Changed to spread: `[...preset.main.position]` |
| M15 | StarlightLounge.tsx | useFrame may write to disposed geometry | Accepted — `pointsRef.current` null check sufficient |
| M16 | Room.ts | `releaseSitSpot` linear scan | Accepted — O(n) with n ≤ 5 sit spots is negligible |

## Low (12 accepted)

L17–L28: Type safety gaps (SitSpot.id as string, room:player-count roomId), UX tuning (3s cooldown), geometry sharing (SitSpotMarker circles), non-null assertions in array destructuring, magic number in ClickPlane padding, RoomEnvironment hard-swap timing. All acceptable at current scale.
