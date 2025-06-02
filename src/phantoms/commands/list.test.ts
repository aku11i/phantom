import { deepStrictEqual, strictEqual } from "node:assert";
import { before, describe, it, mock } from "node:test";

describe("listPhantoms", () => {
  let accessMock: ReturnType<typeof mock.fn>;
  let readdirMock: ReturnType<typeof mock.fn>;
  let execMock: ReturnType<typeof mock.fn>;
  let listPhantoms: typeof import("./list.ts").listPhantoms;

  before(async () => {
    accessMock = mock.fn();
    readdirMock = mock.fn();
    execMock = mock.fn();

    mock.module("node:fs/promises", {
      namedExports: {
        access: accessMock,
        readdir: readdirMock,
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

    ({ listPhantoms } = await import("./list.ts"));
  });

  it("should return empty array when phantoms directory doesn't exist", async () => {
    accessMock.mock.resetCalls();
    readdirMock.mock.resetCalls();
    execMock.mock.resetCalls();

    // Mock getGitRoot
    execMock.mock.mockImplementation((cmd: string) => {
      if (cmd === "git rev-parse --show-toplevel") {
        return Promise.resolve({ stdout: "/test/repo\n", stderr: "" });
      }
      return Promise.resolve({ stdout: "", stderr: "" });
    });

    // Mock phantoms directory doesn't exist
    accessMock.mock.mockImplementation((path: string) => {
      if (path === "/test/repo/.git/phantom/worktrees") {
        return Promise.reject(new Error("ENOENT"));
      }
      return Promise.resolve();
    });

    const result = await listPhantoms();

    strictEqual(result.success, true);
    deepStrictEqual(result.phantoms, []);
    strictEqual(
      result.message,
      "No phantoms found (phantoms directory doesn't exist)",
    );
  });

  it("should return empty array when phantoms directory is empty", async () => {
    accessMock.mock.resetCalls();
    readdirMock.mock.resetCalls();
    execMock.mock.resetCalls();

    // Mock getGitRoot
    execMock.mock.mockImplementation((cmd: string) => {
      if (cmd === "git rev-parse --show-toplevel") {
        return Promise.resolve({ stdout: "/test/repo\n", stderr: "" });
      }
      return Promise.resolve({ stdout: "", stderr: "" });
    });

    // Mock phantoms directory exists but is empty
    accessMock.mock.mockImplementation(() => Promise.resolve());
    readdirMock.mock.mockImplementation(() => Promise.resolve([]));

    const result = await listPhantoms();

    strictEqual(result.success, true);
    deepStrictEqual(result.phantoms, []);
    strictEqual(result.message, "No phantoms found");
  });

  it("should list phantoms with clean status", async () => {
    accessMock.mock.resetCalls();
    readdirMock.mock.resetCalls();
    execMock.mock.resetCalls();

    // Mock getGitRoot and git commands
    execMock.mock.mockImplementation(
      (cmd: string, options?: { cwd?: string }) => {
        if (cmd === "git rev-parse --show-toplevel") {
          return Promise.resolve({ stdout: "/test/repo\n", stderr: "" });
        }
        if (cmd === "git branch --show-current") {
          if (options?.cwd?.includes("test-phantom-1")) {
            return Promise.resolve({ stdout: "feature/test\n", stderr: "" });
          }
          if (options?.cwd?.includes("test-phantom-2")) {
            return Promise.resolve({ stdout: "main\n", stderr: "" });
          }
        }
        if (cmd === "git status --porcelain") {
          return Promise.resolve({ stdout: "", stderr: "" }); // Clean status
        }
        return Promise.resolve({ stdout: "", stderr: "" });
      },
    );

    // Mock phantoms directory and contents
    accessMock.mock.mockImplementation(() => Promise.resolve());
    readdirMock.mock.mockImplementation(() =>
      Promise.resolve(["test-phantom-1", "test-phantom-2"]),
    );

    const result = await listPhantoms();

    strictEqual(result.success, true);
    strictEqual(result.phantoms?.length, 2);
    strictEqual(result.phantoms?.[0].name, "test-phantom-1");
    strictEqual(result.phantoms?.[0].branch, "feature/test");
    strictEqual(result.phantoms?.[0].status, "clean");
    strictEqual(result.phantoms?.[1].name, "test-phantom-2");
    strictEqual(result.phantoms?.[1].branch, "main");
    strictEqual(result.phantoms?.[1].status, "clean");
  });

  it("should list phantoms with dirty status", async () => {
    accessMock.mock.resetCalls();
    readdirMock.mock.resetCalls();
    execMock.mock.resetCalls();

    // Mock getGitRoot and git commands
    execMock.mock.mockImplementation(
      (cmd: string, options?: { cwd?: string }) => {
        if (cmd === "git rev-parse --show-toplevel") {
          return Promise.resolve({ stdout: "/test/repo\n", stderr: "" });
        }
        if (cmd === "git branch --show-current") {
          return Promise.resolve({ stdout: "feature/dirty\n", stderr: "" });
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

    // Mock phantoms directory and contents
    accessMock.mock.mockImplementation(() => Promise.resolve());
    readdirMock.mock.mockImplementation(() =>
      Promise.resolve(["dirty-phantom"]),
    );

    const result = await listPhantoms();

    strictEqual(result.success, true);
    strictEqual(result.phantoms?.length, 1);
    strictEqual(result.phantoms?.[0].name, "dirty-phantom");
    strictEqual(result.phantoms?.[0].branch, "feature/dirty");
    strictEqual(result.phantoms?.[0].status, "dirty");
    strictEqual(result.phantoms?.[0].changedFiles, 2);
  });

  it("should handle git command errors gracefully", async () => {
    accessMock.mock.resetCalls();
    readdirMock.mock.resetCalls();
    execMock.mock.resetCalls();

    // Mock getGitRoot and failing git commands
    execMock.mock.mockImplementation((cmd: string) => {
      if (cmd === "git rev-parse --show-toplevel") {
        return Promise.resolve({ stdout: "/test/repo\n", stderr: "" });
      }
      if (cmd === "git branch --show-current") {
        return Promise.reject(new Error("Not a git repository"));
      }
      if (cmd === "git status --porcelain") {
        return Promise.reject(new Error("Git command failed"));
      }
      return Promise.resolve({ stdout: "", stderr: "" });
    });

    // Mock phantoms directory and contents
    accessMock.mock.mockImplementation(() => Promise.resolve());
    readdirMock.mock.mockImplementation(() =>
      Promise.resolve(["error-phantom"]),
    );

    const result = await listPhantoms();

    strictEqual(result.success, true);
    strictEqual(result.phantoms?.length, 1);
    strictEqual(result.phantoms?.[0].name, "error-phantom");
    strictEqual(result.phantoms?.[0].branch, "unknown");
    strictEqual(result.phantoms?.[0].status, "clean");
  });

  it("should handle detached HEAD state", async () => {
    accessMock.mock.resetCalls();
    readdirMock.mock.resetCalls();
    execMock.mock.resetCalls();

    // Mock getGitRoot and git commands
    execMock.mock.mockImplementation((cmd: string) => {
      if (cmd === "git rev-parse --show-toplevel") {
        return Promise.resolve({ stdout: "/test/repo\n", stderr: "" });
      }
      if (cmd === "git branch --show-current") {
        return Promise.resolve({ stdout: "\n", stderr: "" }); // Empty output = detached HEAD
      }
      if (cmd === "git status --porcelain") {
        return Promise.resolve({ stdout: "", stderr: "" });
      }
      return Promise.resolve({ stdout: "", stderr: "" });
    });

    // Mock phantoms directory and contents
    accessMock.mock.mockImplementation(() => Promise.resolve());
    readdirMock.mock.mockImplementation(() =>
      Promise.resolve(["detached-phantom"]),
    );

    const result = await listPhantoms();

    strictEqual(result.success, true);
    strictEqual(result.phantoms?.length, 1);
    strictEqual(result.phantoms?.[0].name, "detached-phantom");
    strictEqual(result.phantoms?.[0].branch, "detached HEAD");
    strictEqual(result.phantoms?.[0].status, "clean");
  });
});
