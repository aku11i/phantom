import { deepStrictEqual, strictEqual } from "node:assert";
import type { SpawnOptions } from "node:child_process";
import { before, describe, it, mock } from "node:test";

describe("execInWorktree", () => {
  let spawnMock: ReturnType<typeof mock.fn>;
  let execMock: ReturnType<typeof mock.fn>;
  let execInWorktree: typeof import("../core/process/exec.ts").execInWorktree;

  before(async () => {
    spawnMock = mock.fn();
    execMock = mock.fn((cmd: string) => {
      if (cmd === "git rev-parse --show-toplevel") {
        return Promise.resolve({ stdout: "/test/repo\n", stderr: "" });
      }
      return Promise.resolve({ stdout: "", stderr: "" });
    });

    mock.module("node:child_process", {
      namedExports: {
        spawn: spawnMock,
      },
      defaultExport: {
        exec: execMock,
      },
    });

    mock.module("node:util", {
      namedExports: {
        promisify: (fn: unknown) => fn,
      },
    });

    // Mock core modules
    mock.module("../core/process/spawn.ts", {
      namedExports: {
        spawnProcess: mock.fn(
          (config: {
            command: string;
            args?: string[];
            options?: SpawnOptions;
          }) => {
            const mockChild = {
              on: mock.fn(
                (
                  event: string,
                  handler: (
                    arg1?: number | Error | null,
                    arg2?: string | null,
                  ) => void,
                ) => {
                  if (event === "exit") {
                    // Call the handler based on the command
                    if (config.command === "exitcode") {
                      handler(42, null);
                    } else if (config.command === "signal") {
                      handler(null, "SIGTERM");
                    } else if (config.command === "error") {
                      // Don't call exit handler for error case
                    } else {
                      handler(0, null);
                    }
                  } else if (event === "error" && config.command === "error") {
                    handler(new Error("Command not found"));
                  }
                },
              ),
            };
            spawnMock(config.command, config.args, config.options);

            // Return promise based on command
            if (config.command === "error") {
              return Promise.resolve({
                success: false,
                message: "Error executing command: Command not found",
              });
            }
            if (config.command === "exitcode") {
              return Promise.resolve({ success: false, exitCode: 42 });
            }
            if (config.command === "signal") {
              return Promise.resolve({
                success: false,
                message: "Command terminated by signal: SIGTERM",
                exitCode: 143,
              });
            }
            if (!config.command) {
              return Promise.resolve({
                success: false,
                message: "Error executing command: Command not found",
              });
            }
            return Promise.resolve({ success: true, exitCode: 0 });
          },
        ),
      },
    });

    mock.module("../core/worktree/validate.ts", {
      namedExports: {
        validateWorktreeExists: mock.fn((gitRoot: string, name: string) => {
          if (name === "" || name === "nonexistent") {
            return Promise.resolve({
              exists: false,
              message: `Worktree '${name}' does not exist`,
            });
          }
          return Promise.resolve({
            exists: true,
            path: `${gitRoot}/.git/phantom/worktrees/${name}`,
          });
        }),
      },
    });

    ({ execInWorktree } = await import("../core/process/exec.ts"));
  });

  it("should return error when phantom name is not provided", async () => {
    const result = await execInWorktree("/test/repo", "", ["echo", "test"]);
    strictEqual(result.success, false);
    strictEqual(result.message, "Worktree '' does not exist");
  });

  it("should return error when command is not provided", async () => {
    // When command array is empty, spawnProcess will be called with undefined command
    const result = await execInWorktree("/test/repo", "test-worktree", []);
    strictEqual(result.success, false);
    strictEqual(result.message, "Error executing command: Command not found");
  });

  it("should return error when phantom does not exist", async () => {
    spawnMock.mock.resetCalls();

    const result = await execInWorktree("/test/repo", "nonexistent", [
      "echo",
      "test",
    ]);

    strictEqual(result.success, false);
    strictEqual(result.message, "Worktree 'nonexistent' does not exist");
  });

  it("should execute command successfully with exit code 0", async () => {
    spawnMock.mock.resetCalls();

    const result = await execInWorktree("/test/repo", "test-worktree", [
      "echo",
      "hello",
    ]);

    strictEqual(result.success, true);
    strictEqual(result.exitCode, 0);

    // Verify spawn was called with correct arguments
    strictEqual(spawnMock.mock.calls.length, 1);
    const [cmd, args, options] = spawnMock.mock.calls[0].arguments as [
      string,
      string[],
      { cwd: string },
    ];
    strictEqual(cmd, "echo");
    strictEqual(args[0], "hello");
    strictEqual(options.cwd, "/test/repo/.git/phantom/worktrees/test-worktree");
  });

  it("should handle command execution failure with non-zero exit code", async () => {
    spawnMock.mock.resetCalls();

    const result = await execInWorktree("/test/repo", "test-worktree", [
      "exitcode",
    ]);

    strictEqual(result.success, false);
    strictEqual(result.exitCode, 42);
  });

  it("should handle command execution error", async () => {
    spawnMock.mock.resetCalls();

    const result = await execInWorktree("/test/repo", "test-worktree", [
      "error",
    ]);

    strictEqual(result.success, false);
    strictEqual(result.message, "Error executing command: Command not found");
  });

  it("should handle signal termination", async () => {
    spawnMock.mock.resetCalls();

    const result = await execInWorktree("/test/repo", "test-worktree", [
      "signal",
    ]);

    strictEqual(result.success, false);
    strictEqual(result.message, "Command terminated by signal: SIGTERM");
    strictEqual(result.exitCode, 143); // 128 + 15 (SIGTERM)
  });

  it("should parse complex commands with multiple arguments", async () => {
    spawnMock.mock.resetCalls();

    const result = await execInWorktree("/test/repo", "test-worktree", [
      "npm",
      "run",
      "test",
      "--",
      "--verbose",
    ]);

    strictEqual(result.success, true);
    strictEqual(result.exitCode, 0);

    // Verify spawn was called with correct arguments
    const spawnCall = spawnMock.mock.calls.find(
      (call) => call.arguments[0] === "npm",
    );
    if (spawnCall) {
      strictEqual(spawnCall.arguments[0], "npm");
      deepStrictEqual(spawnCall.arguments[1], [
        "run",
        "test",
        "--",
        "--verbose",
      ]);
      strictEqual(
        (spawnCall.arguments[2] as SpawnOptions).cwd,
        "/test/repo/.git/phantom/worktrees/test-worktree",
      );
    }
  });
});
