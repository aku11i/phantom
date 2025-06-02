import { strictEqual } from "node:assert";
import { before, describe, it, mock } from "node:test";

describe("shellInWorktree", () => {
  let spawnMock: ReturnType<typeof mock.fn>;
  let whereWorktreeMock: ReturnType<typeof mock.fn>;
  let shellInWorktree: typeof import("./shell.ts").shellInWorktree;
  const originalEnv = process.env;

  before(async () => {
    spawnMock = mock.fn();
    whereWorktreeMock = mock.fn();

    mock.module("node:child_process", {
      namedExports: {
        spawn: spawnMock,
      },
    });

    mock.module("./where.ts", {
      namedExports: {
        whereWorktree: whereWorktreeMock,
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
    whereWorktreeMock.mock.resetCalls();
    spawnMock.mock.resetCalls();

    whereWorktreeMock.mock.mockImplementation(() =>
      Promise.resolve({
        success: false,
        message: "Error: Phantom 'nonexistent' does not exist",
      }),
    );

    const result = await shellInWorktree("nonexistent");

    strictEqual(result.success, false);
    strictEqual(result.message, "Error: Phantom 'nonexistent' does not exist");
  });

  it("should start shell successfully with exit code 0", async () => {
    whereWorktreeMock.mock.resetCalls();
    spawnMock.mock.resetCalls();

    // Mock successful phantom location
    whereWorktreeMock.mock.mockImplementation(() =>
      Promise.resolve({
        success: true,
        path: "/test/repo/.git/phantom/worktrees/test-worktree",
      }),
    );

    // Mock successful shell session
    const mockChildProcess = {
      on: mock.fn(
        (
          event: string,
          callback: (code: number | null, signal: string | null) => void,
        ) => {
          if (event === "exit") {
            // Simulate successful shell exit
            setTimeout(() => callback(0, null), 0);
          }
        },
      ),
    };

    spawnMock.mock.mockImplementation(() => mockChildProcess);

    const result = await shellInWorktree("test-worktree");

    strictEqual(result.success, true);
    strictEqual(result.exitCode, 0);

    // Verify spawn was called with correct arguments
    strictEqual(spawnMock.mock.calls.length, 1);
    const [shell, args, options] = spawnMock.mock.calls[0].arguments as [
      string,
      string[],
      { cwd: string; stdio: string; env: NodeJS.ProcessEnv },
    ];
    strictEqual(shell, process.env.SHELL || "/bin/sh");
    strictEqual(args.length, 0);
    strictEqual(options.cwd, "/test/repo/.git/phantom/worktrees/test-worktree");
    strictEqual(options.stdio, "inherit");
    strictEqual(options.env.WORKTREE_NAME, "test-worktree");
    strictEqual(
      options.env.WORKTREE_PATH,
      "/test/repo/.git/phantom/worktrees/test-worktree",
    );
  });

  it("should use /bin/sh when SHELL is not set", async () => {
    whereWorktreeMock.mock.resetCalls();
    spawnMock.mock.resetCalls();

    // Temporarily remove SHELL env var
    const originalShell = process.env.SHELL;
    // biome-ignore lint/performance/noDelete: Need to actually delete for test
    delete process.env.SHELL;

    // Mock successful phantom location
    whereWorktreeMock.mock.mockImplementation(() =>
      Promise.resolve({
        success: true,
        path: "/test/repo/.git/phantom/worktrees/test-worktree",
      }),
    );

    // Mock successful shell session
    const mockChildProcess = {
      on: mock.fn(
        (
          event: string,
          callback: (code: number | null, signal: string | null) => void,
        ) => {
          if (event === "exit") {
            setTimeout(() => callback(0, null), 0);
          }
        },
      ),
    };

    spawnMock.mock.mockImplementation(() => mockChildProcess);

    await shellInWorktree("test-worktree");

    // Verify /bin/sh was used
    const [shell] = spawnMock.mock.calls[0].arguments as [string, unknown];
    strictEqual(shell, "/bin/sh");

    // Restore SHELL env var
    if (originalShell !== undefined) {
      process.env.SHELL = originalShell;
    }
  });

  it("should handle shell execution failure with non-zero exit code", async () => {
    whereWorktreeMock.mock.resetCalls();
    spawnMock.mock.resetCalls();

    // Mock successful phantom location
    whereWorktreeMock.mock.mockImplementation(() =>
      Promise.resolve({
        success: true,
        path: "/test/repo/.git/phantom/worktrees/test-worktree",
      }),
    );

    // Mock failed shell session
    const mockChildProcess = {
      on: mock.fn(
        (
          event: string,
          callback: (code: number | null, signal: string | null) => void,
        ) => {
          if (event === "exit") {
            // Simulate failed shell exit
            setTimeout(() => callback(1, null), 0);
          }
        },
      ),
    };

    spawnMock.mock.mockImplementation(() => mockChildProcess);

    const result = await shellInWorktree("test-worktree");

    strictEqual(result.success, false);
    strictEqual(result.exitCode, 1);
  });

  it("should handle shell startup error", async () => {
    whereWorktreeMock.mock.resetCalls();
    spawnMock.mock.resetCalls();

    // Mock successful phantom location
    whereWorktreeMock.mock.mockImplementation(() =>
      Promise.resolve({
        success: true,
        path: "/test/repo/.git/phantom/worktrees/test-worktree",
      }),
    );

    // Mock shell startup error
    const mockChildProcess = {
      on: mock.fn((event: string, callback: (error: Error) => void) => {
        if (event === "error") {
          setTimeout(() => callback(new Error("Shell not found")), 0);
        }
      }),
    };

    spawnMock.mock.mockImplementation(() => mockChildProcess);

    const result = await shellInWorktree("test-worktree");

    strictEqual(result.success, false);
    strictEqual(result.message, "Error starting shell: Shell not found");
  });

  it("should handle signal termination", async () => {
    whereWorktreeMock.mock.resetCalls();
    spawnMock.mock.resetCalls();

    // Mock successful phantom location
    whereWorktreeMock.mock.mockImplementation(() =>
      Promise.resolve({
        success: true,
        path: "/test/repo/.git/phantom/worktrees/test-worktree",
      }),
    );

    // Mock signal termination
    const mockChildProcess = {
      on: mock.fn(
        (
          event: string,
          callback: (code: number | null, signal: string | null) => void,
        ) => {
          if (event === "exit") {
            // Simulate signal termination
            setTimeout(() => callback(null, "SIGTERM"), 0);
          }
        },
      ),
    };

    spawnMock.mock.mockImplementation(() => mockChildProcess);

    const result = await shellInWorktree("test-worktree");

    strictEqual(result.success, false);
    strictEqual(result.message, "Shell terminated by signal: SIGTERM");
    strictEqual(result.exitCode, 143); // 128 + 15 (SIGTERM)
  });
});
