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

  it("returns editor preference from git config", async () => {
    resetMocks();
    executeGitCommandMock.mock.mockImplementation(async () => ({
      stdout: "phantom.editor\ncode\u0000",
      stderr: "",
    }));

    const preferences = await loadPreferences();

    deepStrictEqual(preferences, { editor: "code" });
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
      stdout: "phantom.unknown\nvalue\u0000phantom.editor\nvim\u0000",
      stderr: "",
    }));

    const preferences = await loadPreferences();

    deepStrictEqual(preferences, { editor: "vim" });
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
      stdout: "phantom.editor\nvim\u0000phantom.editor\ncode\u0000",
      stderr: "",
    }));

    const preferences = await loadPreferences();

    equal(preferences.editor, "code");
  });
});
