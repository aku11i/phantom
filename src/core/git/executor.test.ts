import { deepStrictEqual, strictEqual } from "node:assert";
import { describe, it, mock } from "node:test";

describe("executeGitCommand", () => {
  it("should execute git command successfully", async () => {
    const execFileMock = mock.fn(
      (_cmd: string, _args: string[], _options: Record<string, unknown>) =>
        Promise.resolve({
          stdout: "feature-branch\n",
          stderr: "",
        }),
    );

    mock.module("node:child_process", {
      namedExports: {
        execFile: (
          cmd: string,
          args: string[],
          options: Record<string, unknown>,
          callback: (
            error: Error | null,
            result?: { stdout: string; stderr: string },
          ) => void,
        ) => {
          const result = execFileMock(cmd, args, options);
          if (callback) {
            result.then(
              (res: { stdout: string; stderr: string }) => callback(null, res),
              (err: Error) => callback(err),
            );
          }
          return {};
        },
      },
    });

    mock.module("node:util", {
      namedExports: {
        promisify: () => execFileMock,
      },
    });

    const { executeGitCommand } = await import("./executor.ts");

    const result = await executeGitCommand(["branch", "--show-current"]);

    strictEqual(result.stdout, "feature-branch");
    strictEqual(result.stderr, "");

    strictEqual(execFileMock.mock.calls.length, 1);
    deepStrictEqual(execFileMock.mock.calls[0].arguments, [
      "git",
      ["branch", "--show-current"],
      {
        cwd: undefined,
        env: process.env,
        encoding: "utf8",
      },
    ]);
  });

  it("should execute git command with custom cwd and env", async () => {
    const customEnv = { PATH: "/usr/bin", GIT_AUTHOR_NAME: "Test" };
    const execFileMock = mock.fn(
      (_cmd: string, _args: string[], _options: Record<string, unknown>) =>
        Promise.resolve({
          stdout: "commit message",
          stderr: "",
        }),
    );

    mock.module("node:child_process", {
      namedExports: {
        execFile: (
          cmd: string,
          args: string[],
          options: Record<string, unknown>,
          callback: (
            error: Error | null,
            result?: { stdout: string; stderr: string },
          ) => void,
        ) => {
          const result = execFileMock(cmd, args, options);
          if (callback) {
            result.then(
              (res: { stdout: string; stderr: string }) => callback(null, res),
              (err: Error) => callback(err),
            );
          }
          return {};
        },
      },
    });

    mock.module("node:util", {
      namedExports: {
        promisify: () => execFileMock,
      },
    });

    const { executeGitCommand } = await import("./executor.ts");

    const result = await executeGitCommand(["log", "-1", "--pretty=%B"], {
      cwd: "/test/repo",
      env: customEnv,
    });

    strictEqual(result.stdout, "commit message");

    strictEqual(execFileMock.mock.calls.length, 1);
    deepStrictEqual(execFileMock.mock.calls[0].arguments, [
      "git",
      ["log", "-1", "--pretty=%B"],
      {
        cwd: "/test/repo",
        env: customEnv,
        encoding: "utf8",
      },
    ]);
  });

  it("should handle git command with stderr but successful exit", async () => {
    const execFileMock = mock.fn(
      (_cmd: string, _args: string[], _options: Record<string, unknown>) =>
        Promise.reject({
          stdout: "diff output",
          stderr: "",
          code: 1,
        }),
    );

    mock.module("node:child_process", {
      namedExports: {
        execFile: (
          cmd: string,
          args: string[],
          options: Record<string, unknown>,
          callback: (
            error: Error | null,
            result?: { stdout: string; stderr: string },
          ) => void,
        ) => {
          const result = execFileMock(cmd, args, options);
          if (callback) {
            result.then(
              (res: { stdout: string; stderr: string }) => callback(null, res),
              (err: Error) => callback(err),
            );
          }
          return {};
        },
      },
    });

    mock.module("node:util", {
      namedExports: {
        promisify: () => execFileMock,
      },
    });

    const { executeGitCommand } = await import("./executor.ts");

    const result = await executeGitCommand(["diff"]);

    strictEqual(result.stdout, "diff output");
    strictEqual(result.stderr, "");
  });

  it("should throw error when git command has stderr content", async () => {
    const execFileMock = mock.fn(
      (_cmd: string, _args: string[], _options: Record<string, unknown>) =>
        Promise.reject({
          stdout: "",
          stderr: "fatal: not a git repository",
          code: 128,
        }),
    );

    mock.module("node:child_process", {
      namedExports: {
        execFile: (
          cmd: string,
          args: string[],
          options: Record<string, unknown>,
          callback: (
            error: Error | null,
            result?: { stdout: string; stderr: string },
          ) => void,
        ) => {
          const result = execFileMock(cmd, args, options);
          if (callback) {
            result.then(
              (res: { stdout: string; stderr: string }) => callback(null, res),
              (err: Error) => callback(err),
            );
          }
          return {};
        },
      },
    });

    mock.module("node:util", {
      namedExports: {
        promisify: () => execFileMock,
      },
    });

    const { executeGitCommand } = await import("./executor.ts");

    try {
      await executeGitCommand(["status"]);
      throw new Error("Expected executeGitCommand to throw");
    } catch (error) {
      strictEqual((error as Error).message, "fatal: not a git repository");
    }
  });

  it("should rethrow non-exec errors", async () => {
    const execFileMock = mock.fn(
      (_cmd: string, _args: string[], _options: Record<string, unknown>) =>
        Promise.reject(new Error("Network error")),
    );

    mock.module("node:child_process", {
      namedExports: {
        execFile: (
          cmd: string,
          args: string[],
          options: Record<string, unknown>,
          callback: (
            error: Error | null,
            result?: { stdout: string; stderr: string },
          ) => void,
        ) => {
          const result = execFileMock(cmd, args, options);
          if (callback) {
            result.then(
              (res: { stdout: string; stderr: string }) => callback(null, res),
              (err: Error) => callback(err),
            );
          }
          return {};
        },
      },
    });

    mock.module("node:util", {
      namedExports: {
        promisify: () => execFileMock,
      },
    });

    const { executeGitCommand } = await import("./executor.ts");

    try {
      await executeGitCommand(["fetch"]);
      throw new Error("Expected executeGitCommand to throw");
    } catch (error) {
      strictEqual((error as Error).message, "Network error");
    }
  });

  it("should trim stdout and stderr output", async () => {
    const execFileMock = mock.fn(
      (_cmd: string, _args: string[], _options: Record<string, unknown>) =>
        Promise.resolve({
          stdout: "  output with whitespace  \n",
          stderr: "  warning  \n",
        }),
    );

    mock.module("node:child_process", {
      namedExports: {
        execFile: (
          cmd: string,
          args: string[],
          options: Record<string, unknown>,
          callback: (
            error: Error | null,
            result?: { stdout: string; stderr: string },
          ) => void,
        ) => {
          const result = execFileMock(cmd, args, options);
          if (callback) {
            result.then(
              (res: { stdout: string; stderr: string }) => callback(null, res),
              (err: Error) => callback(err),
            );
          }
          return {};
        },
      },
    });

    mock.module("node:util", {
      namedExports: {
        promisify: () => execFileMock,
      },
    });

    const { executeGitCommand } = await import("./executor.ts");

    const result = await executeGitCommand(["status", "--short"]);

    strictEqual(result.stdout, "output with whitespace");
    strictEqual(result.stderr, "warning");
  });
});

