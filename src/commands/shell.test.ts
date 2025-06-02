import { strictEqual } from "node:assert";
import type { SpawnOptions } from "node:child_process";
import { before, describe, it, mock } from "node:test";

describe("shellInWorktree", () => {
  let spawnProcessMock: ReturnType<typeof mock.fn>;
  let validateWorktreeExistsMock: ReturnType<typeof mock.fn>;
  let getGitRootMock: ReturnType<typeof mock.fn>;
  let shellInWorktree: typeof import("./shell.ts").shellInWorktree;

  before(async () => {
    spawnProcessMock = mock.fn();
    validateWorktreeExistsMock = mock.fn();
    getGitRootMock = mock.fn();

    mock.module("../core/process/spawn.ts", {
      namedExports: {
        spawnProcess: spawnProcessMock,
      },
    });

    mock.module("../core/worktree/validate.ts", {
      namedExports: {
        validateWorktreeExists: validateWorktreeExistsMock,
      },
    });

    mock.module("../git/libs/get-git-root.ts", {
      namedExports: {
        getGitRoot: getGitRootMock,
      },
    });

    ({ shellInWorktree } = await import("./shell.ts"));
  });

  it("should return error when phantom name is not provided", async () => {
    const result = await shellInWorktree("");
    strictEqual(result.success, false);
    strictEqual(result.message, "Error: worktree name required");
  });

  it("should return error when phantom does not exist", async () => {
    getGitRootMock.mock.resetCalls();
    validateWorktreeExistsMock.mock.resetCalls();
    spawnProcessMock.mock.resetCalls();

    getGitRootMock.mock.mockImplementation(() => Promise.resolve("/test/repo"));

    validateWorktreeExistsMock.mock.mockImplementation(() =>
      Promise.resolve({
        exists: false,
        message: "Phantom 'nonexistent' does not exist",
      }),
    );

    const result = await shellInWorktree("nonexistent");

    strictEqual(result.success, false);
    strictEqual(result.message, "Error: Phantom 'nonexistent' does not exist");
  });

  it("should start shell successfully with exit code 0", async () => {
    getGitRootMock.mock.resetCalls();
    validateWorktreeExistsMock.mock.resetCalls();
    spawnProcessMock.mock.resetCalls();

    getGitRootMock.mock.mockImplementation(() => Promise.resolve("/test/repo"));

    validateWorktreeExistsMock.mock.mockImplementation(() =>
      Promise.resolve({
        exists: true,
        path: "/test/repo/.git/phantom/worktrees/test-worktree",
      }),
    );

    spawnProcessMock.mock.mockImplementation(() =>
      Promise.resolve({ success: true, exitCode: 0 }),
    );

    const result = await shellInWorktree("test-worktree");

    strictEqual(result.success, true);
    strictEqual(result.exitCode, 0);

    // Verify spawnProcess was called with correct arguments
    strictEqual(spawnProcessMock.mock.calls.length, 1);
    const spawnCall = spawnProcessMock.mock.calls[0].arguments[0] as {
      command: string;
      args?: string[];
      options?: SpawnOptions & { env?: Record<string, string> };
    };
    strictEqual(spawnCall.command, process.env.SHELL || "/bin/sh");
    strictEqual(spawnCall.args?.length, 0);
    strictEqual(
      spawnCall.options?.cwd,
      "/test/repo/.git/phantom/worktrees/test-worktree",
    );
    strictEqual(spawnCall.options?.env?.WORKTREE_NAME, "test-worktree");
    strictEqual(
      spawnCall.options?.env?.WORKTREE_PATH,
      "/test/repo/.git/phantom/worktrees/test-worktree",
    );
  });

  it("should use /bin/sh when SHELL is not set", async () => {
    getGitRootMock.mock.resetCalls();
    validateWorktreeExistsMock.mock.resetCalls();
    spawnProcessMock.mock.resetCalls();

    // Temporarily remove SHELL env var
    const originalShell = process.env.SHELL;
    // biome-ignore lint/performance/noDelete: Need to actually delete for test
    delete process.env.SHELL;

    getGitRootMock.mock.mockImplementation(() => Promise.resolve("/test/repo"));

    validateWorktreeExistsMock.mock.mockImplementation(() =>
      Promise.resolve({
        exists: true,
        path: "/test/repo/.git/phantom/worktrees/test-worktree",
      }),
    );

    spawnProcessMock.mock.mockImplementation(() =>
      Promise.resolve({ success: true, exitCode: 0 }),
    );

    await shellInWorktree("test-worktree");

    // Verify /bin/sh was used
    const spawnCall = spawnProcessMock.mock.calls[0].arguments[0] as {
      command: string;
      args?: string[];
      options?: SpawnOptions;
    };
    strictEqual(spawnCall.command, "/bin/sh");

    // Restore SHELL env var
    if (originalShell !== undefined) {
      process.env.SHELL = originalShell;
    }
  });

  it("should handle shell execution failure with non-zero exit code", async () => {
    getGitRootMock.mock.resetCalls();
    validateWorktreeExistsMock.mock.resetCalls();
    spawnProcessMock.mock.resetCalls();

    getGitRootMock.mock.mockImplementation(() => Promise.resolve("/test/repo"));

    validateWorktreeExistsMock.mock.mockImplementation(() =>
      Promise.resolve({
        exists: true,
        path: "/test/repo/.git/phantom/worktrees/test-worktree",
      }),
    );

    spawnProcessMock.mock.mockImplementation(() =>
      Promise.resolve({ success: false, exitCode: 1 }),
    );

    const result = await shellInWorktree("test-worktree");

    strictEqual(result.success, false);
    strictEqual(result.exitCode, 1);
  });

  it("should handle shell startup error", async () => {
    getGitRootMock.mock.resetCalls();
    validateWorktreeExistsMock.mock.resetCalls();
    spawnProcessMock.mock.resetCalls();

    getGitRootMock.mock.mockImplementation(() => Promise.resolve("/test/repo"));

    validateWorktreeExistsMock.mock.mockImplementation(() =>
      Promise.resolve({
        exists: true,
        path: "/test/repo/.git/phantom/worktrees/test-worktree",
      }),
    );

    spawnProcessMock.mock.mockImplementation(() =>
      Promise.resolve({
        success: false,
        message: "Error starting shell: Shell not found",
      }),
    );

    const result = await shellInWorktree("test-worktree");

    strictEqual(result.success, false);
    strictEqual(result.message, "Error starting shell: Shell not found");
  });

  it("should handle signal termination", async () => {
    getGitRootMock.mock.resetCalls();
    validateWorktreeExistsMock.mock.resetCalls();
    spawnProcessMock.mock.resetCalls();

    getGitRootMock.mock.mockImplementation(() => Promise.resolve("/test/repo"));

    validateWorktreeExistsMock.mock.mockImplementation(() =>
      Promise.resolve({
        exists: true,
        path: "/test/repo/.git/phantom/worktrees/test-worktree",
      }),
    );

    spawnProcessMock.mock.mockImplementation(() =>
      Promise.resolve({
        success: false,
        message: "Shell terminated by signal: SIGTERM",
        exitCode: 143, // 128 + 15 (SIGTERM)
      }),
    );

    const result = await shellInWorktree("test-worktree");

    strictEqual(result.success, false);
    strictEqual(result.message, "Shell terminated by signal: SIGTERM");
    strictEqual(result.exitCode, 143); // 128 + 15 (SIGTERM)
  });

  it("should handle git root error", async () => {
    getGitRootMock.mock.resetCalls();
    validateWorktreeExistsMock.mock.resetCalls();
    spawnProcessMock.mock.resetCalls();

    getGitRootMock.mock.mockImplementation(() =>
      Promise.reject(new Error("Not a git repository")),
    );

    const result = await shellInWorktree("test-worktree");

    strictEqual(result.success, false);
    strictEqual(result.message, "Error: Not a git repository");
  });
});
