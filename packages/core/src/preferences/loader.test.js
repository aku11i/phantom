import { deepStrictEqual, equal } from "node:assert/strict";
import { describe, it, mock } from "node:test";

const executeGitCommandMock = mock.fn();

mock.module("@aku11i/phantom-git", {
  namedExports: {
    executeGitCommand: executeGitCommandMock,
  },
});

const { loadPreferences } = await import("./loader.ts");

describe("loadPreferences", () => {
  const resetMocks = () => {
    executeGitCommandMock.mock.resetCalls();
  };

  it("returns editor and ai preferences from git config", async () => {
    resetMocks();
    executeGitCommandMock.mock.mockImplementation(async () => ({
      stdout:
        "phantom.editor\ncode\u0000phantom.ai\nclaude\u0000phantom.worktreesDirectory\n../phantom-worktrees\u0000",
      stderr: "",
    }));

    const preferences = await loadPreferences();

    deepStrictEqual(preferences, {
      editor: "code",
      ai: "claude",
      worktreesDirectory: "../phantom-worktrees",
    });
    deepStrictEqual(executeGitCommandMock.mock.calls[0].arguments[0], [
      "config",
      "--global",
      "--null",
      "--get-regexp",
      "^phantom\\.",
    ]);
  });

  it("ignores unknown keys and keeps known ones", async () => {
    resetMocks();
    executeGitCommandMock.mock.mockImplementation(async () => ({
      stdout:
        "phantom.unknown\nvalue\u0000phantom.editor\nvim\u0000phantom.ai\ncodex\u0000phantom.worktreesDirectory\n../phantom\u0000",
      stderr: "",
    }));

    const preferences = await loadPreferences();

    deepStrictEqual(preferences, {
      editor: "vim",
      ai: "codex",
      worktreesDirectory: "../phantom",
    });
  });

  it("returns empty preferences when no config entries exist", async () => {
    resetMocks();
    executeGitCommandMock.mock.mockImplementation(async () => ({
      stdout: "",
      stderr: "",
    }));

    const preferences = await loadPreferences();

    deepStrictEqual(preferences, {});
  });

  it("prefers the last occurrence of the same key", async () => {
    resetMocks();
    executeGitCommandMock.mock.mockImplementation(async () => ({
      stdout:
        "phantom.editor\nvim\u0000phantom.editor\ncode\u0000phantom.ai\nclaude\u0000phantom.ai\ncursor\u0000phantom.worktreesDirectory\n../phantom-custom\u0000phantom.worktreesDirectory\n../phantom-worktrees\u0000",
      stderr: "",
    }));

    const preferences = await loadPreferences();

    equal(preferences.editor, "code");
    equal(preferences.ai, "cursor");
    equal(preferences.worktreesDirectory, "../phantom-worktrees");
  });
});
