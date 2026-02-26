// Cozy Creatures - Server Config
//
// All server configuration values. Read from environment variables with defaults.
//
// Depends on: nothing
// Used by:    index.ts, all server modules

export const config = {
  port: parseInt(process.env.PORT ?? "3001", 10),
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
};
