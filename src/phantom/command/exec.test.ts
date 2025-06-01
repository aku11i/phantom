import { strictEqual } from "node:assert";
import { before, describe, it, mock } from "node:test";

describe("execInGarden", () => {
  let spawnMock: ReturnType<typeof mock.fn>;
  let whereGardenMock: ReturnType<typeof mock.fn>;
  let execInGarden: typeof import("./exec.ts").execInGarden;

  before(async () => {
    spawnMock = mock.fn();
    whereGardenMock = mock.fn();

    mock.module("node:child_process", {
      namedExports: {
        spawn: spawnMock,
      },
    });

    mock.module("../../gardens/commands/where.ts", {
      namedExports: {
        whereGarden: whereGardenMock,
      },
    });

    ({ execInGarden } = await import("./exec.ts"));
  });

  it("should return error when garden name is not provided", async () => {
    const result = await execInGarden("", ["echo", "test"]);
    strictEqual(result.success, false);
    strictEqual(result.message, "Error: garden name required");
  });

  it("should return error when command is not provided", async () => {
    const result = await execInGarden("test-garden", []);
    strictEqual(result.success, false);
    strictEqual(result.message, "Error: command required");
  });

  it("should return error when garden does not exist", async () => {
    whereGardenMock.mock.resetCalls();
    spawnMock.mock.resetCalls();

    whereGardenMock.mock.mockImplementation(() =>
      Promise.resolve({
        success: false,
        message: "Error: Garden 'nonexistent' does not exist",
      }),
    );

    const result = await execInGarden("nonexistent", ["echo", "test"]);

    strictEqual(result.success, false);
    strictEqual(result.message, "Error: Garden 'nonexistent' does not exist");
  });

  it("should execute command successfully with exit code 0", async () => {
    whereGardenMock.mock.resetCalls();
    spawnMock.mock.resetCalls();

    // Mock successful garden location
    whereGardenMock.mock.mockImplementation(() =>
      Promise.resolve({
        success: true,
        path: "/test/repo/.git/phantom/gardens/test-garden",
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

    const result = await execInGarden("test-garden", ["echo", "hello"]);

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
    strictEqual(options.cwd, "/test/repo/.git/phantom/gardens/test-garden");
    strictEqual(options.stdio, "inherit");
  });

  it("should handle command execution failure with non-zero exit code", async () => {
    whereGardenMock.mock.resetCalls();
    spawnMock.mock.resetCalls();

    // Mock successful garden location
    whereGardenMock.mock.mockImplementation(() =>
      Promise.resolve({
        success: true,
        path: "/test/repo/.git/phantom/gardens/test-garden",
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

    const result = await execInGarden("test-garden", ["false"]);

    strictEqual(result.success, false);
    strictEqual(result.exitCode, 1);
  });

  it("should handle command execution error", async () => {
    whereGardenMock.mock.resetCalls();
    spawnMock.mock.resetCalls();

    // Mock successful garden location
    whereGardenMock.mock.mockImplementation(() =>
      Promise.resolve({
        success: true,
        path: "/test/repo/.git/phantom/gardens/test-garden",
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

    const result = await execInGarden("test-garden", ["nonexistent-command"]);

    strictEqual(result.success, false);
    strictEqual(result.message, "Error executing command: Command not found");
  });

  it("should handle signal termination", async () => {
    whereGardenMock.mock.resetCalls();
    spawnMock.mock.resetCalls();

    // Mock successful garden location
    whereGardenMock.mock.mockImplementation(() =>
      Promise.resolve({
        success: true,
        path: "/test/repo/.git/phantom/gardens/test-garden",
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

    const result = await execInGarden("test-garden", ["long-running-command"]);

    strictEqual(result.success, false);
    strictEqual(result.message, "Command terminated by signal: SIGTERM");
    strictEqual(result.exitCode, 143); // 128 + 15 (SIGTERM)
  });

  it("should parse complex commands with multiple arguments", async () => {
    whereGardenMock.mock.resetCalls();
    spawnMock.mock.resetCalls();

    // Mock successful garden location
    whereGardenMock.mock.mockImplementation(() =>
      Promise.resolve({
        success: true,
        path: "/test/repo/.git/phantom/gardens/test-garden",
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

    const result = await execInGarden("test-garden", [
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
