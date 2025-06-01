import { strictEqual } from "node:assert";
import { before, describe, it, mock } from "node:test";

describe("deleteRuin", () => {
  let accessMock: ReturnType<typeof mock.fn>;
  let execMock: ReturnType<typeof mock.fn>;
  let deleteRuin: typeof import("./delete.ts").deleteRuin;

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

    ({ deleteRuin } = await import("./delete.ts"));
  });

  it("should return error when name is not provided", async () => {
    const result = await deleteRuin("");
    strictEqual(result.success, false);
    strictEqual(result.message, "Error: ruin name required");
  });

  it("should return error when ruin does not exist", async () => {
    accessMock.mock.resetCalls();
    execMock.mock.resetCalls();

    // Mock getGitRoot
    execMock.mock.mockImplementation((cmd: string) => {
      if (cmd === "git rev-parse --show-toplevel") {
        return Promise.resolve({ stdout: "/test/repo\n", stderr: "" });
      }
      return Promise.resolve({ stdout: "", stderr: "" });
    });

    // Mock ruin doesn't exist
    accessMock.mock.mockImplementation(() => {
      return Promise.reject(new Error("ENOENT"));
    });

    const result = await deleteRuin("nonexistent-ruin");

    strictEqual(result.success, false);
    strictEqual(
      result.message,
      "Error: Ruin 'nonexistent-ruin' does not exist",
    );
  });

  it("should delete clean ruin successfully", async () => {
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

    // Mock ruin exists
    accessMock.mock.mockImplementation(() => Promise.resolve());

    const result = await deleteRuin("clean-ruin");

    strictEqual(result.success, true);
    strictEqual(
      result.message,
      "Deleted ruin 'clean-ruin' and its branch 'phantom/ruins/clean-ruin'",
    );
    strictEqual(result.hasUncommittedChanges, false);
  });

  it("should delete dirty ruin with warning", async () => {
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

    // Mock ruin exists
    accessMock.mock.mockImplementation(() => Promise.resolve());

    const result = await deleteRuin("dirty-ruin");

    strictEqual(result.success, true);
    strictEqual(
      result.message,
      "Warning: Ruin 'dirty-ruin' had uncommitted changes (2 files)\nDeleted ruin 'dirty-ruin' and its branch 'phantom/ruins/dirty-ruin'",
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

    // Mock ruin exists
    accessMock.mock.mockImplementation(() => Promise.resolve());

    const result = await deleteRuin("stubborn-ruin");

    strictEqual(result.success, true);
    strictEqual(
      result.message,
      "Deleted ruin 'stubborn-ruin' and its branch 'phantom/ruins/stubborn-ruin'",
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

    // Mock ruin exists
    accessMock.mock.mockImplementation(() => Promise.resolve());

    const result = await deleteRuin("branch-missing-ruin");

    strictEqual(result.success, true);
    strictEqual(
      result.message,
      "Deleted ruin 'branch-missing-ruin' and its branch 'phantom/ruins/branch-missing-ruin'",
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

    // Mock ruin exists
    accessMock.mock.mockImplementation(() => Promise.resolve());

    const result = await deleteRuin("impossible-ruin");

    strictEqual(result.success, false);
    strictEqual(
      result.message,
      "Error: Failed to remove worktree for ruin 'impossible-ruin'",
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

    // Mock ruin exists
    accessMock.mock.mockImplementation(() => Promise.resolve());

    const result = await deleteRuin("status-error-ruin");

    strictEqual(result.success, true);
    strictEqual(
      result.message,
      "Deleted ruin 'status-error-ruin' and its branch 'phantom/ruins/status-error-ruin'",
    );
    strictEqual(result.hasUncommittedChanges, false);
  });
});
