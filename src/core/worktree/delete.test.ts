import { deepStrictEqual, strictEqual } from "node:assert";
import { describe, it } from "node:test";
import { isErr, isOk } from "../types/result.ts";
import {
  GitOperationError,
  WorktreeError,
  WorktreeNotFoundError,
} from "./errors.ts";

describe("deleteWorktree", () => {
  it("should delete worktree and report when branch deletion fails", async (t) => {
    const validateMock = t.mock.fn(() =>
      Promise.resolve({
        exists: true,
        path: "/test/repo/.git/phantom/worktrees/feature",
      }),
    );

    const executeGitCommandMock = t.mock.fn((command: string) => {
      if (command.includes("worktree remove")) {
        return Promise.resolve({ stdout: "", stderr: "" });
      }
      if (command.includes("branch -D")) {
        return Promise.reject(new Error("error: branch 'feature' not found."));
      }
      return Promise.reject(new Error("Unexpected command"));
    });
    const executeGitCommandInDirectoryMock = t.mock.fn(() =>
      Promise.resolve({ stdout: "", stderr: "" }),
    );

    t.mock.module("./validate.ts", {
      namedExports: {
        validateWorktreeExists: validateMock,
      },
    });

    t.mock.module("../git/executor.ts", {
      namedExports: {
        executeGitCommand: executeGitCommandMock,
        executeGitCommandInDirectory: executeGitCommandInDirectoryMock,
      },
    });

    const { deleteWorktree } = await import("./delete.ts");

    const result = await deleteWorktree("/test/repo", "feature");

    strictEqual(isOk(result), true);
    if (isOk(result)) {
      strictEqual(
        result.value.message,
        "Deleted worktree 'feature'\nNote: Branch 'feature' could not be deleted: Git branch delete failed: error: branch 'feature' not found.",
      );
      strictEqual(result.value.hasUncommittedChanges, false);
      strictEqual(result.value.changedFiles, undefined);
    }
  });

  it("should delete a worktree successfully when no uncommitted changes", async (t) => {
    const validateMock = t.mock.fn(() =>
      Promise.resolve({
        exists: true,
        path: "/test/repo/.git/phantom/worktrees/feature",
      }),
    );

    const executeGitCommandMock = t.mock.fn((command: string) => {
      if (command.includes("worktree remove")) {
        return Promise.resolve({ stdout: "", stderr: "" });
      }
      if (command.includes("branch -D")) {
        return Promise.resolve({ stdout: "", stderr: "" });
      }
      return Promise.reject(new Error("Unexpected command"));
    });
    const executeGitCommandInDirectoryMock = t.mock.fn(() =>
      Promise.resolve({ stdout: "", stderr: "" }),
    );

    t.mock.module("./validate.ts", {
      namedExports: {
        validateWorktreeExists: validateMock,
      },
    });

    t.mock.module("../git/executor.ts", {
      namedExports: {
        executeGitCommand: executeGitCommandMock,
        executeGitCommandInDirectory: executeGitCommandInDirectoryMock,
      },
    });

    const { deleteWorktree } = await import("./delete.ts");

    const result = await deleteWorktree("/test/repo", "feature");

    strictEqual(isOk(result), true);
    if (isOk(result)) {
      strictEqual(
        result.value.message,
        "Deleted worktree 'feature' and its branch 'feature'",
      );
      strictEqual(result.value.hasUncommittedChanges, false);
      strictEqual(result.value.changedFiles, undefined);
    }

    strictEqual(validateMock.mock.calls.length, 1);
    deepStrictEqual(validateMock.mock.calls[0].arguments, [
      "/test/repo",
      "feature",
    ]);

    strictEqual(executeGitCommandInDirectoryMock.mock.calls.length, 1);
    deepStrictEqual(executeGitCommandInDirectoryMock.mock.calls[0].arguments, [
      "/test/repo/.git/phantom/worktrees/feature",
      "status --porcelain",
    ]);

    strictEqual(executeGitCommandMock.mock.calls.length, 2);
    deepStrictEqual(executeGitCommandMock.mock.calls[0].arguments, [
      'worktree remove "/test/repo/.git/phantom/worktrees/feature"',
      { cwd: "/test/repo" },
    ]);
    deepStrictEqual(executeGitCommandMock.mock.calls[1].arguments, [
      'branch -D "feature"',
      { cwd: "/test/repo" },
    ]);
  });

  it("should fail when worktree does not exist", async (t) => {
    const validateMock = t.mock.fn(() =>
      Promise.resolve({
        exists: false,
        message: "Worktree 'nonexistent' does not exist",
      }),
    );

    t.mock.module("./validate.ts", {
      namedExports: {
        validateWorktreeExists: validateMock,
      },
    });

    const { deleteWorktree } = await import("./delete.ts");

    const result = await deleteWorktree("/test/repo", "nonexistent");

    strictEqual(isErr(result), true);
    if (isErr(result)) {
      strictEqual(result.error instanceof WorktreeNotFoundError, true);
      strictEqual(result.error.message, "Worktree 'nonexistent' not found");
    }
  });

  it("should fail when uncommitted changes exist without force", async (t) => {
    const validateMock = t.mock.fn(() =>
      Promise.resolve({
        exists: true,
        path: "/test/repo/.git/phantom/worktrees/feature",
      }),
    );

    const executeGitCommandInDirectoryMock = t.mock.fn(() =>
      Promise.resolve({
        stdout: "M file1.txt\nA file2.txt\n?? file3.txt",
        stderr: "",
      }),
    );

    t.mock.module("./validate.ts", {
      namedExports: {
        validateWorktreeExists: validateMock,
      },
    });

    t.mock.module("../git/executor.ts", {
      namedExports: {
        executeGitCommand: t.mock.fn(),
        executeGitCommandInDirectory: executeGitCommandInDirectoryMock,
      },
    });

    const { deleteWorktree } = await import("./delete.ts");

    const result = await deleteWorktree("/test/repo", "feature");

    strictEqual(isErr(result), true);
    if (isErr(result)) {
      strictEqual(result.error instanceof WorktreeError, true);
      strictEqual(
        result.error.message,
        "Worktree 'feature' has uncommitted changes (3 files). Use --force to delete anyway.",
      );
    }
  });

  it("should delete worktree with uncommitted changes when force is true", async (t) => {
    const validateMock = t.mock.fn(() =>
      Promise.resolve({
        exists: true,
        path: "/test/repo/.git/phantom/worktrees/feature",
      }),
    );

    const executeGitCommandMock = t.mock.fn((command: string) => {
      if (command.includes("worktree remove")) {
        return Promise.resolve({ stdout: "", stderr: "" });
      }
      if (command.includes("branch -D")) {
        return Promise.resolve({ stdout: "", stderr: "" });
      }
      return Promise.reject(new Error("Unexpected command"));
    });
    const executeGitCommandInDirectoryMock = t.mock.fn(() =>
      Promise.resolve({
        stdout: "M file1.txt\nA file2.txt",
        stderr: "",
      }),
    );

    t.mock.module("./validate.ts", {
      namedExports: {
        validateWorktreeExists: validateMock,
      },
    });

    t.mock.module("../git/executor.ts", {
      namedExports: {
        executeGitCommand: executeGitCommandMock,
        executeGitCommandInDirectory: executeGitCommandInDirectoryMock,
      },
    });

    const { deleteWorktree } = await import("./delete.ts");

    const result = await deleteWorktree("/test/repo", "feature", {
      force: true,
    });

    strictEqual(isOk(result), true);
    if (isOk(result)) {
      strictEqual(
        result.value.message,
        "Warning: Worktree 'feature' had uncommitted changes (2 files)\nDeleted worktree 'feature' and its branch 'feature'",
      );
      strictEqual(result.value.hasUncommittedChanges, true);
      strictEqual(result.value.changedFiles, 2);
    }
  });
});

