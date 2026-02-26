// Cozy Creatures - Voice State Handler
//
// Broadcasts voice state (muted, deafened, speaking) to other players
// in the same room. No server-side persistence — voice state is transient.
//
// Depends on: @cozy/shared (VoiceState), socket/types.ts,
//             socket/validation.ts (createRateLimiter), config.ts
// Used by:    index.ts, socket/connectionHandler.ts (cleanupVoice)

import type { VoiceState } from "@cozy/shared";
import type { TypedServer, TypedSocket } from "./types.js";
import { createRateLimiter } from "./validation.js";
import { config } from "../config.js";

const voiceStateLimiter = createRateLimiter(config.voiceStateRateMs);

setInterval(
  () => voiceStateLimiter.sweep(config.sweepMaxAgeMs),
  config.sweepIntervalMs,
).unref();

/** Clean up rate limiter entry on disconnect. Called by connectionHandler. */
export function cleanupVoice(socketId: string): void {
  voiceStateLimiter.clear(socketId);
}

/** Validate that data has the required VoiceState shape (all boolean fields). */
export function isValidVoiceState(data: unknown): data is VoiceState {
  if (data == null || typeof data !== "object") return false;
  const obj = data as Record<string, unknown>;
  return (
    typeof obj.muted === "boolean" &&
    typeof obj.deafened === "boolean" &&
    typeof obj.speaking === "boolean"
  );
}

/** Register voice state event listeners on each socket connection. */
export function registerVoiceHandler(io: TypedServer): void {
  io.on("connection", (socket: TypedSocket) => {
    socket.on("voice:state", (data: VoiceState) => {
      try {
        const { playerId, roomId } = socket.data;
        if (!playerId || !roomId) return;

        if (voiceStateLimiter.isRateLimited(socket.id)) return;

        if (!isValidVoiceState(data)) return;

        // Broadcast to others in the room (not back to sender)
        socket.to(roomId).emit("voice:state", {
          id: playerId,
          muted: data.muted,
          deafened: data.deafened,
          speaking: data.speaking,
        });
      } catch (err) {
        console.error("[voice] voice:state error:", err);
      }
    });
  });
}
