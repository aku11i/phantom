import { strictEqual } from "node:assert";
import { describe, it } from "node:test";

describe("getCurrentWorktree", () => {
  it("should return null when in the main repository", async (t) => {
    const gitRoot = "/path/to/repo";

    t.mock.module("../executor.ts", {
      namedExports: {
        executeGitCommand: t.mock.fn(() =>
          Promise.resolve({
            stdout: gitRoot,
            stderr: "",
          }),
        ),
      },
    });

    t.mock.module("./list-worktrees.ts", {
      namedExports: {
        listWorktrees: t.mock.fn(() =>
          Promise.resolve([
            {
              path: gitRoot,
              branch: "main",
              head: "abc123",
              isLocked: false,
              isPrunable: false,
            },
          ]),
        ),
      },
    });

    const { getCurrentWorktree } = await import("./get-current-worktree.ts");
    const result = await getCurrentWorktree(gitRoot);
    strictEqual(result, null);
  });

  it("should return the branch name when in a worktree", async (t) => {
    const gitRoot = "/path/to/repo";
    const worktreePath = "/path/to/repo/.git/phantom/worktrees/feature-branch";

    t.mock.module("../executor.ts", {
      namedExports: {
        executeGitCommand: t.mock.fn(() =>
          Promise.resolve({
            stdout: `${worktreePath}\n`,
            stderr: "",
          }),
        ),
      },
    });

    t.mock.module("./list-worktrees.ts", {
      namedExports: {
        listWorktrees: t.mock.fn(() =>
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
        ),
      },
    });

    const { getCurrentWorktree } = await import("./get-current-worktree.ts");
    const result = await getCurrentWorktree(gitRoot);
    strictEqual(result, "feature-branch");
  });

  it("should return null when git command fails", async (t) => {
    const gitRoot = "/path/to/repo";

    t.mock.module("../executor.ts", {
      namedExports: {
        executeGitCommand: t.mock.fn(() =>
          Promise.reject(new Error("Git error")),
        ),
      },
    });

    const { getCurrentWorktree } = await import("./get-current-worktree.ts");
    const result = await getCurrentWorktree(gitRoot);
    strictEqual(result, null);
  });

  it("should return null when worktree is not found in list", async (t) => {
    const gitRoot = "/path/to/repo";
    const unknownPath = "/some/other/path";

    t.mock.module("../executor.ts", {
      namedExports: {
        executeGitCommand: t.mock.fn(() =>
          Promise.resolve({
            stdout: unknownPath,
            stderr: "",
          }),
        ),
      },
    });

    t.mock.module("./list-worktrees.ts", {
      namedExports: {
        listWorktrees: t.mock.fn(() =>
          Promise.resolve([
            {
              path: gitRoot,
              branch: "main",
              head: "abc123",
              isLocked: false,
              isPrunable: false,
            },
          ]),
        ),
      },
    });

    const { getCurrentWorktree } = await import("./get-current-worktree.ts");
    const result = await getCurrentWorktree(gitRoot);
    strictEqual(result, null);
  });
});
