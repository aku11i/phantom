import { deepStrictEqual, strictEqual } from "node:assert";
import { before, describe, it, mock } from "node:test";

describe("createGarden", () => {
  let accessMock: ReturnType<typeof mock.fn>;
  let mkdirMock: ReturnType<typeof mock.fn>;
  let execMock: ReturnType<typeof mock.fn>;
  let createGarden: typeof import("./create.ts").createGarden;

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

    mock.module("../../gardens/commands/where.ts", {
      namedExports: {
        whereGarden: mock.fn(),
      },
    });

    ({ createGarden } = await import("./create.ts"));
  });

  it("should return error when name is not provided", async () => {
    const result = await createGarden("");
    strictEqual(result.success, false);
    strictEqual(result.message, "Error: garden name required");
  });

  it("should create garden directory when it does not exist", async () => {
    accessMock.mock.resetCalls();
    mkdirMock.mock.resetCalls();
    execMock.mock.resetCalls();

    accessMock.mock.mockImplementation((path: string) => {
      if (path === "/test/repo/.git/phantom/gardens") {
        return Promise.reject(new Error("ENOENT"));
      }
      if (path === "/test/repo/.git/phantom/gardens/test-garden") {
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

    const result = await createGarden("test-garden");

    strictEqual(result.success, true);
    strictEqual(
      result.message,
      "Created garden 'test-garden' at /test/repo/.git/phantom/gardens/test-garden",
    );
    strictEqual(result.path, "/test/repo/.git/phantom/gardens/test-garden");

    strictEqual(mkdirMock.mock.calls.length, 1);
    deepStrictEqual(mkdirMock.mock.calls[0].arguments, [
      "/test/repo/.git/phantom/gardens",
      { recursive: true },
    ]);

    strictEqual(execMock.mock.calls.length, 2);
    strictEqual(
      execMock.mock.calls[0].arguments[0],
      "git rev-parse --show-toplevel",
    );
    strictEqual(
      execMock.mock.calls[1].arguments[0],
      'git worktree add "/test/repo/.git/phantom/gardens/test-garden" -b "phantom/gardens/test-garden" HEAD',
    );
  });

  it("should return error when garden already exists", async () => {
    accessMock.mock.resetCalls();
    mkdirMock.mock.resetCalls();
    execMock.mock.resetCalls();

    accessMock.mock.mockImplementation((path: string) => {
      if (path === "/test/repo/.git/phantom/gardens") {
        return Promise.resolve();
      }
      if (path === "/test/repo/.git/phantom/gardens/existing-garden") {
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

    const result = await createGarden("existing-garden");

    strictEqual(result.success, false);
    strictEqual(
      result.message,
      "Error: garden 'existing-garden' already exists",
    );
  });

  it("should handle git command errors", async () => {
    accessMock.mock.resetCalls();
    mkdirMock.mock.resetCalls();
    execMock.mock.resetCalls();

    execMock.mock.mockImplementation(() => {
      return Promise.reject(new Error("Not a git repository"));
    });

    const result = await createGarden("test-garden");

    strictEqual(result.success, false);
    strictEqual(result.message, "Error creating garden: Not a git repository");
  });

  it("should not create gardens directory if it already exists", async () => {
    accessMock.mock.resetCalls();
    mkdirMock.mock.resetCalls();
    execMock.mock.resetCalls();

    accessMock.mock.mockImplementation((path: string) => {
      if (path === "/test/repo/.git/phantom/gardens") {
        return Promise.resolve();
      }
      if (path === "/test/repo/.git/phantom/gardens/test-garden") {
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

    const result = await createGarden("test-garden");

    strictEqual(result.success, true);
    strictEqual(mkdirMock.mock.calls.length, 0);
  });
});