describe("executeGitCommandInDirectory", () => {
  it("should execute git command in specific directory", async () => {
    const execFileMock = mock.fn(
      (_cmd: string, _args: string[], _options: Record<string, unknown>) =>
        Promise.resolve({
          stdout: "On branch main",
          stderr: "",
        }),
    );

    mock.module("node:child_process", {
      namedExports: {
        execFile: (
          cmd: string,
          args: string[],
          options: Record<string, unknown>,
          callback: (
            error: Error | null,
            result?: { stdout: string; stderr: string },
          ) => void,
        ) => {
          const result = execFileMock(cmd, args, options);
          if (callback) {
            result.then(
              (res: { stdout: string; stderr: string }) => callback(null, res),
              (err: Error) => callback(err),
            );
          }
          return {};
        },
      },
    });

    mock.module("node:util", {
      namedExports: {
        promisify: () => execFileMock,
      },
    });

    const { executeGitCommandInDirectory } = await import("./executor.ts");

    const result = await executeGitCommandInDirectory("/test/repo", ["status"]);

    strictEqual(result.stdout, "On branch main");

    strictEqual(execFileMock.mock.calls.length, 1);
    deepStrictEqual(execFileMock.mock.calls[0].arguments, [
      "git",
      ["-C", "/test/repo", "status"],
      {
        cwd: undefined,
        env: process.env,
        encoding: "utf8",
      },
    ]);
  });

  it("should handle commands with complex arguments", async () => {
    const execFileMock = mock.fn(
      (_cmd: string, _args: string[], _options: Record<string, unknown>) =>
        Promise.resolve({
          stdout: "commit hash",
          stderr: "",
        }),
    );

    mock.module("node:child_process", {
      namedExports: {
        execFile: (
          cmd: string,
          args: string[],
          options: Record<string, unknown>,
          callback: (
            error: Error | null,
            result?: { stdout: string; stderr: string },
          ) => void,
        ) => {
          const result = execFileMock(cmd, args, options);
          if (callback) {
            result.then(
              (res: { stdout: string; stderr: string }) => callback(null, res),
              (err: Error) => callback(err),
            );
          }
          return {};
        },
      },
    });

    mock.module("node:util", {
      namedExports: {
        promisify: () => execFileMock,
      },
    });

    const { executeGitCommandInDirectory } = await import("./executor.ts");

    await executeGitCommandInDirectory("/path/with spaces", [
      "log",
      "--pretty=format:%H",
      "-n",
      "1",
    ]);

    strictEqual(execFileMock.mock.calls.length, 1);
    deepStrictEqual(execFileMock.mock.calls[0].arguments, [
      "git",
      ["-C", "/path/with spaces", "log", "--pretty=format:%H", "-n", "1"],
      {
        cwd: undefined,
        env: process.env,
        encoding: "utf8",
      },
    ]);
  });
});
