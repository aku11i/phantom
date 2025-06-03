import { deepStrictEqual, strictEqual } from "node:assert";
import { beforeEach, describe, it, mock } from "node:test";
import { isErr, isOk } from "../types/result.ts";
import { WorktreeNotFoundError } from "../worktree/errors.ts";
import { ProcessSpawnError } from "./errors.ts";
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
        ok: true,
        value: { exitCode: 0 },
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

    strictEqual(isOk(result), true);
    if (isOk(result)) {
      deepStrictEqual(result.value, { exitCode: 0 });
    }

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
        ok: true,
        value: { exitCode: 0 },
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

    strictEqual(isErr(result), true);
    if (isErr(result)) {
      strictEqual(result.error instanceof WorktreeNotFoundError, true);
      strictEqual(result.error.message, "Worktree 'non-existent' not found");
    }

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
        ok: false,
        error: new ProcessSpawnError("/bin/sh", "Shell not found"),
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

    strictEqual(isErr(result), true);
    if (isErr(result)) {
      strictEqual(result.error instanceof ProcessSpawnError, true);
      strictEqual(
        result.error.message,
        "Error executing command '/bin/sh': Shell not found",
      );
    }
  });
});
