import { strictEqual } from "node:assert";
import { before, describe, it, mock } from "node:test";

describe("execInRuin", () => {
  let spawnMock: ReturnType<typeof mock.fn>;
  let whereRuinMock: ReturnType<typeof mock.fn>;
  let execInRuin: typeof import("./exec.ts").execInRuin;

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

    ({ execInRuin } = await import("./exec.ts"));
  });

  it("should return error when ruin name is not provided", async () => {
    const result = await execInRuin("", ["echo", "test"]);
    strictEqual(result.success, false);
    strictEqual(result.message, "Error: ruin name required");
  });

  it("should return error when command is not provided", async () => {
    const result = await execInRuin("test-ruin", []);
    strictEqual(result.success, false);
    strictEqual(result.message, "Error: command required");
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

    const result = await execInRuin("nonexistent", ["echo", "test"]);

    strictEqual(result.success, false);
    strictEqual(result.message, "Error: Ruin 'nonexistent' does not exist");
  });

  it("should execute command successfully with exit code 0", async () => {
    whereRuinMock.mock.resetCalls();
    spawnMock.mock.resetCalls();

    // Mock successful ruin location
    whereRuinMock.mock.mockImplementation(() =>
      Promise.resolve({
        success: true,
        path: "/test/repo/.git/phantom/ruins/test-ruin",
      }),
    );

    // Mock successful command execution
    const mockChildProcess = {
      on: mock.fn(
        (
          event: string,
          callback: (code: number | null, signal: string | null) => void,
        ) => {
          if (event === "exit") {
            // Simulate successful command (exit code 0)
            setTimeout(() => callback(0, null), 0);
          }
        },
      ),
    };

    spawnMock.mock.mockImplementation(() => mockChildProcess);

    const result = await execInRuin("test-ruin", ["echo", "hello"]);

    strictEqual(result.success, true);
    strictEqual(result.exitCode, 0);

    // Verify spawn was called with correct arguments
    strictEqual(spawnMock.mock.calls.length, 1);
    const [cmd, args, options] = spawnMock.mock.calls[0].arguments as [
      string,
      string[],
      { cwd: string; stdio: string },
    ];
    strictEqual(cmd, "echo");
    strictEqual(args[0], "hello");
    strictEqual(options.cwd, "/test/repo/.git/phantom/ruins/test-ruin");
    strictEqual(options.stdio, "inherit");
  });

  it("should handle command execution failure with non-zero exit code", async () => {
    whereRuinMock.mock.resetCalls();
    spawnMock.mock.resetCalls();

    // Mock successful ruin location
    whereRuinMock.mock.mockImplementation(() =>
      Promise.resolve({
        success: true,
        path: "/test/repo/.git/phantom/ruins/test-ruin",
      }),
    );

    // Mock failed command execution
    const mockChildProcess = {
      on: mock.fn(
        (
          event: string,
          callback: (code: number | null, signal: string | null) => void,
        ) => {
          if (event === "exit") {
            // Simulate failed command (exit code 1)
            setTimeout(() => callback(1, null), 0);
          }
        },
      ),
    };

    spawnMock.mock.mockImplementation(() => mockChildProcess);

    const result = await execInRuin("test-ruin", ["false"]);

    strictEqual(result.success, false);
    strictEqual(result.exitCode, 1);
  });

  it("should handle command execution error", async () => {
    whereRuinMock.mock.resetCalls();
    spawnMock.mock.resetCalls();

    // Mock successful ruin location
    whereRuinMock.mock.mockImplementation(() =>
      Promise.resolve({
        success: true,
        path: "/test/repo/.git/phantom/ruins/test-ruin",
      }),
    );

    // Mock command execution error
    const mockChildProcess = {
      on: mock.fn((event: string, callback: (error: Error) => void) => {
        if (event === "error") {
          setTimeout(() => callback(new Error("Command not found")), 0);
        }
      }),
    };

    spawnMock.mock.mockImplementation(() => mockChildProcess);

    const result = await execInRuin("test-ruin", ["nonexistent-command"]);

    strictEqual(result.success, false);
    strictEqual(result.message, "Error executing command: Command not found");
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

    const result = await execInRuin("test-ruin", ["long-running-command"]);

    strictEqual(result.success, false);
    strictEqual(result.message, "Command terminated by signal: SIGTERM");
    strictEqual(result.exitCode, 143); // 128 + 15 (SIGTERM)
  });

  it("should parse complex commands with multiple arguments", async () => {
    whereRuinMock.mock.resetCalls();
    spawnMock.mock.resetCalls();

    // Mock successful ruin location
    whereRuinMock.mock.mockImplementation(() =>
      Promise.resolve({
        success: true,
        path: "/test/repo/.git/phantom/ruins/test-ruin",
      }),
    );

    // Mock successful command execution
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

    const result = await execInRuin("test-ruin", [
      "npm",
      "run",
      "test",
      "--",
      "--verbose",
    ]);

    strictEqual(result.success, true);
    strictEqual(result.exitCode, 0);

    // Verify spawn was called with correct arguments
    const [cmd, args] = spawnMock.mock.calls[0].arguments as [
      string,
      string[],
      object,
    ];
    strictEqual(cmd, "npm");
    strictEqual(args.length, 4);
    strictEqual(args[0], "run");
    strictEqual(args[1], "test");
    strictEqual(args[2], "--");
    strictEqual(args[3], "--verbose");
  });
});