describe("getWorktreeStatus", () => {
  it("should return no uncommitted changes when git status is clean", async (t) => {
    const executeGitCommandInDirectoryMock = t.mock.fn(() =>
      Promise.resolve({ stdout: "", stderr: "" }),
    );

    t.mock.module("../git/executor.ts", {
      namedExports: {
        executeGitCommand: t.mock.fn(),
        executeGitCommandInDirectory: executeGitCommandInDirectoryMock,
      },
    });

    const { getWorktreeStatus } = await import("./delete.ts");

    const status = await getWorktreeStatus("/test/worktree");

    strictEqual(status.hasUncommittedChanges, false);
    strictEqual(status.changedFiles, 0);

    strictEqual(executeGitCommandInDirectoryMock.mock.calls.length, 1);
    deepStrictEqual(executeGitCommandInDirectoryMock.mock.calls[0].arguments, [
      "/test/worktree",
      "status --porcelain",
    ]);
  });

  it("should return uncommitted changes when git status shows changes", async (t) => {
    const executeGitCommandInDirectoryMock = t.mock.fn(() =>
      Promise.resolve({
        stdout: "M file1.txt\nA file2.txt\n?? file3.txt",
        stderr: "",
      }),
    );

    t.mock.module("../git/executor.ts", {
      namedExports: {
        executeGitCommand: t.mock.fn(),
        executeGitCommandInDirectory: executeGitCommandInDirectoryMock,
      },
    });

    const { getWorktreeStatus } = await import("./delete.ts");

    const status = await getWorktreeStatus("/test/worktree");

    strictEqual(status.hasUncommittedChanges, true);
    strictEqual(status.changedFiles, 3);
  });

  it("should return no changes when git status fails", async (t) => {
    const executeGitCommandInDirectoryMock = t.mock.fn(() =>
      Promise.reject(new Error("Not a git repository")),
    );

    t.mock.module("../git/executor.ts", {
      namedExports: {
        executeGitCommand: t.mock.fn(),
        executeGitCommandInDirectory: executeGitCommandInDirectoryMock,
      },
    });

    const { getWorktreeStatus } = await import("./delete.ts");

    const status = await getWorktreeStatus("/test/worktree");

    strictEqual(status.hasUncommittedChanges, false);
    strictEqual(status.changedFiles, 0);
  });
});

