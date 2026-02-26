// Cozy Creatures - Voice Types
//
// Voice chat state and event definitions shared between client and server.
//
// Depends on: nothing
// Used by:    client voiceStore, server voiceHandler, types/events.ts

/** Voice state broadcast to other players via Socket.io. */
export interface VoiceState {
  muted: boolean;
  deafened: boolean;
  speaking: boolean;
}

/** Token request body for POST /api/voice/token. */
export interface VoiceTokenRequest {
  playerId: string;
  playerName: string;
  roomId: string;
}

/** Token response from POST /api/voice/token. */
export interface VoiceTokenResponse {
  token: string;
  url: string;
}
