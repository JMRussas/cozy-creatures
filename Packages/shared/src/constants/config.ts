// Cozy Creatures - Shared Config Constants
//
// Numeric limits and timing constants shared between client and server.
// Avoids hardcoding the same values in multiple places.
//
// Depends on: nothing
// Used by:    client (NetworkSync, playerStore, chatStore, App),
//             server (connectionHandler, chatHandler, config)

/** Maximum character length for player display names. */
export const MAX_PLAYER_NAME = 20;

/** Minimum interval (ms) between position update packets (~10 Hz). */
export const POSITION_UPDATE_THROTTLE_MS = 100;

/** Minimum allowed coordinate value for player positions. */
export const POSITION_MIN = -500;

/** Maximum allowed coordinate value for player positions. */
export const POSITION_MAX = 500;

/** Default maximum players per room. */
export const DEFAULT_MAX_PLAYERS = 20;

/** Maximum character length for a chat message. */
export const MAX_CHAT_MESSAGE = 200;

/** Number of recent messages stored per room (server-side ring buffer). */
export const CHAT_HISTORY_SIZE = 50;

/** Minimum interval (ms) between chat messages per player (~2/sec). */
export const CHAT_RATE_LIMIT_MS = 500;

/** Duration (ms) a chat bubble is displayed above a creature. */
export const CHAT_BUBBLE_DURATION_MS = 5000;

// --- Voice Chat ---

/** Minimum distance (world units) for spatial audio — full volume within this range. */
export const VOICE_SPATIAL_MIN_DISTANCE = 2;

/** Maximum distance (world units) for spatial audio — silent beyond this range. */
export const VOICE_SPATIAL_MAX_DISTANCE = 20;

/** Default push-to-talk key code. */
export const VOICE_PTT_KEY = "KeyV";

/** Minimum interval (ms) between voice state broadcasts. */
export const VOICE_STATE_THROTTLE_MS = 200;
