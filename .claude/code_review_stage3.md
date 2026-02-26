# Code Review — Post Stage 3 (MVP Complete)

Thorough code review across all 3 packages after Stage 3 (chat system) completion. All findings resolved.

## Summary

- **36 source files, ~2,400 lines** across 3 packages
- **177 tests passing** (100 unique across 11 test files)
- **43 total findings identified, all resolved**

## Pass 1: Initial Cleanup (15 findings)

| # | Fix | File |
|---|-----|------|
| 1 | Type guard on `data` in chatHandler | chatHandler.ts |
| 2 | Removed chat content from server logs | chatHandler.ts |
| 3 | Expanded `stripControlChars` (zero-width, RTL, BOM) | validation.ts |
| 4 | Documented profanity filter limitations | profanityFilter.ts |
| 5 | Added `clearHistory()` export | chatHandler.ts |
| 6 | Documented dual `io.on("connection")` pattern | index.ts |
| 7 | ChatBubble selector -> primitive string | ChatBubble.tsx |
| 8 | Capped client message array (`CHAT_HISTORY_SIZE`) | chatStore.ts |
| 9 | Consolidated ChatPanel subscriptions with `useShallow` | ChatPanel.tsx |
| 10 | Escape key to close chat, replaced autoFocus | ChatPanel.tsx |
| 11 | Clear bubble timers on `chat:history` | chatStore.ts |
| 12 | Documented `chat:history` doesn't trigger bubbles | chatStore.ts |
| 13 | Removed stale "Stage 3 -- not yet implemented" comments | events.ts |
| 14 | Fixed incomplete dependency headers | socket.ts, roomStore.ts, chatStore.ts |
| 15 | Added missing file headers to 3 client test files | math.test.ts, playerStore.test.ts, config.test.ts |

## Pass 2: Deep Review (28 findings — 8M, 12L, 8N)

All resolved in a single 8-step cleanup pass.

### Medium (8) — All Resolved

| # | Fix | File |
|---|-----|------|
| M1 | Added TODO(Stage 4) comment on `player:moved` scalability | roomStore.ts |
| M2 | Added `useEffect` cleanup for material disposal | CreatureModel.tsx |
| M3 | Batched `setIsMoving`+`setPosition` on arrival, added TODO | Creature.tsx |
| M4 | Added rate limiter cleanup to `player:leave` handler | connectionHandler.ts |
| M5 | Extracted `TypedServer`/`TypedSocket` to `socket/types.ts` | types.ts (new), connectionHandler.ts, chatHandler.ts |
| M6 | Centralized sweep constants in config | config.ts, index.ts, connectionHandler.ts, chatHandler.ts |
| M7 | Changed `SocketData.roomId` to `RoomId`, removed cast | events.ts, chatHandler.ts |
| M8 | Added Stage 4+ annotations on `Player.skinId`, `PlayerProfile` | player.ts |

### Low (12) — All Resolved

| # | Fix | File |
|---|-----|------|
| L1 | IP sweep builds fresh map before swapping | index.ts |
| L2 | `parseIntEnv` uses strict `Number()` + `Number.isInteger()` | config.ts |
| L3 | Kept as-is (callers already check `roomManager.getRoom`) | Room.ts |
| L4 | Kept as-is (O(n) shift at n=50 is negligible) | chatHandler.ts |
| L5 | Empty rooms now clear chat history via `clearHistory` | connectionHandler.ts, Room.ts (added `playerCount` getter) |
| L6 | Batched into single `usePlayerStore.setState()` | Creature.tsx |
| L7 | Added per-creature phase offset for idle bob | RemoteCreature.tsx |
| L8 | Replaced double cast with spread `[...position]` | Lighting.tsx |
| L9 | Escape handler uses `window.addEventListener` | ChatPanel.tsx |
| L10 | Removed dead `fetchRooms` code | roomStore.ts |
| L11 | Added `joinState !== 'joined'` guard on `room:state` | roomStore.ts |
| L12 | Changed `[...BASE_ANIMATIONS]` to `BASE_ANIMATIONS` | creatures.ts |

### Nit (8) — All Resolved

| # | Fix | File |
|---|-----|------|
| N1 | Used `Object.fromEntries` in `getState()` | Room.ts |
| N2 | Added `min` bounds to `parseIntEnv` | config.ts |
| N3 | Close button uses `\u00d7` (multiplication sign) | ChatPanel.tsx |
| N4 | Added `aria-live="polite"` to message list | ChatPanel.tsx |
| N5 | Kept as-is (eslint-disable comment not worth adding) | NetworkSync.tsx |
| N6 | Already covered by existing tests (`expect(def.id).toBe(key)`) | creatures.test.ts, rooms.test.ts |
| N7 | Added JSDoc on event interfaces, Position, Player | events.ts, player.ts |
| N8 | Kept as-is (unused re-exports are part of public API) | index.ts |
