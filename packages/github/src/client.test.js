import { equal } from "node:assert/strict";
import { describe, it } from "node:test";

describe("createGitHubClient", () => {
  it("should export createGitHubClient function", async () => {
    const { createGitHubClient } = await import("./client.ts");
    equal(typeof createGitHubClient, "function");
  });

  // Additional tests would require test harness improvements to properly mock
  // the singleton pattern used in client.ts
});