# Code Review — Voice Chat (Stage 3.5)

Thorough code review of voice chat implementation (LiveKit integration, spatial audio, voice UI). All 28 findings resolved across 5 passes.

## Summary

- **28 findings**: 5 critical, 7 high, 11 medium, 5 low
- **All resolved** in 5 passes (server → client hooks → client UI → tests → docs)
- **Tests**: 229 → 253 (24 new tests added)
- **~18 files modified**

## Findings

### Critical (5)

| ID | Finding | Fix | File |
|----|---------|-----|------|
| C1 | No auth on voice token endpoint — any playerId accepted | Verify player is in room via `roomManager.getRoom()` + `room.getPlayer()` | api/voice.ts |
| C2 | LiveKit credentials default silently in production | Throw on startup if `LIVEKIT_API_KEY`/`SECRET` unset in production | config.ts |
| C3 | useVoice async effect race condition on unmount | Added `cancelled` flag checked after every `await` | useVoice.ts |
| C4 | AudioContext never closed in SpatialAudioManager | Added `audioCtx.close()` in `cleanupAll()` function | SpatialAudioManager.tsx |
| C5 | Module-level `spatialSources` Map leaks across mounts | Moved to `useRef` inside component; helpers accept map parameter | SpatialAudioManager.tsx |

### High (7)

| ID | Finding | Fix | File |
|----|---------|-----|------|
| H1 | PTT key fires while typing in text inputs | Guard on `e.target.tagName` (INPUT/TEXTAREA/SELECT) | useVoice.ts |
| H2 | LiveKit Room event listeners never removed | `setupRoomEvents()` returns teardown function; called in cleanup | useVoice.ts |
| H3 | SpeakingIndicator re-renders on every speaking change | Read via `useVoiceStore.getState()` imperatively in `useFrame` | SpeakingIndicator.tsx |
| H4 | ChatPanel re-renders on every remoteSpeaking change | Extracted `SpeakingDot` component with per-player subscription | ChatPanel.tsx |
| H5 | VoiceSettings mic meter race condition on device change | Added `cancelled` flag; stop tracks immediately if cleaned up | VoiceSettings.tsx |
| H6 | Gain value changes cause audio clicks/pops | `setTargetAtTime()` with 20ms ramp; `setValueAtTime()` for init | SpatialAudioManager.tsx |
| H7 | Map mutation during iteration in spatial cleanup | Collect keys to array first, then delete | SpatialAudioManager.tsx |

### Medium (11)

| ID | Finding | Fix | File |
|----|---------|-----|------|
| M1 | Unsafe `as VoiceTokenRequest` cast on req.body | Changed to `as Record<string, unknown>` with runtime checks | api/voice.ts |
| M2 | No explicit TTL on LiveKit JWT | Added `ttl: "1h"` to AccessToken options | api/voice.ts |
| M3 | No whitespace/length validation on token request | Added `.trim()` checks and `MAX_PLAYER_NAME` enforcement | api/voice.ts |
| M4 | Deafen doesn't apply to late-joining participants | Added `RoomEvent.TrackSubscribed` listener in `setupRoomEvents` | useVoice.ts |
| M5 | Unclear why `resetVoice` preserves some fields | Added JSDoc documenting 5 preserved user-preference fields | voiceStore.ts |
| M6 | `remoteSpeaking` not cleaned up on player:left | Added `useVoiceStore.setState` cleanup in player:left handler | roomStore.ts |
| M7 | VoiceControls buttons missing aria-labels | Added `aria-label` to all 3 buttons + status dot | VoiceControls.tsx |
| M8 | VoiceSettings panel missing dialog semantics | Added `role="dialog"` `aria-modal="true"` `aria-label` | VoiceSettings.tsx |
| M9 | Dual mic stream trade-off undocumented | Added comment explaining separate getUserMedia for level meter | VoiceSettings.tsx |
| M10 | VoiceSettings Escape conflicts with ChatPanel | Capture phase + `stopPropagation()` for Escape handler | VoiceSettings.tsx |
| M11 | AudioRangeRing conditional return after hooks | Changed to `<group visible={spatialEnabled}>` wrapper | AudioRangeRing.tsx |

### Low (5)

| ID | Finding | Fix | File |
|----|---------|-----|------|
| L1 | Docker image tag unpinned (`latest`) | Pinned to `livekit/livekit-server:v1.8.3` | docker-compose.yml |
| L2 | events.ts dependency header missing voice.ts | Added `voice.ts` to Depends on list | events.ts |
| L3 | Sweep timing constants hardcoded | Made env-configurable via `SWEEP_INTERVAL_MS`/`SWEEP_MAX_AGE_MS` | config.ts |
| L4 | voiceHandler validation not testable | Extracted `isValidVoiceState()` as exported pure function; 10 tests | voiceHandler.ts |
| L5 | voiceStore broadcast not tested | Added socket mock via `vi.hoisted()`; 4 broadcast tests | voiceStore.test.ts |

## New Tests Added (24)

| File | New Tests | Total |
|------|----------:|------:|
| `voice.test.ts` (server) | +4 (whitespace, length, 404, 403) | 11 |
| `voiceHandler.test.ts` | +10 (isValidVoiceState) | 12 |
| `voiceStore.test.ts` | +4 (socket broadcast) | 21 |
| **Totals** | **+18 unique (+6 dist mirrors)** | **253** |
