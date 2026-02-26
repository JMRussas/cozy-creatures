// Cozy Creatures - Profanity Filter Tests
//
// Depends on: socket/profanityFilter.ts
// Used by:    test runner

import { describe, it, expect } from "vitest";
import { filterProfanity } from "./profanityFilter.js";

describe("filterProfanity", () => {
  it("replaces a blocked word with ***", () => {
    expect(filterProfanity("that is damn cool")).toBe("that is *** cool");
  });

  it("is case-insensitive", () => {
    expect(filterProfanity("DAMN")).toBe("***");
    expect(filterProfanity("Damn")).toBe("***");
    expect(filterProfanity("dAmN")).toBe("***");
  });

  it("replaces multiple blocked words", () => {
    expect(filterProfanity("damn and shit")).toBe("*** and ***");
  });

  it("preserves non-blocked words", () => {
    expect(filterProfanity("hello world")).toBe("hello world");
  });

  it("preserves punctuation around blocked words", () => {
    expect(filterProfanity("damn!")).toBe("***!");
    expect(filterProfanity("(shit)")).toBe("(***)")
  });

  it("does not filter partial matches inside other words", () => {
    expect(filterProfanity("class")).toBe("class");
    expect(filterProfanity("assistant")).toBe("assistant");
    expect(filterProfanity("shitake")).toBe("shitake");
  });

  it("returns empty string unchanged", () => {
    expect(filterProfanity("")).toBe("");
  });

  it("handles string with only blocked words", () => {
    expect(filterProfanity("shit")).toBe("***");
  });

  it("handles mixed clean and blocked words", () => {
    expect(filterProfanity("what the hell is going on")).toBe(
      "what the *** is going on",
    );
  });
});
