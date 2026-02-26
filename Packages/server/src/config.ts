// Cozy Creatures - Server Config
//
// All server configuration values. Read from environment variables with defaults.
// Validates parsed integers on startup — NaN from bad env vars will throw immediately.
//
// Depends on: @cozy/shared (POSITION_UPDATE_THROTTLE_MS, CHAT_RATE_LIMIT_MS)
// Used by:    index.ts, socket/connectionHandler.ts, socket/chatHandler.ts

import { POSITION_UPDATE_THROTTLE_MS, CHAT_RATE_LIMIT_MS } from "@cozy/shared";

/** Parse an env var as an integer, throwing on non-integer or out-of-bounds values. */
function parseIntEnv(
  value: string | undefined,
  defaultValue: number,
  name: string,
  min?: number,
): number {
  const raw = value ?? String(defaultValue);
  const parsed = Number(raw);
  if (!Number.isInteger(parsed)) {
    throw new Error(
      `Invalid config: ${name} must be a valid integer (got "${value}")`,
    );
  }
  if (min !== undefined && parsed < min) {
    throw new Error(
      `Invalid config: ${name} must be >= ${min} (got ${parsed})`,
    );
  }
  return parsed;
}

export const config = {
  port: parseIntEnv(process.env.PORT, 3001, "PORT", 1),
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:5173",

  /** Minimum interval (ms) between player:move events per socket. */
  moveRateMs: parseIntEnv(
    process.env.MOVE_RATE_MS,
    POSITION_UPDATE_THROTTLE_MS,
    "MOVE_RATE_MS",
    0,
  ),

  /** Maximum Socket.io payload size in bytes. */
  maxHttpBufferSize: parseIntEnv(
    process.env.MAX_HTTP_BUFFER_SIZE,
    10000,
    "MAX_HTTP_BUFFER_SIZE",
    1,
  ),

  /** Maximum concurrent socket connections per IP address. */
  maxConnectionsPerIp: parseIntEnv(
    process.env.MAX_CONNECTIONS_PER_IP,
    5,
    "MAX_CONNECTIONS_PER_IP",
    1,
  ),

  /** Minimum interval (ms) between chat:message events per socket. */
  chatRateMs: parseIntEnv(
    process.env.CHAT_RATE_MS,
    CHAT_RATE_LIMIT_MS,
    "CHAT_RATE_MS",
    0,
  ),

  /** Interval (ms) between rate-limiter / IP-count sweep passes. */
  sweepIntervalMs: 60_000,

  /** Max age (ms) of a rate-limiter entry before it's eligible for sweep. */
  sweepMaxAgeMs: 30_000,
};
