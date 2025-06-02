import { deepStrictEqual } from "node:assert";
import { describe, it, mock } from "node:test";

describe("execInWorktree", () => {
  let validateMock: ReturnType<typeof mock.fn>;
  let spawnMock: ReturnType<typeof mock.fn>;

  it("should execute command successfully when worktree exists", async () => {
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

    const { execInWorktree } = await import("./exec.ts");
    const result = await execInWorktree("/test/repo", "my-feature", [
      "npm",
      "test",
    ]);

    deepStrictEqual(result, {
      success: true,
      exitCode: 0,
    });

    deepStrictEqual(spawnMock.mock.calls[0].arguments[0], {
      command: "npm",
      args: ["test"],
      options: {
        cwd: "/test/repo/.git/phantom/worktrees/my-feature",
      },
    });
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

    const { execInWorktree } = await import("./exec.ts");
    const result = await execInWorktree("/test/repo", "non-existent", [
      "npm",
      "test",
    ]);

    deepStrictEqual(result, {
      success: false,
      message: "Worktree 'non-existent' not found",
    });

    deepStrictEqual(spawnMock.mock.calls.length, 0);
  });

  it("should handle command with single argument", async () => {
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

    const { execInWorktree } = await import("./exec.ts");
    const result = await execInWorktree("/test/repo", "feature", ["ls"]);

    deepStrictEqual(spawnMock.mock.calls[0].arguments[0], {
      command: "ls",
      args: [],
      options: {
        cwd: "/test/repo/.git/phantom/worktrees/feature",
      },
    });
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
        exitCode: 1,
        message: "Command failed",
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

    const { execInWorktree } = await import("./exec.ts");
    const result = await execInWorktree("/test/repo", "feature", ["false"]);

    deepStrictEqual(result, {
      success: false,
      exitCode: 1,
      message: "Command failed",
    });
  });
});
