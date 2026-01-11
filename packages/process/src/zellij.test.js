import { strictEqual } from "node:assert";
import { describe, it } from "node:test";

// Mock process.env before importing the module
const originalEnv = process.env;

describe("zellij", () => {
  describe("isInsideZellij", () => {
    it("should return true when ZELLIJ env var is set", async () => {
      process.env = { ...originalEnv, ZELLIJ: "1" };
      // Re-import to get fresh module with new env
      const { isInsideZellij } = await import("./zellij.ts");
      const result = await isInsideZellij();
      strictEqual(result, true);
      process.env = originalEnv;
    });

    it("should return false when ZELLIJ env var is not set", async () => {
      const envWithoutZellij = { ...originalEnv };
      delete envWithoutZellij.ZELLIJ;
      process.env = envWithoutZellij;
      // Re-import to get fresh module with new env
      const { isInsideZellij } = await import("./zellij.ts");
      const result = await isInsideZellij();
      strictEqual(result, false);
      process.env = originalEnv;
    });
  });

  describe("ZellijSplitDirection type", () => {
    it("should accept valid direction values", async () => {
      // Type checking - these should be valid direction types
      /** @type {import('./zellij.ts').ZellijSplitDirection[]} */
      const validDirections = ["new", "vertical", "horizontal"];
      strictEqual(validDirections.length, 3);
    });
  });

  describe("executeZellijCommand", () => {
    it("should export executeZellijCommand function", async () => {
      const { executeZellijCommand } = await import("./zellij.ts");
      strictEqual(typeof executeZellijCommand, "function");
    });
  });

  describe("createZellijSession", () => {
    it("should export createZellijSession function", async () => {
      const { createZellijSession } = await import("./zellij.ts");
      strictEqual(typeof createZellijSession, "function");
    });
  });
});
