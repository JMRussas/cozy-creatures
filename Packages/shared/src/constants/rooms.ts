// Cozy Creatures - Room Constants
//
// Predefined room configurations.
//
// Depends on: nothing
// Used by:    client room browser, server room manager

export interface RoomConfig {
  id: string;
  name: string;
  theme: string;
  maxPlayers: number;
  description: string;
}

export const ROOMS: Record<string, RoomConfig> = {
  "cozy-cafe": {
    id: "cozy-cafe",
    name: "Cozy Cafe",
    theme: "cozy-cafe",
    maxPlayers: 20,
    description: "Warm lighting, tiny tables, and the smell of coffee.",
  },
  "rooftop-garden": {
    id: "rooftop-garden",
    name: "Rooftop Garden",
    theme: "rooftop-garden",
    maxPlayers: 20,
    description: "Plants, fairy lights, and a sunset view.",
  },
  "starlight-lounge": {
    id: "starlight-lounge",
    name: "Starlight Lounge",
    theme: "starlight-lounge",
    maxPlayers: 20,
    description: "Dark purple ambiance with constellations on the floor.",
  },
};

export const DEFAULT_ROOM = "cozy-cafe";
