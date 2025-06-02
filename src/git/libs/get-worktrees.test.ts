import { deepStrictEqual } from "node:assert";
import { before, describe, it, mock } from "node:test";

describe("getWorktrees", () => {
  let execMock: ReturnType<typeof mock.fn>;
  let getWorktrees: typeof import("./get-worktrees.ts").getWorktrees;

  before(async () => {
    execMock = mock.fn();

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

    ({ getWorktrees } = await import("./get-worktrees.ts"));
  });

  it("should parse single worktree with branch", async () => {
    execMock.mock.resetCalls();

    execMock.mock.mockImplementation((cmd: string) => {
      if (cmd === "git rev-parse --show-toplevel") {
        return Promise.resolve({ stdout: "/test/repo\n", stderr: "" });
      }
      if (cmd === "git worktree list --porcelain") {
        return Promise.resolve({
          stdout:
            "worktree /test/repo\nHEAD abcd1234\nbranch refs/heads/main\n",
          stderr: "",
        });
      }
      return Promise.resolve({ stdout: "", stderr: "" });
    });

    const result = await getWorktrees();

    deepStrictEqual(result, [
      {
        path: "/test/repo",
        branch: "main",
        isDetached: false,
      },
    ]);
  });

  it("should parse multiple worktrees", async () => {
    execMock.mock.resetCalls();

    execMock.mock.mockImplementation((cmd: string) => {
      if (cmd === "git rev-parse --show-toplevel") {
        return Promise.resolve({ stdout: "/test/repo\n", stderr: "" });
      }
      if (cmd === "git worktree list --porcelain") {
        return Promise.resolve({
          stdout: [
            "worktree /test/repo",
            "HEAD abcd1234",
            "branch refs/heads/main",
            "",
            "worktree /test/repo/.git/phantom/gardens/feature",
            "HEAD efgh5678",
            "branch refs/heads/feature/test",
            "",
            "worktree /test/repo/.git/phantom/gardens/bugfix",
            "HEAD ijkl9012",
            "branch refs/heads/bugfix/issue-123",
            "",
          ].join("\n"),
          stderr: "",
        });
      }
      return Promise.resolve({ stdout: "", stderr: "" });
    });

    const result = await getWorktrees();

    deepStrictEqual(result, [
      {
        path: "/test/repo",
        branch: "main",
        isDetached: false,
      },
      {
        path: "/test/repo/.git/phantom/gardens/feature",
        branch: "feature/test",
        isDetached: false,
      },
      {
        path: "/test/repo/.git/phantom/gardens/bugfix",
        branch: "bugfix/issue-123",
        isDetached: false,
      },
    ]);
  });

  it("should handle detached HEAD state", async () => {
    execMock.mock.resetCalls();

    execMock.mock.mockImplementation((cmd: string) => {
      if (cmd === "git rev-parse --show-toplevel") {
        return Promise.resolve({ stdout: "/test/repo\n", stderr: "" });
      }
      if (cmd === "git worktree list --porcelain") {
        return Promise.resolve({
          stdout: [
            "worktree /test/repo",
            "HEAD abcd1234",
            "branch refs/heads/main",
            "",
            "worktree /test/repo/.git/phantom/gardens/detached",
            "HEAD efgh5678",
            "detached",
            "",
          ].join("\n"),
          stderr: "",
        });
      }
      return Promise.resolve({ stdout: "", stderr: "" });
    });

    const result = await getWorktrees();

    deepStrictEqual(result, [
      {
        path: "/test/repo",
        branch: "main",
        isDetached: false,
      },
      {
        path: "/test/repo/.git/phantom/gardens/detached",
        branch: undefined,
        isDetached: true,
      },
    ]);
  });

  it("should handle worktree without trailing empty line", async () => {
    execMock.mock.resetCalls();

    execMock.mock.mockImplementation((cmd: string) => {
      if (cmd === "git rev-parse --show-toplevel") {
        return Promise.resolve({ stdout: "/test/repo\n", stderr: "" });
      }
      if (cmd === "git worktree list --porcelain") {
        return Promise.resolve({
          stdout: [
            "worktree /test/repo",
            "HEAD abcd1234",
            "branch refs/heads/main",
            "",
            "worktree /test/repo/.git/phantom/gardens/feature",
            "HEAD efgh5678",
            "branch refs/heads/feature/test",
          ].join("\n"),
          stderr: "",
        });
      }
      return Promise.resolve({ stdout: "", stderr: "" });
    });

    const result = await getWorktrees();

    deepStrictEqual(result, [
      {
        path: "/test/repo",
        branch: "main",
        isDetached: false,
      },
      {
        path: "/test/repo/.git/phantom/gardens/feature",
        branch: "feature/test",
        isDetached: false,
      },
    ]);
  });

  it("should handle git command errors", async () => {
    execMock.mock.resetCalls();

    execMock.mock.mockImplementation((cmd: string) => {
      if (cmd === "git rev-parse --show-toplevel") {
        return Promise.resolve({ stdout: "/test/repo\n", stderr: "" });
      }
      if (cmd === "git worktree list --porcelain") {
        return Promise.reject(new Error("fatal: not a git repository"));
      }
      return Promise.resolve({ stdout: "", stderr: "" });
    });

    try {
      await getWorktrees();
      throw new Error("Expected error was not thrown");
    } catch (error) {
      deepStrictEqual((error as Error).message, "fatal: not a git repository");
    }
  });

  it("should handle empty worktree list", async () => {
    execMock.mock.resetCalls();

    execMock.mock.mockImplementation((cmd: string) => {
      if (cmd === "git rev-parse --show-toplevel") {
        return Promise.resolve({ stdout: "/test/repo\n", stderr: "" });
      }
      if (cmd === "git worktree list --porcelain") {
        return Promise.resolve({
          stdout: "",
          stderr: "",
        });
      }
      return Promise.resolve({ stdout: "", stderr: "" });
    });

    const result = await getWorktrees();

    deepStrictEqual(result, []);
  });

  it("should strip refs/heads/ prefix from branch names", async () => {
    execMock.mock.resetCalls();

    execMock.mock.mockImplementation((cmd: string) => {
      if (cmd === "git rev-parse --show-toplevel") {
        return Promise.resolve({ stdout: "/test/repo\n", stderr: "" });
      }
      if (cmd === "git worktree list --porcelain") {
        return Promise.resolve({
          stdout: [
            "worktree /test/repo",
            "HEAD abcd1234",
            "branch refs/heads/feature/with/slashes",
            "",
          ].join("\n"),
          stderr: "",
        });
      }
      return Promise.resolve({ stdout: "", stderr: "" });
    });

    const result = await getWorktrees();

    deepStrictEqual(result, [
      {
        path: "/test/repo",
        branch: "feature/with/slashes",
        isDetached: false,
      },
    ]);
  });
});
