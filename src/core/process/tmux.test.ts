import { strictEqual } from "node:assert";
import { describe, it } from "node:test";
import { isInsideTmux, parseTmuxDirection } from "./tmux.ts";

describe("tmux", () => {
  describe("isInsideTmux", () => {
    it("should return true when TMUX env var is set", async () => {
      const originalTmux = process.env.TMUX;
      process.env.TMUX = "/tmp/tmux-1000/default,12345,0";

      const result = await isInsideTmux();
      strictEqual(result, true);

      if (originalTmux === undefined) {
        // biome-ignore lint/performance/noDelete: Need to actually remove env var for test
        delete process.env.TMUX;
      } else {
        process.env.TMUX = originalTmux;
      }
    });

    it("should return false when TMUX env var is not set", async () => {
      const originalTmux = process.env.TMUX;
      // biome-ignore lint/performance/noDelete: Need to actually remove env var for test
      delete process.env.TMUX;

      const result = await isInsideTmux();
      strictEqual(result, false);

      if (originalTmux !== undefined) {
        process.env.TMUX = originalTmux;
      }
    });
  });

  describe("parseTmuxDirection", () => {
    it("should parse valid directions", () => {
      strictEqual(parseTmuxDirection("new"), "new");
      strictEqual(parseTmuxDirection("vertical"), "vertical");
      strictEqual(parseTmuxDirection("horizontal"), "horizontal");
      strictEqual(parseTmuxDirection("v"), "v");
      strictEqual(parseTmuxDirection("h"), "h");
    });

    it("should return 'new' for boolean true", () => {
      strictEqual(parseTmuxDirection(true), "new");
    });

    it("should return 'new' for empty string", () => {
      strictEqual(parseTmuxDirection(""), "new");
    });

    it("should return 'new' for invalid values", () => {
      strictEqual(parseTmuxDirection("invalid"), "new");
      strictEqual(parseTmuxDirection("diagonal"), "new");
    });

    it("should be case insensitive", () => {
      strictEqual(parseTmuxDirection("NEW"), "new");
      strictEqual(parseTmuxDirection("Vertical"), "vertical");
      strictEqual(parseTmuxDirection("HORIZONTAL"), "horizontal");
      strictEqual(parseTmuxDirection("V"), "v");
      strictEqual(parseTmuxDirection("H"), "h");
    });
  });
});
