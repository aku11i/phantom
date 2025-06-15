import { equal, rejects } from "node:assert/strict";
import { describe, it, mock } from "node:test";
import { githubHandler } from "./github.ts";

describe("githubHandler", () => {
  it("should export githubHandler function", () => {
    equal(typeof githubHandler, "function");
  });

  it("should print help when no arguments provided", async () => {
    const consoleLogSpy = mock.method(console, "log", () => {});

    await githubHandler([]);

    equal(consoleLogSpy.mock.calls.length, 1);
    consoleLogSpy.mock.restore();
  });

  it("should throw error for unknown subcommand", async () => {
    await rejects(
      githubHandler(["unknown"]),
      /Unknown github subcommand: unknown/,
    );
  });
});
