import { strictEqual } from "node:assert";
import { before, describe, it, mock } from "node:test";

describe("whereWorktree", () => {
  let accessMock: ReturnType<typeof mock.fn>;
  let execMock: ReturnType<typeof mock.fn>;
  let whereWorktree: typeof import("./where.ts").whereWorktree;

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

    ({ whereWorktree } = await import("./where.ts"));
  });

  it("should return error when name is not provided", async () => {
    const result = await whereWorktree("");
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

    const result = await whereWorktree("nonexistent-phantom");

    strictEqual(result.success, false);
    strictEqual(
      result.message,
      "Error: Worktree 'nonexistent-phantom' does not exist",
    );
  });

  it("should return path when phantom exists", async () => {
    accessMock.mock.resetCalls();
    execMock.mock.resetCalls();

    // Mock getGitRoot
    execMock.mock.mockImplementation((cmd: string) => {
      if (cmd === "git rev-parse --show-toplevel") {
        return Promise.resolve({ stdout: "/test/repo\n", stderr: "" });
      }
      return Promise.resolve({ stdout: "", stderr: "" });
    });

    // Mock phantom exists
    accessMock.mock.mockImplementation(() => Promise.resolve());

    const result = await whereWorktree("existing-worktree");

    strictEqual(result.success, true);
    strictEqual(
      result.path,
      "/test/repo/.git/phantom/worktrees/existing-worktree",
    );
  });

  it("should handle git root detection failures", async () => {
    accessMock.mock.resetCalls();
    execMock.mock.resetCalls();

    // Mock getGitRoot failure
    execMock.mock.mockImplementation(() => {
      return Promise.reject(new Error("Not a git repository"));
    });

    const result = await whereWorktree("some-phantom");

    strictEqual(result.success, false);
    strictEqual(
      result.message,
      "Error locating worktree: Not a git repository",
    );
  });

  it("should handle different phantom names correctly", async () => {
    accessMock.mock.resetCalls();
    execMock.mock.resetCalls();

    // Mock getGitRoot
    execMock.mock.mockImplementation((cmd: string) => {
      if (cmd === "git rev-parse --show-toplevel") {
        return Promise.resolve({ stdout: "/different/repo\n", stderr: "" });
      }
      return Promise.resolve({ stdout: "", stderr: "" });
    });

    // Mock phantom exists
    accessMock.mock.mockImplementation(() => Promise.resolve());

    const result = await whereWorktree("feature-branch-123");

    strictEqual(result.success, true);
    strictEqual(
      result.path,
      "/different/repo/.git/phantom/worktrees/feature-branch-123",
    );
  });

  it("should handle special characters in phantom names", async () => {
    accessMock.mock.resetCalls();
    execMock.mock.resetCalls();

    // Mock getGitRoot
    execMock.mock.mockImplementation((cmd: string) => {
      if (cmd === "git rev-parse --show-toplevel") {
        return Promise.resolve({ stdout: "/test/repo\n", stderr: "" });
      }
      return Promise.resolve({ stdout: "", stderr: "" });
    });

    // Mock phantom exists
    accessMock.mock.mockImplementation(() => Promise.resolve());

    const result = await whereWorktree("feature-with-dashes_and_underscores");

    strictEqual(result.success, true);
    strictEqual(
      result.path,
      "/test/repo/.git/phantom/worktrees/feature-with-dashes_and_underscores",
    );
  });
});
