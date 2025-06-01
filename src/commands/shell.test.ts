import { strictEqual } from "node:assert";
import { before, describe, it, mock } from "node:test";

describe("shellInRuin", () => {
  let spawnMock: ReturnType<typeof mock.fn>;
  let whereRuinMock: ReturnType<typeof mock.fn>;
  let shellInRuin: typeof import("./shell.ts").shellInRuin;
  const originalEnv = process.env;

  before(async () => {
    spawnMock = mock.fn();
    whereRuinMock = mock.fn();

    mock.module("node:child_process", {
      namedExports: {
        spawn: spawnMock,
      },
    });

    mock.module("../ruins/commands/where.ts", {
      namedExports: {
        whereRuin: whereRuinMock,
      },
    });

    ({ shellInRuin } = await import("./shell.ts"));
  });

  it("should return error when ruin name is not provided", async () => {
    const result = await shellInRuin("");
    strictEqual(result.success, false);
    strictEqual(result.message, "Error: ruin name required");
  });

  it("should return error when ruin does not exist", async () => {
    whereRuinMock.mock.resetCalls();
    spawnMock.mock.resetCalls();

    whereRuinMock.mock.mockImplementation(() =>
      Promise.resolve({
        success: false,
        message: "Error: Ruin 'nonexistent' does not exist",
      }),
    );

    const result = await shellInRuin("nonexistent");

    strictEqual(result.success, false);
    strictEqual(result.message, "Error: Ruin 'nonexistent' does not exist");
  });

  it("should start shell successfully with exit code 0", async () => {
    whereRuinMock.mock.resetCalls();
    spawnMock.mock.resetCalls();

    // Mock successful ruin location
    whereRuinMock.mock.mockImplementation(() =>
      Promise.resolve({
        success: true,
        path: "/test/repo/.git/phantom/ruins/test-ruin",
      }),
    );

    // Mock successful shell execution
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

    // Set SHELL environment variable for testing
    process.env.SHELL = "/bin/bash";
    const result = await shellInRuin("test-ruin");

    strictEqual(result.success, true);
    strictEqual(result.exitCode, 0);

    // Verify spawn was called with correct arguments
    strictEqual(spawnMock.mock.calls.length, 1);
    const [shell, args, options] = spawnMock.mock.calls[0].arguments as [
      string,
      string[],
      { cwd: string; stdio: string; env: Record<string, string> },
    ];
    strictEqual(shell, "/bin/bash");
    strictEqual(args.length, 0);
    strictEqual(options.cwd, "/test/repo/.git/phantom/ruins/test-ruin");
    strictEqual(options.stdio, "inherit");
    strictEqual(options.env.PHANTOM_RUIN, "test-ruin");
    strictEqual(
      options.env.PHANTOM_RUIN_PATH,
      "/test/repo/.git/phantom/ruins/test-ruin",
    );

    // Restore original env
    process.env = originalEnv;
  });

  it("should use /bin/sh when SHELL is not set", async () => {
    whereRuinMock.mock.resetCalls();
    spawnMock.mock.resetCalls();

    // Mock successful ruin location
    whereRuinMock.mock.mockImplementation(() =>
      Promise.resolve({
        success: true,
        path: "/test/repo/.git/phantom/ruins/test-ruin",
      }),
    );

    // Mock successful shell execution
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

    // Create new env without SHELL
    const { SHELL: _, ...envWithoutShell } = originalEnv;
    process.env = envWithoutShell;

    const result = await shellInRuin("test-ruin");

    strictEqual(result.success, true);

    // Verify default shell was used
    const [shell] = spawnMock.mock.calls[0].arguments as [
      string,
      unknown,
      unknown,
    ];
    strictEqual(shell, "/bin/sh");

    // Restore original env
    process.env = originalEnv;
  });

  it("should handle shell execution failure with non-zero exit code", async () => {
    whereRuinMock.mock.resetCalls();
    spawnMock.mock.resetCalls();

    // Mock successful ruin location
    whereRuinMock.mock.mockImplementation(() =>
      Promise.resolve({
        success: true,
        path: "/test/repo/.git/phantom/ruins/test-ruin",
      }),
    );

    // Mock failed shell execution
    const mockChildProcess = {
      on: mock.fn(
        (
          event: string,
          callback: (code: number | null, signal: string | null) => void,
        ) => {
          if (event === "exit") {
            // Simulate shell exit with error
            setTimeout(() => callback(1, null), 0);
          }
        },
      ),
    };

    spawnMock.mock.mockImplementation(() => mockChildProcess);

    const result = await shellInRuin("test-ruin");

    strictEqual(result.success, false);
    strictEqual(result.exitCode, 1);
  });

  it("should handle shell startup error", async () => {
    whereRuinMock.mock.resetCalls();
    spawnMock.mock.resetCalls();

    // Mock successful ruin location
    whereRuinMock.mock.mockImplementation(() =>
      Promise.resolve({
        success: true,
        path: "/test/repo/.git/phantom/ruins/test-ruin",
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

    const result = await shellInRuin("test-ruin");

    strictEqual(result.success, false);
    strictEqual(result.message, "Error starting shell: Shell not found");
  });

  it("should handle signal termination", async () => {
    whereRuinMock.mock.resetCalls();
    spawnMock.mock.resetCalls();

    // Mock successful ruin location
    whereRuinMock.mock.mockImplementation(() =>
      Promise.resolve({
        success: true,
        path: "/test/repo/.git/phantom/ruins/test-ruin",
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

    const result = await shellInRuin("test-ruin");

    strictEqual(result.success, false);
    strictEqual(result.message, "Shell terminated by signal: SIGTERM");
    strictEqual(result.exitCode, 143); // 128 + 15 (SIGTERM)
  });
});
