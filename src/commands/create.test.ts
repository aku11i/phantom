import { deepStrictEqual, strictEqual } from "node:assert";
import { before, describe, it, mock } from "node:test";
import type { createWorktree as CreateWorktreeType } from "../core/worktree/create.ts";

describe("createWorktree", () => {
  let accessMock: ReturnType<typeof mock.fn>;
  let mkdirMock: ReturnType<typeof mock.fn>;
  let execMock: ReturnType<typeof mock.fn>;
  let addWorktreeMock: ReturnType<typeof mock.fn>;
  let createWorktree: typeof CreateWorktreeType;

  before(async () => {
    accessMock = mock.fn();
    mkdirMock = mock.fn();
    execMock = mock.fn((cmd: string) => {
      if (cmd === "git rev-parse --show-toplevel") {
        return Promise.resolve({ stdout: "/test/repo\n", stderr: "" });
      }
      if (cmd.startsWith("git worktree add")) {
        return Promise.resolve({ stdout: "", stderr: "" });
      }
      return Promise.resolve({ stdout: "", stderr: "" });
    });
    addWorktreeMock = mock.fn();

    mock.module("node:fs/promises", {
      namedExports: {
        access: accessMock,
        mkdir: mkdirMock,
      },
    });

    mock.module("node:child_process", {
      namedExports: {
        exec: execMock,
        spawn: mock.fn(),
      },
    });

    mock.module("node:util", {
      namedExports: {
        promisify: (fn: unknown) => fn,
      },
    });

    // Mock new core modules
    mock.module("../core/paths.ts", {
      namedExports: {
        getPhantomDirectory: mock.fn(
          (gitRoot: string) => `${gitRoot}/.git/phantom/worktrees`,
        ),
        getWorktreePath: mock.fn(
          (gitRoot: string, name: string) =>
            `${gitRoot}/.git/phantom/worktrees/${name}`,
        ),
      },
    });

    mock.module("../core/worktree/validate.ts", {
      namedExports: {
        validateWorktreeDoesNotExist: mock.fn(
          (gitRoot: string, name: string) => {
            if (name === "existing-worktree") {
              return Promise.resolve({
                exists: true,
                message: "Worktree 'existing-worktree' already exists",
              });
            }
            return Promise.resolve({
              exists: false,
              path: `${gitRoot}/.git/phantom/worktrees/${name}`,
            });
          },
        ),
      },
    });

    mock.module("../git/libs/add-worktree.ts", {
      namedExports: {
        addWorktree: addWorktreeMock,
      },
    });

    ({ createWorktree } = await import("../core/worktree/create.ts"));
  });

  it("should return error when name is not provided", async () => {
    addWorktreeMock.mock.mockImplementation(() => {
      throw new Error("Invalid worktree name");
    });

    let errorThrown = false;
    try {
      await createWorktree("/test/repo", "");
    } catch (error) {
      errorThrown = true;
      // Empty name will result in error from git
      strictEqual(error instanceof Error, true);
      if (error instanceof Error) {
        strictEqual(error.message.includes("Failed to create worktree"), true);
      }
    }
    strictEqual(errorThrown, true);
  });

  it("should create worktree directory when it does not exist", async () => {
    accessMock.mock.resetCalls();
    mkdirMock.mock.resetCalls();
    execMock.mock.resetCalls();
    addWorktreeMock.mock.resetCalls();
    addWorktreeMock.mock.mockImplementation(() => Promise.resolve());

    accessMock.mock.mockImplementation((path: string) => {
      if (path === "/test/repo/.git/phantom/worktrees") {
        return Promise.reject(new Error("ENOENT"));
      }
      if (path === "/test/repo/.git/phantom/worktrees/test-worktree") {
        return Promise.reject(new Error("ENOENT"));
      }
      return Promise.resolve();
    });

    execMock.mock.mockImplementation((cmd: string) => {
      if (cmd === "git rev-parse --show-toplevel") {
        return Promise.resolve({ stdout: "/test/repo\n", stderr: "" });
      }
      if (cmd.startsWith("git worktree add")) {
        return Promise.resolve({ stdout: "", stderr: "" });
      }
      return Promise.resolve({ stdout: "", stderr: "" });
    });

    const result = await createWorktree("/test/repo", "test-worktree");

    strictEqual(result.success, true);
    strictEqual(
      result.message,
      "Created worktree 'test-worktree' at /test/repo/.git/phantom/worktrees/test-worktree",
    );
    strictEqual(result.path, "/test/repo/.git/phantom/worktrees/test-worktree");

    strictEqual(mkdirMock.mock.calls.length, 1);
    deepStrictEqual(mkdirMock.mock.calls[0].arguments, [
      "/test/repo/.git/phantom/worktrees",
      { recursive: true },
    ]);
  });

  it("should return error when worktree already exists", async () => {
    accessMock.mock.resetCalls();
    mkdirMock.mock.resetCalls();
    execMock.mock.resetCalls();
    addWorktreeMock.mock.resetCalls();

    accessMock.mock.mockImplementation((path: string) => {
      if (path === "/test/repo/.git/phantom/worktrees") {
        return Promise.resolve();
      }
      if (path === "/test/repo/.git/phantom/worktrees/existing-worktree") {
        return Promise.resolve();
      }
      return Promise.reject(new Error("ENOENT"));
    });
    execMock.mock.mockImplementation((cmd: string) => {
      if (cmd === "git rev-parse --show-toplevel") {
        return Promise.resolve({ stdout: "/test/repo\n", stderr: "" });
      }
      return Promise.resolve({ stdout: "", stderr: "" });
    });

    const result = await createWorktree("/test/repo", "existing-worktree");

    strictEqual(result.success, false);
    strictEqual(result.message, "Worktree 'existing-worktree' already exists");
  });

  it("should handle git command errors", async () => {
    accessMock.mock.resetCalls();
    mkdirMock.mock.resetCalls();
    execMock.mock.resetCalls();
    addWorktreeMock.mock.resetCalls();

    execMock.mock.mockImplementation(() => {
      return Promise.reject(new Error("Not a git repository"));
    });

    // Override the addWorktree mock to throw error
    addWorktreeMock.mock.mockImplementation(() => {
      throw new Error("Not a git repository");
    });

    // Should throw error since core module throws on failure
    let errorThrown = false;
    try {
      await createWorktree("/test/repo", "test-worktree");
    } catch (error) {
      errorThrown = true;
      strictEqual(error instanceof Error, true);
      if (error instanceof Error) {
        strictEqual(
          error.message,
          "Failed to create worktree: Not a git repository",
        );
      }
    }
    strictEqual(errorThrown, true);
  });

  it("should not create worktrees directory if it already exists", async () => {
    accessMock.mock.resetCalls();
    mkdirMock.mock.resetCalls();
    execMock.mock.resetCalls();
    addWorktreeMock.mock.resetCalls();
    addWorktreeMock.mock.mockImplementation(() => Promise.resolve());

    accessMock.mock.mockImplementation((path: string) => {
      if (path === "/test/repo/.git/phantom/worktrees") {
        return Promise.resolve();
      }
      if (path === "/test/repo/.git/phantom/worktrees/test-worktree") {
        return Promise.reject(new Error("ENOENT"));
      }
      return Promise.reject(new Error("ENOENT"));
    });
    execMock.mock.mockImplementation((cmd: string) => {
      if (cmd === "git rev-parse --show-toplevel") {
        return Promise.resolve({ stdout: "/test/repo\n", stderr: "" });
      }
      if (cmd.startsWith("git worktree add")) {
        return Promise.resolve({ stdout: "", stderr: "" });
      }
      return Promise.resolve({ stdout: "", stderr: "" });
    });

    const result = await createWorktree("/test/repo", "test-worktree");

    strictEqual(result.success, true);
    strictEqual(mkdirMock.mock.calls.length, 0);
  });
});
