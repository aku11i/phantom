import { deepStrictEqual } from "node:assert";
import { beforeEach, describe, it, mock } from "node:test";
import type { SpawnConfig } from "./spawn.ts";

describe("shellInWorktree", () => {
  let validateMock: ReturnType<typeof mock.fn>;
  let spawnMock: ReturnType<typeof mock.fn>;
  let originalShell: string | undefined;

  beforeEach(() => {
    originalShell = process.env.SHELL;
  });

  it("should spawn shell successfully when worktree exists", async () => {
    process.env.SHELL = "/bin/bash";

    validateMock = mock.fn(() =>
      Promise.resolve({
        exists: true,
        path: "/test/repo/.git/phantom/worktrees/my-feature",
      }),
    );

    spawnMock = mock.fn(() =>
      Promise.resolve({
        success: true,
        exitCode: 0,
      }),
    );

    mock.module("../worktree/validate.ts", {
      namedExports: {
        validateWorktreeExists: validateMock,
      },
    });

    mock.module("./spawn.ts", {
      namedExports: {
        spawnProcess: spawnMock,
      },
    });

    const { shellInWorktree } = await import("./shell.ts");
    const result = await shellInWorktree("/test/repo", "my-feature");

    deepStrictEqual(result, {
      success: true,
      exitCode: 0,
    });

    const spawnCall = spawnMock.mock.calls[0].arguments[0] as SpawnConfig;
    deepStrictEqual(spawnCall.command, "/bin/bash");
    deepStrictEqual(spawnCall.args, []);
    deepStrictEqual(
      spawnCall.options?.cwd,
      "/test/repo/.git/phantom/worktrees/my-feature",
    );
    const env = spawnCall.options?.env as NodeJS.ProcessEnv;
    deepStrictEqual(env.PHANTOM, "1");
    deepStrictEqual(env.PHANTOM_NAME, "my-feature");
    deepStrictEqual(
      env.PHANTOM_PATH,
      "/test/repo/.git/phantom/worktrees/my-feature",
    );

    process.env.SHELL = originalShell;
  });

  it("should use /bin/sh when SHELL env var is not set", async () => {
    process.env.SHELL = undefined;

    validateMock = mock.fn(() =>
      Promise.resolve({
        exists: true,
        path: "/test/repo/.git/phantom/worktrees/feature",
      }),
    );

    spawnMock = mock.fn(() =>
      Promise.resolve({
        success: true,
        exitCode: 0,
      }),
    );

    mock.module("../worktree/validate.ts", {
      namedExports: {
        validateWorktreeExists: validateMock,
      },
    });

    mock.module("./spawn.ts", {
      namedExports: {
        spawnProcess: spawnMock,
      },
    });

    const { shellInWorktree } = await import("./shell.ts");
    await shellInWorktree("/test/repo", "feature");

    deepStrictEqual(
      (spawnMock.mock.calls[0].arguments[0] as SpawnConfig).command,
      "/bin/sh",
    );

    process.env.SHELL = originalShell;
  });

  it("should return error when worktree does not exist", async () => {
    validateMock = mock.fn(() =>
      Promise.resolve({
        exists: false,
        message: "Worktree 'non-existent' not found",
      }),
    );

    mock.module("../worktree/validate.ts", {
      namedExports: {
        validateWorktreeExists: validateMock,
      },
    });

    mock.module("./spawn.ts", {
      namedExports: {
        spawnProcess: spawnMock,
      },
    });

    const { shellInWorktree } = await import("./shell.ts");
    const result = await shellInWorktree("/test/repo", "non-existent");

    deepStrictEqual(result, {
      success: false,
      message: "Worktree 'non-existent' not found",
    });

    deepStrictEqual(spawnMock.mock.calls.length, 0);
  });

  it("should pass through spawn process errors", async () => {
    validateMock = mock.fn(() =>
      Promise.resolve({
        exists: true,
        path: "/test/repo/.git/phantom/worktrees/feature",
      }),
    );

    spawnMock = mock.fn(() =>
      Promise.resolve({
        success: false,
        exitCode: 127,
        message: "Shell not found",
      }),
    );

    mock.module("../worktree/validate.ts", {
      namedExports: {
        validateWorktreeExists: validateMock,
      },
    });

    mock.module("./spawn.ts", {
      namedExports: {
        spawnProcess: spawnMock,
      },
    });

    const { shellInWorktree } = await import("./shell.ts");
    const result = await shellInWorktree("/test/repo", "feature");

    deepStrictEqual(result, {
      success: false,
      exitCode: 127,
      message: "Shell not found",
    });
  });
});
