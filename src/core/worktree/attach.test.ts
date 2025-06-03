import { deepStrictEqual } from "node:assert";
import { describe, it, mock } from "node:test";
import { err, ok } from "../types/result.ts";
import { BranchNotFoundError, WorktreeAlreadyExistsError } from "./errors.ts";

describe("attachWorktreeCore", () => {
  it("should attach to existing branch successfully", async () => {
    const validatePhantomNameMock = mock.fn(() => ok(undefined));
    const existsSyncMock = mock.fn(() => false);
    const branchExistsMock = mock.fn(() => Promise.resolve(ok(true)));
    const attachWorktreeMock = mock.fn(() => Promise.resolve(ok(undefined)));

    mock.module("./validate.ts", {
      namedExports: {
        validatePhantomName: validatePhantomNameMock,
      },
    });

    mock.module("node:fs", {
      namedExports: {
        existsSync: existsSyncMock,
      },
    });

    mock.module("../git/libs/branch-exists.ts", {
      namedExports: {
        branchExists: branchExistsMock,
      },
    });

    mock.module("../git/libs/attach-worktree.ts", {
      namedExports: {
        attachWorktree: attachWorktreeMock,
      },
    });

    mock.module("../paths.ts", {
      namedExports: {
        getPhantomWorktreePath: mock.fn(
          (gitRoot: string, name: string) =>
            `${gitRoot}/.git/phantom/worktrees/${name}`,
        ),
      },
    });

    const { attachWorktreeCore } = await import("./attach.ts");

    const result = await attachWorktreeCore("/repo", "feature-branch");

    deepStrictEqual(result.ok, true);
    if (result.ok) {
      deepStrictEqual(
        result.value,
        "/repo/.git/phantom/worktrees/feature-branch",
      );
    }
    deepStrictEqual(branchExistsMock.mock.calls[0].arguments, [
      "/repo",
      "feature-branch",
    ]);
    deepStrictEqual(attachWorktreeMock.mock.calls[0].arguments, [
      "/repo",
      "/repo/.git/phantom/worktrees/feature-branch",
      "feature-branch",
    ]);
  });

  it("should fail if phantom name is invalid", async () => {
    const validatePhantomNameMock = mock.fn(() =>
      err(new Error("Invalid name")),
    );

    mock.module("./validate.ts", {
      namedExports: {
        validatePhantomName: validatePhantomNameMock,
      },
    });

    const { attachWorktreeCore } = await import("./attach.ts");

    const result = await attachWorktreeCore("/repo", "invalid/name");

    deepStrictEqual(result.ok, false);
    if (!result.ok) {
      deepStrictEqual(result.error.message, "Invalid name");
    }
  });

  it("should fail if worktree already exists", async () => {
    const validatePhantomNameMock = mock.fn(() => ok(undefined));
    const existsSyncMock = mock.fn(() => true);

    mock.module("./validate.ts", {
      namedExports: {
        validatePhantomName: validatePhantomNameMock,
      },
    });

    mock.module("node:fs", {
      namedExports: {
        existsSync: existsSyncMock,
      },
    });

    mock.module("../paths.ts", {
      namedExports: {
        getPhantomWorktreePath: mock.fn(
          (gitRoot: string, name: string) =>
            `${gitRoot}/.git/phantom/worktrees/${name}`,
        ),
      },
    });

    const { attachWorktreeCore } = await import("./attach.ts");

    const result = await attachWorktreeCore("/repo", "existing");

    deepStrictEqual(result.ok, false);
    if (!result.ok) {
      deepStrictEqual(result.error instanceof WorktreeAlreadyExistsError, true);
      deepStrictEqual(
        result.error.message,
        "Worktree 'existing' already exists",
      );
    }
  });

  it("should fail if branch does not exist", async () => {
    const validatePhantomNameMock = mock.fn(() => ok(undefined));
    const existsSyncMock = mock.fn(() => false);
    const branchExistsMock = mock.fn(() => Promise.resolve(ok(false)));

    mock.module("./validate.ts", {
      namedExports: {
        validatePhantomName: validatePhantomNameMock,
      },
    });

    mock.module("node:fs", {
      namedExports: {
        existsSync: existsSyncMock,
      },
    });

    mock.module("../git/libs/branch-exists.ts", {
      namedExports: {
        branchExists: branchExistsMock,
      },
    });

    mock.module("../paths.ts", {
      namedExports: {
        getPhantomWorktreePath: mock.fn(
          (gitRoot: string, name: string) =>
            `${gitRoot}/.git/phantom/worktrees/${name}`,
        ),
      },
    });

    const { attachWorktreeCore } = await import("./attach.ts");

    const result = await attachWorktreeCore("/repo", "nonexistent");

    deepStrictEqual(result.ok, false);
    if (!result.ok) {
      deepStrictEqual(result.error instanceof BranchNotFoundError, true);
      deepStrictEqual(result.error.message, "Branch 'nonexistent' not found");
    }
  });

  it("should propagate git errors", async () => {
    const validatePhantomNameMock = mock.fn(() => ok(undefined));
    const existsSyncMock = mock.fn(() => false);
    const branchExistsMock = mock.fn(() => Promise.resolve(ok(true)));
    const attachWorktreeMock = mock.fn(() =>
      Promise.resolve(err(new Error("Git operation failed"))),
    );

    mock.module("./validate.ts", {
      namedExports: {
        validatePhantomName: validatePhantomNameMock,
      },
    });

    mock.module("node:fs", {
      namedExports: {
        existsSync: existsSyncMock,
      },
    });

    mock.module("../git/libs/branch-exists.ts", {
      namedExports: {
        branchExists: branchExistsMock,
      },
    });

    mock.module("../git/libs/attach-worktree.ts", {
      namedExports: {
        attachWorktree: attachWorktreeMock,
      },
    });

    mock.module("../paths.ts", {
      namedExports: {
        getPhantomWorktreePath: mock.fn(
          (gitRoot: string, name: string) =>
            `${gitRoot}/.git/phantom/worktrees/${name}`,
        ),
      },
    });

    const { attachWorktreeCore } = await import("./attach.ts");

    const result = await attachWorktreeCore("/repo", "feature");

    deepStrictEqual(result.ok, false);
    if (!result.ok) {
      deepStrictEqual(result.error.message, "Git operation failed");
    }
  });
});
