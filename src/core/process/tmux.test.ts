import { strictEqual } from "node:assert";
import { describe, it } from "node:test";
import { buildWorktreeShellCommand, isInsideTmux } from "./tmux.ts";

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

  describe("buildWorktreeShellCommand", () => {
    it("should build correct command with default shell", () => {
      const originalShell = process.env.SHELL;
      process.env.SHELL = "/bin/bash";

      const command = buildWorktreeShellCommand(
        "/path/to/worktree",
        "feature-branch",
      );

      strictEqual(
        command,
        "/bin/bash -c 'PHANTOM=1 PHANTOM_NAME=feature-branch PHANTOM_PATH=/path/to/worktree exec /bin/bash'",
      );

      if (originalShell === undefined) {
        // biome-ignore lint/performance/noDelete: Need to actually remove env var for test
        delete process.env.SHELL;
      } else {
        process.env.SHELL = originalShell;
      }
    });

    it("should use custom shell when provided", () => {
      const command = buildWorktreeShellCommand(
        "/path/to/worktree",
        "feature-branch",
        "/usr/bin/zsh",
      );

      strictEqual(
        command,
        "/usr/bin/zsh -c 'PHANTOM=1 PHANTOM_NAME=feature-branch PHANTOM_PATH=/path/to/worktree exec /usr/bin/zsh'",
      );
    });

    it("should handle paths with spaces", () => {
      const command = buildWorktreeShellCommand(
        "/path with spaces/worktree",
        "feature branch",
        "/bin/sh",
      );

      strictEqual(
        command,
        '/bin/sh -c \'PHANTOM=1 PHANTOM_NAME="feature branch" PHANTOM_PATH="/path with spaces/worktree" exec /bin/sh\'',
      );
    });
  });
});
