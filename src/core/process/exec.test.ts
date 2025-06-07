import { deepStrictEqual, strictEqual } from "node:assert";
import { describe, it } from "node:test";
import { isErr, isOk } from "../types/result.ts";
import { WorktreeNotFoundError } from "../worktree/errors.ts";
import { ProcessExecutionError } from "./errors.ts";

describe("execInWorktree", () => {
  it("should execute command successfully when worktree exists", async (t) => {
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

    const { execInWorktree } = await import("./exec.ts");
    const result = await execInWorktree("/test/repo", "my-feature", [
      "npm",
      "test",
    ]);

    strictEqual(isOk(result), true);
    if (isOk(result)) {
      deepStrictEqual(result.value, { exitCode: 0 });
    }

    deepStrictEqual((spawnMock.mock.calls[0] as any)?.arguments[0], {
      command: "npm",
      args: ["test"],
      options: {
        cwd: "/test/repo/.git/phantom/worktrees/my-feature",
      },
    });
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

    const { execInWorktree } = await import("./exec.ts");
    const result = await execInWorktree("/test/repo", "non-existent", [
      "npm",
      "test",
    ]);

    strictEqual(isErr(result), true);
    if (isErr(result)) {
      strictEqual(result.error instanceof WorktreeNotFoundError, true);
      strictEqual(result.error.message, "Worktree 'non-existent' not found");
    }
  });

  it("should handle command with single argument", async (t) => {
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

    const { execInWorktree } = await import("./exec.ts");
    await execInWorktree("/test/repo", "feature", ["ls"]);

    deepStrictEqual((spawnMock.mock.calls[0] as any)?.arguments[0], {
      command: "ls",
      args: [],
      options: {
        cwd: "/test/repo/.git/phantom/worktrees/feature",
      },
    });
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
        error: new ProcessExecutionError("false", 1),
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

    const { execInWorktree } = await import("./exec.ts");
    const result = await execInWorktree("/test/repo", "feature", ["false"]);

    strictEqual(isErr(result), true);
    if (isErr(result)) {
      strictEqual(result.error instanceof ProcessExecutionError, true);
      if (result.error instanceof ProcessExecutionError) {
        strictEqual(result.error.exitCode, 1);
      }
    }
  });
});
