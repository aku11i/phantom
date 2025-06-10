import { strictEqual } from "node:assert";
import { describe, it, mock } from "node:test";

const executeGitCommandMock = mock.fn();
const listWorktreesMock = mock.fn();

mock.module("../executor.ts", {
  namedExports: {
    executeGitCommand: executeGitCommandMock,
  },
});

mock.module("./list-worktrees.ts", {
  namedExports: {
    listWorktrees: listWorktreesMock,
  },
});

const { getCurrentWorktree } = await import("./get-current-worktree.ts");

describe("getCurrentWorktree", () => {
  const resetMocks = () => {
    executeGitCommandMock.mock.resetCalls();
    listWorktreesMock.mock.resetCalls();
  };

  it("should return null when in the main repository", async () => {
    resetMocks();
    const gitRoot = "/path/to/repo";

    executeGitCommandMock.mock.mockImplementation(() =>
      Promise.resolve({
        stdout: gitRoot,
        stderr: "",
      }),
    );

    listWorktreesMock.mock.mockImplementation(() =>
      Promise.resolve([
        {
          path: gitRoot,
          branch: "main",
          head: "abc123",
          isLocked: false,
          isPrunable: false,
        },
      ]),
    );

    const result = await getCurrentWorktree(gitRoot);
    strictEqual(result, null);
  });

  it("should return the branch name when in a worktree", async () => {
    resetMocks();
    const gitRoot = "/path/to/repo";
    const worktreePath = "/path/to/repo/.git/phantom/worktrees/feature-branch";

    executeGitCommandMock.mock.mockImplementation(() =>
      Promise.resolve({
        stdout: `${worktreePath}\n`,
        stderr: "",
      }),
    );

    listWorktreesMock.mock.mockImplementation(() =>
      Promise.resolve([
        {
          path: gitRoot,
          branch: "main",
          head: "abc123",
          isLocked: false,
          isPrunable: false,
        },
        {
          path: worktreePath,
          branch: "feature-branch",
          head: "def456",
          isLocked: false,
          isPrunable: false,
        },
      ]),
    );

    const result = await getCurrentWorktree(gitRoot);
    strictEqual(result, "feature-branch");
  });

  it("should return null when worktree is detached", async () => {
    resetMocks();
    const gitRoot = "/path/to/repo";
    const worktreePath = "/path/to/repo/.git/phantom/worktrees/my-feature";

    executeGitCommandMock.mock.mockImplementation(() =>
      Promise.resolve({
        stdout: worktreePath,
        stderr: "",
      }),
    );

    listWorktreesMock.mock.mockImplementation(() =>
      Promise.resolve([
        {
          path: gitRoot,
          branch: "main",
          head: "abc123",
          isLocked: false,
          isPrunable: false,
        },
        {
          path: worktreePath,
          branch: null,
          head: "def456",
          isLocked: false,
          isPrunable: false,
        },
      ]),
    );

    const result = await getCurrentWorktree(gitRoot);
    strictEqual(result, null);
  });

  it("should handle when worktree not found in list", async () => {
    resetMocks();
    const gitRoot = "/path/to/repo";
    const worktreePath = "/path/to/repo/.git/phantom/worktrees/unknown";

    executeGitCommandMock.mock.mockImplementation(() =>
      Promise.resolve({
        stdout: worktreePath,
        stderr: "",
      }),
    );

    listWorktreesMock.mock.mockImplementation(() =>
      Promise.resolve([
        {
          path: gitRoot,
          branch: "main",
          head: "abc123",
          isLocked: false,
          isPrunable: false,
        },
      ]),
    );

    const result = await getCurrentWorktree(gitRoot);
    strictEqual(result, null);
  });

  it("should return branch name for any worktree", async () => {
    resetMocks();
    const gitRoot = "/path/to/repo";
    const worktreePath = "/path/to/other-worktree";

    executeGitCommandMock.mock.mockImplementation(() =>
      Promise.resolve({
        stdout: worktreePath,
        stderr: "",
      }),
    );

    listWorktreesMock.mock.mockImplementation(() =>
      Promise.resolve([
        {
          path: gitRoot,
          branch: "main",
          head: "abc123",
          isLocked: false,
          isPrunable: false,
        },
        {
          path: worktreePath,
          branch: "other-branch",
          head: "def456",
          isLocked: false,
          isPrunable: false,
        },
      ]),
    );

    const result = await getCurrentWorktree(gitRoot);
    strictEqual(result, "other-branch");
  });
});
