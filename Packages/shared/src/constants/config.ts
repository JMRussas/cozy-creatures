// Cozy Creatures - Shared Config Constants
//
// Numeric limits and timing constants shared between client and server.
// Avoids hardcoding the same values in multiple places.
//
// Depends on: nothing
// Used by:    client (NetworkSync, playerStore, App), server (connectionHandler, config)

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
