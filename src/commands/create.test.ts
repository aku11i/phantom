import { deepStrictEqual, strictEqual } from "node:assert";
import { before, describe, it, mock } from "node:test";

describe("createWorktree", () => {
  let accessMock: ReturnType<typeof mock.fn>;
  let mkdirMock: ReturnType<typeof mock.fn>;
  let execMock: ReturnType<typeof mock.fn>;
  let createWorktree: typeof import("./create.ts").createWorktree;

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

    mock.module("./where.ts", {
      namedExports: {
        whereWorktree: mock.fn(),
      },
    });

    ({ createWorktree } = await import("./create.ts"));
  });

  it("should return error when name is not provided", async () => {
    const result = await createWorktree("");
    strictEqual(result.success, false);
    strictEqual(result.message, "Error: worktree name required");
  });

  it("should create worktree directory when it does not exist", async () => {
    accessMock.mock.resetCalls();
    mkdirMock.mock.resetCalls();
    execMock.mock.resetCalls();

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

    const result = await createWorktree("test-worktree");

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

    strictEqual(execMock.mock.calls.length, 2);
    strictEqual(
      execMock.mock.calls[0].arguments[0],
      "git rev-parse --show-toplevel",
    );
    strictEqual(
      execMock.mock.calls[1].arguments[0],
      'git worktree add "/test/repo/.git/phantom/worktrees/test-worktree" -b "test-worktree" HEAD',
    );
  });

  it("should return error when worktree already exists", async () => {
    accessMock.mock.resetCalls();
    mkdirMock.mock.resetCalls();
    execMock.mock.resetCalls();

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

    const result = await createWorktree("existing-worktree");

    strictEqual(result.success, false);
    strictEqual(
      result.message,
      "Error: worktree 'existing-worktree' already exists",
    );
  });

  it("should handle git command errors", async () => {
    accessMock.mock.resetCalls();
    mkdirMock.mock.resetCalls();
    execMock.mock.resetCalls();

    execMock.mock.mockImplementation(() => {
      return Promise.reject(new Error("Not a git repository"));
    });

    const result = await createWorktree("test-worktree");

    strictEqual(result.success, false);
    strictEqual(
      result.message,
      "Error creating worktree: Not a git repository",
    );
  });

  it("should not create worktrees directory if it already exists", async () => {
    accessMock.mock.resetCalls();
    mkdirMock.mock.resetCalls();
    execMock.mock.resetCalls();

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

    const result = await createWorktree("test-worktree");

    strictEqual(result.success, true);
    strictEqual(mkdirMock.mock.calls.length, 0);
  });
});
