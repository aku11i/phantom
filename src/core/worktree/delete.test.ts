import { deepStrictEqual, strictEqual } from "node:assert";
import { describe, it, mock } from "node:test";
import { isErr, isOk } from "../types/result.ts";
import { WorktreeError, WorktreeNotFoundError } from "./errors.ts";

describe("deleteWorktree", () => {
  it("should delete worktree and report when branch deletion fails", async () => {
    const validateMock = mock.fn(() =>
      Promise.resolve({
        exists: true,
        path: "/test/repo/.git/phantom/worktrees/feature",
      }),
    );

    const executeGitCommandMock = mock.fn((command: string) => {
      if (command.includes("worktree remove")) {
        return Promise.resolve({ stdout: "", stderr: "" });
      }
      if (command.includes("branch -D")) {
        return Promise.reject(new Error("error: branch 'feature' not found."));
      }
      return Promise.reject(new Error("Unexpected command"));
    });
    const executeGitCommandInDirectoryMock = mock.fn(() =>
      Promise.resolve({ stdout: "", stderr: "" }),
    );

    mock.module("./validate.ts", {
      namedExports: {
        validateWorktreeExists: validateMock,
      },
    });

    mock.module("../git/executor.ts", {
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
        "Deleted worktree 'feature'\nNote: Branch 'feature' could not be deleted: error: branch 'feature' not found.",
      );
      strictEqual(result.value.hasUncommittedChanges, false);
      strictEqual(result.value.changedFiles, undefined);
    }

    mock.reset();
  });

  it("should delete a worktree successfully when no uncommitted changes", async () => {
    const validateMock = mock.fn(() =>
      Promise.resolve({
        exists: true,
        path: "/test/repo/.git/phantom/worktrees/feature",
      }),
    );

    const executeGitCommandMock = mock.fn((command: string) => {
      if (command.includes("worktree remove")) {
        return Promise.resolve({ stdout: "", stderr: "" });
      }
      if (command.includes("branch -D")) {
        return Promise.resolve({ stdout: "", stderr: "" });
      }
      return Promise.reject(new Error("Unexpected command"));
    });
    const executeGitCommandInDirectoryMock = mock.fn(() =>
      Promise.resolve({ stdout: "", stderr: "" }),
    );

    mock.module("./validate.ts", {
      namedExports: {
        validateWorktreeExists: validateMock,
      },
    });

    mock.module("../git/executor.ts", {
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

    mock.reset();
  });

  it("should fail when worktree does not exist", async () => {
    const validateMock = mock.fn(() =>
      Promise.resolve({
        exists: false,
        message: "Worktree 'nonexistent' does not exist",
      }),
    );

    mock.module("./validate.ts", {
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

    mock.reset();
  });

  it("should fail when uncommitted changes exist without force", async () => {
    const validateMock = mock.fn(() =>
      Promise.resolve({
        exists: true,
        path: "/test/repo/.git/phantom/worktrees/feature",
      }),
    );

    const executeGitCommandInDirectoryMock = mock.fn(() =>
      Promise.resolve({
        stdout: "M file1.txt\nA file2.txt\n?? file3.txt",
        stderr: "",
      }),
    );

    mock.module("./validate.ts", {
      namedExports: {
        validateWorktreeExists: validateMock,
      },
    });

    mock.module("../git/executor.ts", {
      namedExports: {
        executeGitCommand: mock.fn(),
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

    mock.reset();
  });

  it("should delete worktree with uncommitted changes when force is true", async () => {
    const validateMock = mock.fn(() =>
      Promise.resolve({
        exists: true,
        path: "/test/repo/.git/phantom/worktrees/feature",
      }),
    );

    const executeGitCommandMock = mock.fn((command: string) => {
      if (command.includes("worktree remove")) {
        return Promise.resolve({ stdout: "", stderr: "" });
      }
      if (command.includes("branch -D")) {
        return Promise.resolve({ stdout: "", stderr: "" });
      }
      return Promise.reject(new Error("Unexpected command"));
    });
    const executeGitCommandInDirectoryMock = mock.fn(() =>
      Promise.resolve({
        stdout: "M file1.txt\nA file2.txt",
        stderr: "",
      }),
    );

    mock.module("./validate.ts", {
      namedExports: {
        validateWorktreeExists: validateMock,
      },
    });

    mock.module("../git/executor.ts", {
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

    mock.reset();
  });
});

describe("getWorktreeStatus", () => {
  it("should return no uncommitted changes when git status is clean", async () => {
    const executeGitCommandInDirectoryMock = mock.fn(() =>
      Promise.resolve({ stdout: "", stderr: "" }),
    );

    mock.module("../git/executor.ts", {
      namedExports: {
        executeGitCommand: mock.fn(),
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

    mock.reset();
  });

  it("should return uncommitted changes when git status shows changes", async () => {
    const executeGitCommandInDirectoryMock = mock.fn(() =>
      Promise.resolve({
        stdout: "M file1.txt\nA file2.txt\n?? file3.txt",
        stderr: "",
      }),
    );

    mock.module("../git/executor.ts", {
      namedExports: {
        executeGitCommand: mock.fn(),
        executeGitCommandInDirectory: executeGitCommandInDirectoryMock,
      },
    });

    const { getWorktreeStatus } = await import("./delete.ts");

    const status = await getWorktreeStatus("/test/worktree");

    strictEqual(status.hasUncommittedChanges, true);
    strictEqual(status.changedFiles, 3);

    mock.reset();
  });

  it("should return no changes when git status fails", async () => {
    const executeGitCommandInDirectoryMock = mock.fn(() =>
      Promise.reject(new Error("Not a git repository")),
    );

    mock.module("../git/executor.ts", {
      namedExports: {
        executeGitCommand: mock.fn(),
        executeGitCommandInDirectory: executeGitCommandInDirectoryMock,
      },
    });

    const { getWorktreeStatus } = await import("./delete.ts");

    const status = await getWorktreeStatus("/test/worktree");

    strictEqual(status.hasUncommittedChanges, false);
    strictEqual(status.changedFiles, 0);

    mock.reset();
  });
});

describe("removeWorktree", () => {
  it("should remove worktree successfully", async () => {
    const executeGitCommandMock = mock.fn(() =>
      Promise.resolve({ stdout: "", stderr: "" }),
    );

    mock.module("../git/executor.ts", {
      namedExports: {
        executeGitCommand: executeGitCommandMock,
        executeGitCommandInDirectory: mock.fn(),
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

    mock.reset();
  });

  it("should use force removal when regular removal fails", async () => {
    let callCount = 0;
    const executeGitCommandMock = mock.fn(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.reject(new Error("Worktree is dirty"));
      }
      return Promise.resolve({ stdout: "", stderr: "" });
    });

    mock.module("../git/executor.ts", {
      namedExports: {
        executeGitCommand: executeGitCommandMock,
        executeGitCommandInDirectory: mock.fn(),
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

    mock.reset();
  });

  it("should throw error when both regular and force removal fail", async () => {
    const executeGitCommandMock = mock.fn(() =>
      Promise.reject(new Error("Permission denied")),
    );

    mock.module("../git/executor.ts", {
      namedExports: {
        executeGitCommand: executeGitCommandMock,
        executeGitCommandInDirectory: mock.fn(),
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

    mock.reset();
  });
});

describe("deleteBranch", () => {
  it("should delete branch successfully", async () => {
    const executeGitCommandMock = mock.fn(() =>
      Promise.resolve({ stdout: "", stderr: "" }),
    );

    mock.module("../git/executor.ts", {
      namedExports: {
        executeGitCommand: executeGitCommandMock,
        executeGitCommandInDirectory: mock.fn(),
      },
    });

    const { deleteBranch } = await import("./delete.ts");

    const result = await deleteBranch("/test/repo", "feature");

    strictEqual(result.deleted, true);
    strictEqual(result.error, undefined);
    strictEqual(executeGitCommandMock.mock.calls.length, 1);
    deepStrictEqual(executeGitCommandMock.mock.calls[0].arguments, [
      'branch -D "feature"',
      { cwd: "/test/repo" },
    ]);

    mock.reset();
  });

  it("should return false with error message when branch deletion fails", async () => {
    const executeGitCommandMock = mock.fn(() =>
      Promise.reject(new Error("Branch not found")),
    );

    mock.module("../git/executor.ts", {
      namedExports: {
        executeGitCommand: executeGitCommandMock,
        executeGitCommandInDirectory: mock.fn(),
      },
    });

    const { deleteBranch } = await import("./delete.ts");

    const result = await deleteBranch("/test/repo", "feature");

    strictEqual(result.deleted, false);
    strictEqual(result.error, "Branch not found");
    strictEqual(executeGitCommandMock.mock.calls.length, 1);

    mock.reset();
  });
});
