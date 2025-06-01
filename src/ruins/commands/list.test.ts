import { deepStrictEqual, strictEqual } from "node:assert";
import { before, describe, it, mock } from "node:test";

describe("listRuins", () => {
  let accessMock: ReturnType<typeof mock.fn>;
  let readdirMock: ReturnType<typeof mock.fn>;
  let execMock: ReturnType<typeof mock.fn>;
  let listRuins: typeof import("./list.ts").listRuins;

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

    ({ listRuins } = await import("./list.ts"));
  });

  it("should return empty array when ruins directory doesn't exist", async () => {
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

    // Mock ruins directory doesn't exist
    accessMock.mock.mockImplementation((path: string) => {
      if (path === "/test/repo/.git/phantom/ruins") {
        return Promise.reject(new Error("ENOENT"));
      }
      return Promise.resolve();
    });

    const result = await listRuins();

    strictEqual(result.success, true);
    deepStrictEqual(result.ruins, []);
    strictEqual(
      result.message,
      "No ruins found (ruins directory doesn't exist)",
    );
  });

  it("should return empty array when ruins directory is empty", async () => {
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

    // Mock ruins directory exists but is empty
    accessMock.mock.mockImplementation(() => Promise.resolve());
    readdirMock.mock.mockImplementation(() => Promise.resolve([]));

    const result = await listRuins();

    strictEqual(result.success, true);
    deepStrictEqual(result.ruins, []);
    strictEqual(result.message, "No ruins found");
  });

  it("should list ruins with clean status", async () => {
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
          if (options?.cwd?.includes("test-ruin-1")) {
            return Promise.resolve({ stdout: "feature/test\n", stderr: "" });
          }
          if (options?.cwd?.includes("test-ruin-2")) {
            return Promise.resolve({ stdout: "main\n", stderr: "" });
          }
        }
        if (cmd === "git status --porcelain") {
          return Promise.resolve({ stdout: "", stderr: "" }); // Clean status
        }
        return Promise.resolve({ stdout: "", stderr: "" });
      },
    );

    // Mock ruins directory and contents
    accessMock.mock.mockImplementation(() => Promise.resolve());
    readdirMock.mock.mockImplementation(() =>
      Promise.resolve(["test-ruin-1", "test-ruin-2"]),
    );

    const result = await listRuins();

    strictEqual(result.success, true);
    strictEqual(result.ruins?.length, 2);
    strictEqual(result.ruins?.[0].name, "test-ruin-1");
    strictEqual(result.ruins?.[0].branch, "feature/test");
    strictEqual(result.ruins?.[0].status, "clean");
    strictEqual(result.ruins?.[1].name, "test-ruin-2");
    strictEqual(result.ruins?.[1].branch, "main");
    strictEqual(result.ruins?.[1].status, "clean");
  });

  it("should list ruins with dirty status", async () => {
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

    // Mock ruins directory and contents
    accessMock.mock.mockImplementation(() => Promise.resolve());
    readdirMock.mock.mockImplementation(() => Promise.resolve(["dirty-ruin"]));

    const result = await listRuins();

    strictEqual(result.success, true);
    strictEqual(result.ruins?.length, 1);
    strictEqual(result.ruins?.[0].name, "dirty-ruin");
    strictEqual(result.ruins?.[0].branch, "feature/dirty");
    strictEqual(result.ruins?.[0].status, "dirty");
    strictEqual(result.ruins?.[0].changedFiles, 2);
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

    // Mock ruins directory and contents
    accessMock.mock.mockImplementation(() => Promise.resolve());
    readdirMock.mock.mockImplementation(() => Promise.resolve(["error-ruin"]));

    const result = await listRuins();

    strictEqual(result.success, true);
    strictEqual(result.ruins?.length, 1);
    strictEqual(result.ruins?.[0].name, "error-ruin");
    strictEqual(result.ruins?.[0].branch, "unknown");
    strictEqual(result.ruins?.[0].status, "clean");
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

    // Mock ruins directory and contents
    accessMock.mock.mockImplementation(() => Promise.resolve());
    readdirMock.mock.mockImplementation(() =>
      Promise.resolve(["detached-ruin"]),
    );

    const result = await listRuins();

    strictEqual(result.success, true);
    strictEqual(result.ruins?.length, 1);
    strictEqual(result.ruins?.[0].name, "detached-ruin");
    strictEqual(result.ruins?.[0].branch, "detached HEAD");
    strictEqual(result.ruins?.[0].status, "clean");
  });
});
