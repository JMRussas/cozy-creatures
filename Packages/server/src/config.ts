// Cozy Creatures - Server Config
//
// All server configuration values. Read from environment variables with defaults.
// Validates parsed integers on startup — NaN from bad env vars will throw immediately.
//
// Depends on: @cozy/shared (POSITION_UPDATE_THROTTLE_MS)
// Used by:    index.ts, socket/connectionHandler.ts

import { POSITION_UPDATE_THROTTLE_MS } from "@cozy/shared";

/** Parse an env var as an integer, throwing on NaN. */
function parseIntEnv(
  value: string | undefined,
  defaultValue: number,
  name: string,
): number {
  const parsed = parseInt(value ?? String(defaultValue), 10);
  if (isNaN(parsed)) {
    throw new Error(
      `Invalid config: ${name} must be a valid integer (got "${value}")`,
    );
  }
  return parsed;
}

export const config = {
  port: parseIntEnv(process.env.PORT, 3001, "PORT"),
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:5173",

  /** Minimum interval (ms) between player:move events per socket. */
  moveRateMs: parseIntEnv(
    process.env.MOVE_RATE_MS,
    POSITION_UPDATE_THROTTLE_MS,
    "MOVE_RATE_MS",
  ),

  /** Maximum Socket.io payload size in bytes. */
  maxHttpBufferSize: parseIntEnv(
    process.env.MAX_HTTP_BUFFER_SIZE,
    10000,
    "MAX_HTTP_BUFFER_SIZE",
  ),

  /** Maximum concurrent socket connections per IP address. */
  maxConnectionsPerIp: parseIntEnv(
    process.env.MAX_CONNECTIONS_PER_IP,
    5,
    "MAX_CONNECTIONS_PER_IP",
  ),
};
