import { deepStrictEqual, strictEqual } from "node:assert";
import { before, describe, it, mock } from "node:test";

describe("createPhantom", () => {
  let accessMock: ReturnType<typeof mock.fn>;
  let mkdirMock: ReturnType<typeof mock.fn>;
  let execMock: ReturnType<typeof mock.fn>;
  let createPhantom: typeof import("./create.ts").createPhantom;

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

    mock.module("../../phantoms/commands/where.ts", {
      namedExports: {
        wherePhantom: mock.fn(),
      },
    });

    ({ createPhantom } = await import("./create.ts"));
  });

  it("should return error when name is not provided", async () => {
    const result = await createPhantom("");
    strictEqual(result.success, false);
    strictEqual(result.message, "Error: phantom name required");
  });

  it("should create phantom directory when it does not exist", async () => {
    accessMock.mock.resetCalls();
    mkdirMock.mock.resetCalls();
    execMock.mock.resetCalls();

    accessMock.mock.mockImplementation((path: string) => {
      if (path === "/test/repo/.git/phantom/worktrees") {
        return Promise.reject(new Error("ENOENT"));
      }
      if (path === "/test/repo/.git/phantom/worktrees/test-phantom") {
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

    const result = await createPhantom("test-phantom");

    strictEqual(result.success, true);
    strictEqual(
      result.message,
      "Created phantom 'test-phantom' at /test/repo/.git/phantom/worktrees/test-phantom",
    );
    strictEqual(result.path, "/test/repo/.git/phantom/worktrees/test-phantom");

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
      'git worktree add "/test/repo/.git/phantom/worktrees/test-phantom" -b "test-phantom" HEAD',
    );
  });

  it("should return error when phantom already exists", async () => {
    accessMock.mock.resetCalls();
    mkdirMock.mock.resetCalls();
    execMock.mock.resetCalls();

    accessMock.mock.mockImplementation((path: string) => {
      if (path === "/test/repo/.git/phantom/worktrees") {
        return Promise.resolve();
      }
      if (path === "/test/repo/.git/phantom/worktrees/existing-phantom") {
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

    const result = await createPhantom("existing-phantom");

    strictEqual(result.success, false);
    strictEqual(
      result.message,
      "Error: phantom 'existing-phantom' already exists",
    );
  });

  it("should handle git command errors", async () => {
    accessMock.mock.resetCalls();
    mkdirMock.mock.resetCalls();
    execMock.mock.resetCalls();

    execMock.mock.mockImplementation(() => {
      return Promise.reject(new Error("Not a git repository"));
    });

    const result = await createPhantom("test-phantom");

    strictEqual(result.success, false);
    strictEqual(result.message, "Error creating phantom: Not a git repository");
  });

  it("should not create phantoms directory if it already exists", async () => {
    accessMock.mock.resetCalls();
    mkdirMock.mock.resetCalls();
    execMock.mock.resetCalls();

    accessMock.mock.mockImplementation((path: string) => {
      if (path === "/test/repo/.git/phantom/worktrees") {
        return Promise.resolve();
      }
      if (path === "/test/repo/.git/phantom/worktrees/test-phantom") {
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

    const result = await createPhantom("test-phantom");

    strictEqual(result.success, true);
    strictEqual(mkdirMock.mock.calls.length, 0);
  });
});
