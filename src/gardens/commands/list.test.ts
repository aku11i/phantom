import { deepStrictEqual, strictEqual } from "node:assert";
import { before, describe, it, mock } from "node:test";

describe("listGardens", () => {
  let execMock: ReturnType<typeof mock.fn>;
  let listGardens: typeof import("./list.ts").listGardens;

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

    ({ listGardens } = await import("./list.ts"));
  });

  it("should return empty array when no gardens exist", async () => {
    execMock.mock.resetCalls();

    // Mock getGitRoot and git worktree list with no gardens
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

    const result = await listGardens();

    strictEqual(result.success, true);
    deepStrictEqual(result.gardens, []);
    strictEqual(result.message, "No gardens found");
  });

  it("should list gardens with slash-separated names", async () => {
    execMock.mock.resetCalls();

    // Mock getGitRoot and git worktree list with slash-separated garden names
    execMock.mock.mockImplementation(
      (cmd: string, options?: { cwd?: string }) => {
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
              "worktree /test/repo/.git/phantom/gardens/test/test-1",
              "HEAD efgh5678",
              "branch refs/heads/feature/test-1",
              "",
              "worktree /test/repo/.git/phantom/gardens/feat/ui/button",
              "HEAD ijkl9012",
              "branch refs/heads/feat/ui/button",
              "",
            ].join("\n"),
            stderr: "",
          });
        }
        if (cmd === "git status --porcelain") {
          return Promise.resolve({ stdout: "", stderr: "" });
        }
        return Promise.resolve({ stdout: "", stderr: "" });
      },
    );

    const result = await listGardens();

    strictEqual(result.success, true);
    strictEqual(result.gardens?.length, 2);
    strictEqual(result.gardens?.[0].name, "test/test-1");
    strictEqual(result.gardens?.[0].branch, "feature/test-1");
    strictEqual(result.gardens?.[0].status, "clean");
    strictEqual(result.gardens?.[1].name, "feat/ui/button");
    strictEqual(result.gardens?.[1].branch, "feat/ui/button");
    strictEqual(result.gardens?.[1].status, "clean");
  });

  it("should list gardens with clean status", async () => {
    execMock.mock.resetCalls();

    // Mock getGitRoot and git commands
    execMock.mock.mockImplementation(
      (cmd: string, options?: { cwd?: string }) => {
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
              "worktree /test/repo/.git/phantom/gardens/test-garden-1",
              "HEAD efgh5678",
              "branch refs/heads/feature/test",
              "",
              "worktree /test/repo/.git/phantom/gardens/test-garden-2",
              "HEAD ijkl9012",
              "branch refs/heads/main",
              "",
            ].join("\n"),
            stderr: "",
          });
        }
        if (cmd === "git status --porcelain") {
          return Promise.resolve({ stdout: "", stderr: "" }); // Clean status
        }
        return Promise.resolve({ stdout: "", stderr: "" });
      },
    );

    const result = await listGardens();

    strictEqual(result.success, true);
    strictEqual(result.gardens?.length, 2);
    strictEqual(result.gardens?.[0].name, "test-garden-1");
    strictEqual(result.gardens?.[0].branch, "feature/test");
    strictEqual(result.gardens?.[0].status, "clean");
    strictEqual(result.gardens?.[1].name, "test-garden-2");
    strictEqual(result.gardens?.[1].branch, "main");
    strictEqual(result.gardens?.[1].status, "clean");
  });

  it("should list gardens with dirty status", async () => {
    execMock.mock.resetCalls();

    // Mock getGitRoot and git commands
    execMock.mock.mockImplementation(
      (cmd: string, options?: { cwd?: string }) => {
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
              "worktree /test/repo/.git/phantom/gardens/dirty-garden",
              "HEAD efgh5678",
              "branch refs/heads/feature/dirty",
              "",
            ].join("\n"),
            stderr: "",
          });
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

    const result = await listGardens();

    strictEqual(result.success, true);
    strictEqual(result.gardens?.length, 1);
    strictEqual(result.gardens?.[0].name, "dirty-garden");
    strictEqual(result.gardens?.[0].branch, "feature/dirty");
    strictEqual(result.gardens?.[0].status, "dirty");
    strictEqual(result.gardens?.[0].changedFiles, 2);
  });

  it("should handle git command errors gracefully", async () => {
    execMock.mock.resetCalls();

    // Mock getGitRoot and failing git commands
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
            "worktree /test/repo/.git/phantom/gardens/error-garden",
            "HEAD efgh5678",
            "branch refs/heads/feature/error",
            "",
          ].join("\n"),
          stderr: "",
        });
      }
      if (cmd === "git status --porcelain") {
        return Promise.reject(new Error("Git command failed"));
      }
      return Promise.resolve({ stdout: "", stderr: "" });
    });

    const result = await listGardens();

    strictEqual(result.success, true);
    strictEqual(result.gardens?.length, 1);
    strictEqual(result.gardens?.[0].name, "error-garden");
    strictEqual(result.gardens?.[0].branch, "feature/error");
    strictEqual(result.gardens?.[0].status, "clean");
  });

  it("should handle detached HEAD state", async () => {
    execMock.mock.resetCalls();

    // Mock getGitRoot and git commands
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
            "worktree /test/repo/.git/phantom/gardens/detached-garden",
            "HEAD efgh5678",
            "detached",
            "",
          ].join("\n"),
          stderr: "",
        });
      }
      if (cmd === "git status --porcelain") {
        return Promise.resolve({ stdout: "", stderr: "" });
      }
      return Promise.resolve({ stdout: "", stderr: "" });
    });

    const result = await listGardens();

    strictEqual(result.success, true);
    strictEqual(result.gardens?.length, 1);
    strictEqual(result.gardens?.[0].name, "detached-garden");
    strictEqual(result.gardens?.[0].branch, "detached HEAD");
    strictEqual(result.gardens?.[0].status, "clean");
  });

  it("should handle git worktree list errors", async () => {
    execMock.mock.resetCalls();

    // Mock getGitRoot and failing git worktree list
    execMock.mock.mockImplementation((cmd: string) => {
      if (cmd === "git rev-parse --show-toplevel") {
        return Promise.resolve({ stdout: "/test/repo\n", stderr: "" });
      }
      if (cmd === "git worktree list --porcelain") {
        return Promise.reject(new Error("fatal: not a git repository"));
      }
      return Promise.resolve({ stdout: "", stderr: "" });
    });

    const result = await listGardens();

    strictEqual(result.success, false);
    strictEqual(
      result.message,
      "Error running git worktree list: fatal: not a git repository",
    );
  });
});
