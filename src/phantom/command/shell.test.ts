import { strictEqual } from "node:assert";
import { before, describe, it, mock } from "node:test";

describe("shellInGarden", () => {
  let spawnMock: ReturnType<typeof mock.fn>;
  let whereGardenMock: ReturnType<typeof mock.fn>;
  let shellInGarden: typeof import("./shell.ts").shellInGarden;
  const originalEnv = process.env;

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

    ({ shellInGarden } = await import("./shell.ts"));
  });

  it("should return error when garden name is not provided", async () => {
    const result = await shellInGarden("");
    strictEqual(result.success, false);
    strictEqual(result.message, "Error: garden name required");
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

    const result = await shellInGarden("nonexistent");

    strictEqual(result.success, false);
    strictEqual(result.message, "Error: Garden 'nonexistent' does not exist");
  });

  it("should start shell successfully with exit code 0", async () => {
    whereGardenMock.mock.resetCalls();
    spawnMock.mock.resetCalls();

    // Mock successful garden location
    whereGardenMock.mock.mockImplementation(() =>
      Promise.resolve({
        success: true,
        path: "/test/repo/.git/phantom/gardens/test-garden",
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

    const result = await shellInGarden("test-garden");

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
    strictEqual(options.cwd, "/test/repo/.git/phantom/gardens/test-garden");
    strictEqual(options.stdio, "inherit");
    strictEqual(options.env.PHANTOM_GARDEN, "test-garden");
    strictEqual(
      options.env.PHANTOM_GARDEN_PATH,
      "/test/repo/.git/phantom/gardens/test-garden",
    );
  });

  it("should use /bin/sh when SHELL is not set", async () => {
    whereGardenMock.mock.resetCalls();
    spawnMock.mock.resetCalls();

    // Temporarily remove SHELL env var
    const originalShell = process.env.SHELL;
    // biome-ignore lint/performance/noDelete: Need to actually delete for test
    delete process.env.SHELL;

    // Mock successful garden location
    whereGardenMock.mock.mockImplementation(() =>
      Promise.resolve({
        success: true,
        path: "/test/repo/.git/phantom/gardens/test-garden",
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

    await shellInGarden("test-garden");

    // Verify /bin/sh was used
    const [shell] = spawnMock.mock.calls[0].arguments as [string, unknown];
    strictEqual(shell, "/bin/sh");

    // Restore SHELL env var
    if (originalShell !== undefined) {
      process.env.SHELL = originalShell;
    }
  });

  it("should handle shell execution failure with non-zero exit code", async () => {
    whereGardenMock.mock.resetCalls();
    spawnMock.mock.resetCalls();

    // Mock successful garden location
    whereGardenMock.mock.mockImplementation(() =>
      Promise.resolve({
        success: true,
        path: "/test/repo/.git/phantom/gardens/test-garden",
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

    const result = await shellInGarden("test-garden");

    strictEqual(result.success, false);
    strictEqual(result.exitCode, 1);
  });

  it("should handle shell startup error", async () => {
    whereGardenMock.mock.resetCalls();
    spawnMock.mock.resetCalls();

    // Mock successful garden location
    whereGardenMock.mock.mockImplementation(() =>
      Promise.resolve({
        success: true,
        path: "/test/repo/.git/phantom/gardens/test-garden",
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

    const result = await shellInGarden("test-garden");

    strictEqual(result.success, false);
    strictEqual(result.message, "Error starting shell: Shell not found");
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

    const result = await shellInGarden("test-garden");

    strictEqual(result.success, false);
    strictEqual(result.message, "Shell terminated by signal: SIGTERM");
    strictEqual(result.exitCode, 143); // 128 + 15 (SIGTERM)
  });
});
