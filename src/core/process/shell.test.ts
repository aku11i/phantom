import { deepStrictEqual, strictEqual } from "node:assert";
import { beforeEach, describe, it } from "node:test";
import { isErr, isOk } from "../types/result.ts";
import { WorktreeNotFoundError } from "../worktree/errors.ts";
import { ProcessSpawnError } from "./errors.ts";
import type { SpawnConfig } from "./spawn.ts";

describe("shellInWorktree", () => {
  let originalShell: string | undefined;

  beforeEach(() => {
    originalShell = process.env.SHELL;
  });

  it("should spawn shell successfully when worktree exists", async (t) => {
    process.env.SHELL = "/bin/bash";

    const validateMock = t.mock.fn(() =>
      Promise.resolve({
        exists: true,
        path: "/test/repo/.git/phantom/worktrees/my-feature",
      }),
    );

    const spawnMock = t.mock.fn(() =>
      Promise.resolve({
        ok: true,
        value: { exitCode: 0 },
      }),
    );

    t.mock.module("../worktree/validate.ts", {
      namedExports: {
        validateWorktreeExists: validateMock,
      },
    });

    t.mock.module("./spawn.ts", {
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

    const spawnCall = (spawnMock.mock.calls[0] as any)
      ?.arguments[0] as SpawnConfig;
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

  it("should use /bin/sh when SHELL env var is not set", async (t) => {
    process.env.SHELL = undefined;

    const validateMock = t.mock.fn(() =>
      Promise.resolve({
        exists: true,
        path: "/test/repo/.git/phantom/worktrees/feature",
      }),
    );

    const spawnMock = t.mock.fn(() =>
      Promise.resolve({
        ok: true,
        value: { exitCode: 0 },
      }),
    );

    t.mock.module("../worktree/validate.ts", {
      namedExports: {
        validateWorktreeExists: validateMock,
      },
    });

    t.mock.module("./spawn.ts", {
      namedExports: {
        spawnProcess: spawnMock,
      },
    });

    const { shellInWorktree } = await import("./shell.ts");
    await shellInWorktree("/test/repo", "feature");

    deepStrictEqual(
      ((spawnMock.mock.calls[0] as any)?.arguments[0] as SpawnConfig).command,
      "/bin/sh",
    );

    process.env.SHELL = originalShell;
  });

  it("should return error when worktree does not exist", async (t) => {
    const validateMock = t.mock.fn(() =>
      Promise.resolve({
        exists: false,
        message: "Worktree 'non-existent' not found",
      }),
    );

    t.mock.module("../worktree/validate.ts", {
      namedExports: {
        validateWorktreeExists: validateMock,
      },
    });

    t.mock.module("./spawn.ts", {
      namedExports: {
        spawnProcess: t.mock.fn(),
      },
    });

    const { shellInWorktree } = await import("./shell.ts");
    const result = await shellInWorktree("/test/repo", "non-existent");

    strictEqual(isErr(result), true);
    if (isErr(result)) {
      strictEqual(result.error instanceof WorktreeNotFoundError, true);
      strictEqual(result.error.message, "Worktree 'non-existent' not found");
    }
  });

  it("should pass through spawn process errors", async (t) => {
    const validateMock = t.mock.fn(() =>
      Promise.resolve({
        exists: true,
        path: "/test/repo/.git/phantom/worktrees/feature",
      }),
    );

    const spawnMock = t.mock.fn(() =>
      Promise.resolve({
        ok: false,
        error: new ProcessSpawnError("/bin/sh", "Shell not found"),
      }),
    );

    t.mock.module("../worktree/validate.ts", {
      namedExports: {
        validateWorktreeExists: validateMock,
      },
    });

    t.mock.module("./spawn.ts", {
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
