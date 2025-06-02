import { strictEqual } from "node:assert";
import type { SpawnOptions } from "node:child_process";
import { before, describe, it, mock } from "node:test";
import type { shellInWorktree as ShellInWorktreeType } from "../core/process/shell.ts";
import type { SpawnConfig } from "../core/process/spawn.ts";

describe("shellInWorktree", () => {
  let spawnProcessMock: ReturnType<typeof mock.fn>;
  let validateWorktreeExistsMock: ReturnType<typeof mock.fn>;
  let shellInWorktree: typeof ShellInWorktreeType;

  before(async () => {
    spawnProcessMock = mock.fn();
    validateWorktreeExistsMock = mock.fn();

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

    ({ shellInWorktree } = await import("../core/process/shell.ts"));
  });

  it("should return error when phantom name is not provided", async () => {
    validateWorktreeExistsMock.mock.resetCalls();
    spawnProcessMock.mock.resetCalls();

    validateWorktreeExistsMock.mock.mockImplementation(() =>
      Promise.resolve({
        exists: false,
        message: "Worktree '' not found",
      }),
    );

    const result = await shellInWorktree("/test/repo", "");
    strictEqual(result.success, false);
    strictEqual(result.message, "Worktree '' not found");
  });

  it("should return error when phantom does not exist", async () => {
    validateWorktreeExistsMock.mock.resetCalls();
    spawnProcessMock.mock.resetCalls();

    validateWorktreeExistsMock.mock.mockImplementation(() =>
      Promise.resolve({
        exists: false,
        message: "Worktree 'nonexistent' not found",
      }),
    );

    const result = await shellInWorktree("/test/repo", "nonexistent");

    strictEqual(result.success, false);
    strictEqual(result.message, "Worktree 'nonexistent' not found");
  });

  it("should start shell successfully with exit code 0", async () => {
    validateWorktreeExistsMock.mock.resetCalls();
    spawnProcessMock.mock.resetCalls();

    validateWorktreeExistsMock.mock.mockImplementation(() =>
      Promise.resolve({
        exists: true,
        path: "/test/repo/.git/phantom/worktrees/test-worktree",
      }),
    );

    spawnProcessMock.mock.mockImplementation(() =>
      Promise.resolve({ success: true, exitCode: 0 }),
    );

    const result = await shellInWorktree("/test/repo", "test-worktree");

    strictEqual(result.success, true);
    strictEqual(result.exitCode, 0);

    // Verify spawnProcess was called with correct arguments
    strictEqual(spawnProcessMock.mock.calls.length, 1);
    const spawnCall = spawnProcessMock.mock.calls[0]
      .arguments[0] as SpawnConfig;
    strictEqual(spawnCall.command, process.env.SHELL || "/bin/sh");
    strictEqual(spawnCall.args?.length, 0);
    strictEqual(
      spawnCall.options?.cwd,
      "/test/repo/.git/phantom/worktrees/test-worktree",
    );
    strictEqual(spawnCall.options?.env?.PHANTOM, "1");
    strictEqual(spawnCall.options?.env?.PHANTOM_NAME, "test-worktree");
    strictEqual(
      spawnCall.options?.env?.PHANTOM_PATH,
      "/test/repo/.git/phantom/worktrees/test-worktree",
    );
  });

  it("should use /bin/sh when SHELL is not set", async () => {
    validateWorktreeExistsMock.mock.resetCalls();
    spawnProcessMock.mock.resetCalls();

    // Temporarily remove SHELL env var
    const originalShell = process.env.SHELL;
    // biome-ignore lint/performance/noDelete: Need to actually delete for test
    delete process.env.SHELL;

    validateWorktreeExistsMock.mock.mockImplementation(() =>
      Promise.resolve({
        exists: true,
        path: "/test/repo/.git/phantom/worktrees/test-worktree",
      }),
    );

    spawnProcessMock.mock.mockImplementation(() =>
      Promise.resolve({ success: true, exitCode: 0 }),
    );

    await shellInWorktree("/test/repo", "test-worktree");

    // Verify /bin/sh was used
    const spawnCall = spawnProcessMock.mock.calls[0]
      .arguments[0] as SpawnConfig;
    strictEqual(spawnCall.command, "/bin/sh");

    // Restore SHELL env var
    if (originalShell !== undefined) {
      process.env.SHELL = originalShell;
    }
  });

  it("should handle shell execution failure with non-zero exit code", async () => {
    validateWorktreeExistsMock.mock.resetCalls();
    spawnProcessMock.mock.resetCalls();

    validateWorktreeExistsMock.mock.mockImplementation(() =>
      Promise.resolve({
        exists: true,
        path: "/test/repo/.git/phantom/worktrees/test-worktree",
      }),
    );

    spawnProcessMock.mock.mockImplementation(() =>
      Promise.resolve({ success: false, exitCode: 1 }),
    );

    const result = await shellInWorktree("/test/repo", "test-worktree");

    strictEqual(result.success, false);
    strictEqual(result.exitCode, 1);
  });

  it("should handle shell startup error", async () => {
    validateWorktreeExistsMock.mock.resetCalls();
    spawnProcessMock.mock.resetCalls();

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

    const result = await shellInWorktree("/test/repo", "test-worktree");

    strictEqual(result.success, false);
    strictEqual(result.message, "Error starting shell: Shell not found");
  });

  it("should handle signal termination", async () => {
    validateWorktreeExistsMock.mock.resetCalls();
    spawnProcessMock.mock.resetCalls();

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

    const result = await shellInWorktree("/test/repo", "test-worktree");

    strictEqual(result.success, false);
    strictEqual(result.message, "Shell terminated by signal: SIGTERM");
    strictEqual(result.exitCode, 143); // 128 + 15 (SIGTERM)
  });
});
