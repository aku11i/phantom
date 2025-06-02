import { strictEqual } from "node:assert";
import { before, describe, it, mock } from "node:test";

describe("deleteWorktree", () => {
  let accessMock: ReturnType<typeof mock.fn>;
  let execMock: ReturnType<typeof mock.fn>;
  let deleteWorktree: typeof import("./delete.ts").deleteWorktree;

  before(async () => {
    accessMock = mock.fn();
    execMock = mock.fn();

    mock.module("node:fs/promises", {
      namedExports: {
        access: accessMock,
      },
    });

    mock.module("node:child_process", {
      namedExports: {
        exec: execMock,
      },
    });

    mock.module("node:util", {
      namedExports: {
        promisify: (fn: unknown) => fn,
      },
    });

    ({ deleteWorktree } = await import("./delete.ts"));
  });

  it("should return error when name is not provided", async () => {
    const result = await deleteWorktree("");
    strictEqual(result.success, false);
    strictEqual(result.message, "Error: worktree name required");
  });

  it("should return error when phantom does not exist", async () => {
    accessMock.mock.resetCalls();
    execMock.mock.resetCalls();

    // Mock getGitRoot
    execMock.mock.mockImplementation((cmd: string) => {
      if (cmd === "git rev-parse --show-toplevel") {
        return Promise.resolve({ stdout: "/test/repo\n", stderr: "" });
      }
      return Promise.resolve({ stdout: "", stderr: "" });
    });

    // Mock phantom doesn't exist
    accessMock.mock.mockImplementation(() => {
      return Promise.reject(new Error("ENOENT"));
    });

    const result = await deleteWorktree("nonexistent-phantom");

    strictEqual(result.success, false);
    strictEqual(
      result.message,
      "Error: Worktree 'nonexistent-phantom' does not exist",
    );
  });

  it("should delete clean phantom successfully", async () => {
    accessMock.mock.resetCalls();
    execMock.mock.resetCalls();

    // Mock git commands
    execMock.mock.mockImplementation(
      (cmd: string, options?: { cwd?: string }) => {
        if (cmd === "git rev-parse --show-toplevel") {
          return Promise.resolve({ stdout: "/test/repo\n", stderr: "" });
        }
        if (cmd === "git status --porcelain") {
          return Promise.resolve({ stdout: "", stderr: "" }); // Clean status
        }
        if (cmd.includes("git worktree remove")) {
          return Promise.resolve({ stdout: "", stderr: "" });
        }
        if (cmd.includes("git branch -D")) {
          return Promise.resolve({ stdout: "", stderr: "" });
        }
        return Promise.resolve({ stdout: "", stderr: "" });
      },
    );

    // Mock phantom exists
    accessMock.mock.mockImplementation(() => Promise.resolve());

    const result = await deleteWorktree("clean-phantom");

    strictEqual(result.success, true);
    strictEqual(
      result.message,
      "Deleted worktree 'clean-phantom' and its branch 'phantom/worktrees/clean-phantom'",
    );
    strictEqual(result.hasUncommittedChanges, false);
  });

  it("should refuse to delete dirty phantom without --force", async () => {
    accessMock.mock.resetCalls();
    execMock.mock.resetCalls();

    // Mock git commands
    execMock.mock.mockImplementation(
      (cmd: string, options?: { cwd?: string }) => {
        if (cmd === "git rev-parse --show-toplevel") {
          return Promise.resolve({ stdout: "/test/repo\n", stderr: "" });
        }
        if (cmd === "git status --porcelain") {
          return Promise.resolve({
            stdout: " M file1.ts\n?? file2.ts\n",
            stderr: "",
          }); // Dirty status with 2 files
        }
        return Promise.resolve({ stdout: "", stderr: "" });
      },
    );

    // Mock phantom exists
    accessMock.mock.mockImplementation(() => Promise.resolve());

    const result = await deleteWorktree("dirty-phantom");

    strictEqual(result.success, false);
    strictEqual(
      result.message,
      "Error: Worktree 'dirty-phantom' has uncommitted changes (2 files). Use --force to delete anyway.",
    );
    strictEqual(result.hasUncommittedChanges, true);
    strictEqual(result.changedFiles, 2);
  });

  it("should delete dirty phantom with --force", async () => {
    accessMock.mock.resetCalls();
    execMock.mock.resetCalls();

    // Mock git commands
    execMock.mock.mockImplementation(
      (cmd: string, options?: { cwd?: string }) => {
        if (cmd === "git rev-parse --show-toplevel") {
          return Promise.resolve({ stdout: "/test/repo\n", stderr: "" });
        }
        if (cmd === "git status --porcelain") {
          return Promise.resolve({
            stdout: " M file1.ts\n?? file2.ts\n",
            stderr: "",
          }); // Dirty status with 2 files
        }
        if (cmd.includes("git worktree remove")) {
          return Promise.resolve({ stdout: "", stderr: "" });
        }
        if (cmd.includes("git branch -D")) {
          return Promise.resolve({ stdout: "", stderr: "" });
        }
        return Promise.resolve({ stdout: "", stderr: "" });
      },
    );

    // Mock phantom exists
    accessMock.mock.mockImplementation(() => Promise.resolve());

    const result = await deleteWorktree("dirty-phantom", { force: true });

    strictEqual(result.success, true);
    strictEqual(
      result.message,
      "Warning: Worktree 'dirty-phantom' had uncommitted changes (2 files)\nDeleted worktree 'dirty-phantom' and its branch 'phantom/worktrees/dirty-phantom'",
    );
    strictEqual(result.hasUncommittedChanges, true);
    strictEqual(result.changedFiles, 2);
  });

  it("should handle worktree remove failure and try force removal", async () => {
    accessMock.mock.resetCalls();
    execMock.mock.resetCalls();

    // Mock git commands
    execMock.mock.mockImplementation(
      (cmd: string, options?: { cwd?: string }) => {
        if (cmd === "git rev-parse --show-toplevel") {
          return Promise.resolve({ stdout: "/test/repo\n", stderr: "" });
        }
        if (cmd === "git status --porcelain") {
          return Promise.resolve({ stdout: "", stderr: "" });
        }
        if (cmd.includes("git worktree remove") && !cmd.includes("--force")) {
          return Promise.reject(new Error("Worktree remove failed"));
        }
        if (cmd.includes("git worktree remove --force")) {
          return Promise.resolve({ stdout: "", stderr: "" });
        }
        if (cmd.includes("git branch -D")) {
          return Promise.resolve({ stdout: "", stderr: "" });
        }
        return Promise.resolve({ stdout: "", stderr: "" });
      },
    );

    // Mock phantom exists
    accessMock.mock.mockImplementation(() => Promise.resolve());

    const result = await deleteWorktree("stubborn-phantom");

    strictEqual(result.success, true);
    strictEqual(
      result.message,
      "Deleted worktree 'stubborn-phantom' and its branch 'phantom/worktrees/stubborn-phantom'",
    );
  });

  it("should handle case where branch doesn't exist", async () => {
    accessMock.mock.resetCalls();
    execMock.mock.resetCalls();

    // Mock git commands
    execMock.mock.mockImplementation(
      (cmd: string, options?: { cwd?: string }) => {
        if (cmd === "git rev-parse --show-toplevel") {
          return Promise.resolve({ stdout: "/test/repo\n", stderr: "" });
        }
        if (cmd === "git status --porcelain") {
          return Promise.resolve({ stdout: "", stderr: "" });
        }
        if (cmd.includes("git worktree remove")) {
          return Promise.resolve({ stdout: "", stderr: "" });
        }
        if (cmd.includes("git branch -D")) {
          return Promise.reject(new Error("Branch not found"));
        }
        return Promise.resolve({ stdout: "", stderr: "" });
      },
    );

    // Mock phantom exists
    accessMock.mock.mockImplementation(() => Promise.resolve());

    const result = await deleteWorktree("branch-missing-phantom");

    strictEqual(result.success, true);
    strictEqual(
      result.message,
      "Deleted worktree 'branch-missing-phantom' and its branch 'phantom/worktrees/branch-missing-phantom'",
    );
  });

  it("should return error when force worktree removal also fails", async () => {
    accessMock.mock.resetCalls();
    execMock.mock.resetCalls();

    // Mock git commands
    execMock.mock.mockImplementation(
      (cmd: string, options?: { cwd?: string }) => {
        if (cmd === "git rev-parse --show-toplevel") {
          return Promise.resolve({ stdout: "/test/repo\n", stderr: "" });
        }
        if (cmd === "git status --porcelain") {
          return Promise.resolve({ stdout: "", stderr: "" });
        }
        if (cmd.includes("git worktree remove")) {
          return Promise.reject(new Error("Worktree removal failed"));
        }
        return Promise.resolve({ stdout: "", stderr: "" });
      },
    );

    // Mock phantom exists
    accessMock.mock.mockImplementation(() => Promise.resolve());

    const result = await deleteWorktree("impossible-phantom");

    strictEqual(result.success, false);
    strictEqual(
      result.message,
      "Error: Failed to remove worktree 'impossible-phantom'",
    );
  });

  it("should handle git status errors gracefully", async () => {
    accessMock.mock.resetCalls();
    execMock.mock.resetCalls();

    // Mock git commands
    execMock.mock.mockImplementation(
      (cmd: string, options?: { cwd?: string }) => {
        if (cmd === "git rev-parse --show-toplevel") {
          return Promise.resolve({ stdout: "/test/repo\n", stderr: "" });
        }
        if (cmd === "git status --porcelain") {
          return Promise.reject(new Error("Git status failed"));
        }
        if (cmd.includes("git worktree remove")) {
          return Promise.resolve({ stdout: "", stderr: "" });
        }
        if (cmd.includes("git branch -D")) {
          return Promise.resolve({ stdout: "", stderr: "" });
        }
        return Promise.resolve({ stdout: "", stderr: "" });
      },
    );

    // Mock phantom exists
    accessMock.mock.mockImplementation(() => Promise.resolve());

    const result = await deleteWorktree("status-error-phantom");

    strictEqual(result.success, true);
    strictEqual(
      result.message,
      "Deleted worktree 'status-error-phantom' and its branch 'phantom/worktrees/status-error-phantom'",
    );
    strictEqual(result.hasUncommittedChanges, false);
  });
});
