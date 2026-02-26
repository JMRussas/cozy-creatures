// Cozy Creatures - Profanity Filter
//
// Simple word-list-based profanity filter. Replaces matched words with
// asterisks. Case-insensitive, whole-word matching via regex \b boundary.
//
// Limitations: Does not catch leet-speak (e.g. "sh1t"), spaced-out letters
// ("s h i t"), repeated characters ("shiiit"), or words not in the list.
// For a cozy social app this is acceptable — a more robust solution would
// use a dedicated library or external service.
//
// Depends on: nothing
// Used by:    socket/chatHandler.ts

const BLOCKED_WORDS = new Set([
  "ass",
  "bastard",
  "bitch",
  "crap",
  "damn",
  "dick",
  "fuck",
  "hell",
  "piss",
  "shit",
]);

/**
 * Replace profanity with "***". Case-insensitive, whole-word matching.
 * Non-blocked words and punctuation are preserved.
 */
export function filterProfanity(text: string): string {
  return text.replace(/\b(\w+)\b/g, (match) =>
    BLOCKED_WORDS.has(match.toLowerCase()) ? "***" : match,
  );
}
