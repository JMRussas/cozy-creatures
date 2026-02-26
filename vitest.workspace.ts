import { defineWorkspace } from "vitest/config";

export default defineWorkspace([
  "Packages/server",
  "Packages/shared",
  "apps/client",
]);
