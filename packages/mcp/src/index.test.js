import { describe, it, mock } from "node:test";
import assert from "node:assert/strict";

describe("MCP Server", () => {
  it("should export serve function", async () => {
    const { serve } = await import("./index.ts");
    assert.equal(typeof serve, "function");
  });
});