describe("removeWorktree", () => {
  it("should remove worktree successfully", async (t) => {
    const executeGitCommandMock = t.mock.fn(() =>
      Promise.resolve({ stdout: "", stderr: "" }),
    );

    t.mock.module("../git/executor.ts", {
      namedExports: {
        executeGitCommand: executeGitCommandMock,
        executeGitCommandInDirectory: t.mock.fn(),
      },
    });

    const { removeWorktree } = await import("./delete.ts");

    await removeWorktree(
      "/test/repo",
      "/test/repo/.git/phantom/worktrees/feature",
    );

    strictEqual(executeGitCommandMock.mock.calls.length, 1);
    deepStrictEqual(executeGitCommandMock.mock.calls[0].arguments, [
      'worktree remove "/test/repo/.git/phantom/worktrees/feature"',
      { cwd: "/test/repo" },
    ]);
  });

  it("should use force removal when regular removal fails", async (t) => {
    let callCount = 0;
    const executeGitCommandMock = t.mock.fn(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.reject(new Error("Worktree is dirty"));
      }
      return Promise.resolve({ stdout: "", stderr: "" });
    });

    t.mock.module("../git/executor.ts", {
      namedExports: {
        executeGitCommand: executeGitCommandMock,
        executeGitCommandInDirectory: t.mock.fn(),
      },
    });

    const { removeWorktree } = await import("./delete.ts");

    await removeWorktree(
      "/test/repo",
      "/test/repo/.git/phantom/worktrees/feature",
    );

    strictEqual(executeGitCommandMock.mock.calls.length, 2);
    deepStrictEqual(executeGitCommandMock.mock.calls[0].arguments, [
      'worktree remove "/test/repo/.git/phantom/worktrees/feature"',
      { cwd: "/test/repo" },
    ]);
    deepStrictEqual(executeGitCommandMock.mock.calls[1].arguments, [
      'worktree remove --force "/test/repo/.git/phantom/worktrees/feature"',
      { cwd: "/test/repo" },
    ]);
  });

  it("should throw error when both regular and force removal fail", async (t) => {
    const executeGitCommandMock = t.mock.fn(() =>
      Promise.reject(new Error("Permission denied")),
    );

    t.mock.module("../git/executor.ts", {
      namedExports: {
        executeGitCommand: executeGitCommandMock,
        executeGitCommandInDirectory: t.mock.fn(),
      },
    });

    const { removeWorktree } = await import("./delete.ts");

    try {
      await removeWorktree(
        "/test/repo",
        "/test/repo/.git/phantom/worktrees/feature",
      );
      throw new Error("Expected removeWorktree to throw");
    } catch (error) {
      strictEqual((error as Error).message, "Failed to remove worktree");
    }

    strictEqual(executeGitCommandMock.mock.calls.length, 2);
  });
});

describe("deleteBranch", () => {
  it("should delete branch successfully", async (t) => {
    const executeGitCommandMock = t.mock.fn(() =>
      Promise.resolve({ stdout: "", stderr: "" }),
    );

    t.mock.module("../git/executor.ts", {
      namedExports: {
        executeGitCommand: executeGitCommandMock,
        executeGitCommandInDirectory: t.mock.fn(),
      },
    });

    const { deleteBranch } = await import("./delete.ts");

    const result = await deleteBranch("/test/repo", "feature");

    strictEqual(isOk(result), true);
    if (isOk(result)) {
      strictEqual(result.value, true);
    }
    strictEqual(executeGitCommandMock.mock.calls.length, 1);
    deepStrictEqual(executeGitCommandMock.mock.calls[0].arguments, [
      'branch -D "feature"',
      { cwd: "/test/repo" },
    ]);
  });

  it("should return error when branch deletion fails", async (t) => {
    const executeGitCommandMock = t.mock.fn(() =>
      Promise.reject(new Error("Branch not found")),
    );

    t.mock.module("../git/executor.ts", {
      namedExports: {
        executeGitCommand: executeGitCommandMock,
        executeGitCommandInDirectory: t.mock.fn(),
      },
    });

    const { deleteBranch } = await import("./delete.ts");

    const result = await deleteBranch("/test/repo", "feature");

    strictEqual(isErr(result), true);
    if (isErr(result)) {
      strictEqual(result.error instanceof GitOperationError, true);
      strictEqual(
        result.error.message,
        "Git branch delete failed: Branch not found",
      );
    }
    strictEqual(executeGitCommandMock.mock.calls.length, 1);
  });
});
