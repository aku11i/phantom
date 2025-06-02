import { strictEqual } from "node:assert";
import { before, describe, it, mock } from "node:test";

describe("shellInPhantom", () => {
  let spawnMock: ReturnType<typeof mock.fn>;
  let wherePhantomMock: ReturnType<typeof mock.fn>;
  let shellInPhantom: typeof import("./shell.ts").shellInPhantom;
  const originalEnv = process.env;

  before(async () => {
    spawnMock = mock.fn();
    wherePhantomMock = mock.fn();

    mock.module("node:child_process", {
      namedExports: {
        spawn: spawnMock,
      },
    });

    mock.module("../../phantoms/commands/where.ts", {
      namedExports: {
        wherePhantom: wherePhantomMock,
      },
    });

    ({ shellInPhantom } = await import("./shell.ts"));
  });

  it("should return error when phantom name is not provided", async () => {
    const result = await shellInPhantom("");
    strictEqual(result.success, false);
    strictEqual(result.message, "Error: phantom name required");
  });

  it("should return error when phantom does not exist", async () => {
    wherePhantomMock.mock.resetCalls();
    spawnMock.mock.resetCalls();

    wherePhantomMock.mock.mockImplementation(() =>
      Promise.resolve({
        success: false,
        message: "Error: Phantom 'nonexistent' does not exist",
      }),
    );

    const result = await shellInPhantom("nonexistent");

    strictEqual(result.success, false);
    strictEqual(result.message, "Error: Phantom 'nonexistent' does not exist");
  });

  it("should start shell successfully with exit code 0", async () => {
    wherePhantomMock.mock.resetCalls();
    spawnMock.mock.resetCalls();

    // Mock successful phantom location
    wherePhantomMock.mock.mockImplementation(() =>
      Promise.resolve({
        success: true,
        path: "/test/repo/.git/phantom/phantoms/test-phantom",
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

    const result = await shellInPhantom("test-phantom");

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
    strictEqual(options.cwd, "/test/repo/.git/phantom/phantoms/test-phantom");
    strictEqual(options.stdio, "inherit");
    strictEqual(options.env.PHANTOM_NAME, "test-phantom");
    strictEqual(
      options.env.PHANTOM_PATH,
      "/test/repo/.git/phantom/phantoms/test-phantom",
    );
  });

  it("should use /bin/sh when SHELL is not set", async () => {
    wherePhantomMock.mock.resetCalls();
    spawnMock.mock.resetCalls();

    // Temporarily remove SHELL env var
    const originalShell = process.env.SHELL;
    // biome-ignore lint/performance/noDelete: Need to actually delete for test
    delete process.env.SHELL;

    // Mock successful phantom location
    wherePhantomMock.mock.mockImplementation(() =>
      Promise.resolve({
        success: true,
        path: "/test/repo/.git/phantom/phantoms/test-phantom",
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

    await shellInPhantom("test-phantom");

    // Verify /bin/sh was used
    const [shell] = spawnMock.mock.calls[0].arguments as [string, unknown];
    strictEqual(shell, "/bin/sh");

    // Restore SHELL env var
    if (originalShell !== undefined) {
      process.env.SHELL = originalShell;
    }
  });

  it("should handle shell execution failure with non-zero exit code", async () => {
    wherePhantomMock.mock.resetCalls();
    spawnMock.mock.resetCalls();

    // Mock successful phantom location
    wherePhantomMock.mock.mockImplementation(() =>
      Promise.resolve({
        success: true,
        path: "/test/repo/.git/phantom/phantoms/test-phantom",
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

    const result = await shellInPhantom("test-phantom");

    strictEqual(result.success, false);
    strictEqual(result.exitCode, 1);
  });

  it("should handle shell startup error", async () => {
    wherePhantomMock.mock.resetCalls();
    spawnMock.mock.resetCalls();

    // Mock successful phantom location
    wherePhantomMock.mock.mockImplementation(() =>
      Promise.resolve({
        success: true,
        path: "/test/repo/.git/phantom/phantoms/test-phantom",
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

    const result = await shellInPhantom("test-phantom");

    strictEqual(result.success, false);
    strictEqual(result.message, "Error starting shell: Shell not found");
  });

  it("should handle signal termination", async () => {
    wherePhantomMock.mock.resetCalls();
    spawnMock.mock.resetCalls();

    // Mock successful phantom location
    wherePhantomMock.mock.mockImplementation(() =>
      Promise.resolve({
        success: true,
        path: "/test/repo/.git/phantom/phantoms/test-phantom",
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

    const result = await shellInPhantom("test-phantom");

    strictEqual(result.success, false);
    strictEqual(result.message, "Shell terminated by signal: SIGTERM");
    strictEqual(result.exitCode, 143); // 128 + 15 (SIGTERM)
  });
});
