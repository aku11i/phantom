import { deepStrictEqual, strictEqual } from "node:assert";
import { spawn } from "node:child_process";
import { beforeEach, describe, it, mock } from "node:test";
import { err, ok } from "../types/result.ts";
import { ProcessExecutionError } from "./errors.ts";

const spawnProcessMock = mock.fn();
const spawnMock = mock.fn();

mock.module("./spawn.ts", {
  namedExports: {
    spawnProcess: spawnProcessMock,
  },
});

mock.module("node:child_process", {
  namedExports: {
    spawn: spawnMock,
  },
});

const { checkFzfAvailable, selectWorktreeWithFzf } = await import("./fzf.ts");

describe("fzf", () => {
  describe("checkFzfAvailable", () => {
    it("should return true when fzf is available", async () => {
      spawnProcessMock.mock.mockImplementation(() =>
        Promise.resolve(ok({ exitCode: 0 })),
      );

      const result = await checkFzfAvailable();

      strictEqual(result, true);
      strictEqual(spawnProcessMock.mock.calls.length, 1);
      deepStrictEqual(spawnProcessMock.mock.calls[0].arguments[0], {
        command: "which",
        args: ["fzf"],
        options: {
          stdio: ["ignore", "ignore", "ignore"],
        },
      });
    });

    it("should return false when fzf is not available", async () => {
      spawnProcessMock.mock.mockImplementation(() =>
        Promise.resolve(err(new ProcessExecutionError("which", 1))),
      );

      const result = await checkFzfAvailable();

      strictEqual(result, false);
    });
  });

  describe("selectWorktreeWithFzf", () => {
    const mockWorktrees = [
      {
        name: "feature-1",
        path: "/path/to/feature-1",
        branch: "feature/branch-1",
        isClean: true,
      },
      {
        name: "feature-2",
        path: "/path/to/feature-2",
        branch: "feature/branch-2",
        isClean: false,
      },
    ];

    let mockProcess;

    beforeEach(() => {
      spawnMock.mock.resetCalls();
      mockProcess = {
        stdin: {
          write: mock.fn(),
          end: mock.fn(),
        },
        stdout: {
          on: mock.fn(),
        },
        on: mock.fn(),
      };

      spawnMock.mock.mockImplementation(() => mockProcess);
    });

    it("should return selected worktree when user selects one", async () => {
      mockProcess.stdout.on.mock.mockImplementation((event, callback) => {
        if (event === "data") {
          callback(Buffer.from("feature-1     (feature/branch-1)\n"));
        }
      });

      mockProcess.on.mock.mockImplementation((event, callback) => {
        if (event === "exit") {
          callback(0);
        }
      });

      const result = await selectWorktreeWithFzf(mockWorktrees);

      deepStrictEqual(result, {
        ok: true,
        value: {
          selected: [mockWorktrees[0]],
        },
      });
    });

    it("should return multiple selected worktrees with multiSelect", async () => {
      mockProcess.stdout.on.mock.mockImplementation((event, callback) => {
        if (event === "data") {
          callback(
            Buffer.from(
              "feature-1     (feature/branch-1)\nfeature-2     (feature/branch-2) [dirty]\n",
            ),
          );
        }
      });

      mockProcess.on.mock.mockImplementation((event, callback) => {
        if (event === "exit") {
          callback(0);
        }
      });

      const result = await selectWorktreeWithFzf(mockWorktrees, {
        multiSelect: true,
      });

      deepStrictEqual(result, {
        ok: true,
        value: {
          selected: mockWorktrees,
        },
      });

      const spawnCall = spawnMock.mock.calls[spawnMock.mock.calls.length - 1];
      strictEqual(spawnCall.arguments[0], "fzf");
      strictEqual(spawnCall.arguments[1].includes("--multi"), true);
    });

    it("should return empty array when no worktrees provided", async () => {
      const result = await selectWorktreeWithFzf([]);

      deepStrictEqual(result, {
        ok: true,
        value: {
          selected: [],
        },
      });
      const currentCallCount = spawnMock.mock.calls.length;
      const originalCallCount = spawnMock.mock.calls.filter(
        (call) => call.arguments[0] === "fzf",
      ).length;
      strictEqual(originalCallCount, 0);
    });

    it("should return empty array when user cancels (exit code 130)", async () => {
      mockProcess.on.mock.mockImplementation((event, callback) => {
        if (event === "exit") {
          callback(130);
        }
      });

      const result = await selectWorktreeWithFzf(mockWorktrees);

      deepStrictEqual(result, {
        ok: true,
        value: {
          selected: [],
        },
      });
    });

    it("should return error for other fzf failures", async () => {
      mockProcess.on.mock.mockImplementation((event, callback) => {
        if (event === "exit") {
          callback(1);
        }
      });

      const result = await selectWorktreeWithFzf(mockWorktrees);

      strictEqual(result.ok, false);
      strictEqual(result.error.exitCode, 1);
    });

    it("should pass custom prompt to fzf", async () => {
      mockProcess.on.mock.mockImplementation((event, callback) => {
        if (event === "exit") {
          callback(0);
        }
      });

      await selectWorktreeWithFzf(mockWorktrees, { prompt: "Custom prompt: " });

      const spawnCall = spawnMock.mock.calls[spawnMock.mock.calls.length - 1];
      strictEqual(spawnCall.arguments[0], "fzf");
      const args = spawnCall.arguments[1];
      const promptIndex = args.indexOf("--prompt");
      strictEqual(args[promptIndex + 1], "Custom prompt: ");
    });

    it("should pass multi flag when multiSelect is true", async () => {
      mockProcess.on.mock.mockImplementation((event, callback) => {
        if (event === "exit") {
          callback(0);
        }
      });

      await selectWorktreeWithFzf(mockWorktrees, { multiSelect: true });

      const spawnCall = spawnMock.mock.calls[spawnMock.mock.calls.length - 1];
      strictEqual(spawnCall.arguments[0], "fzf");
      strictEqual(spawnCall.arguments[1].includes("--multi"), true);
    });
  });
});
