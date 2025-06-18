import { deepStrictEqual, rejects } from "node:assert";
import { describe, it, mock } from "node:test";
import { ConfigNotFoundError } from "@aku11i/phantom-core";
import { err, ok } from "@aku11i/phantom-shared";

const exitWithErrorMock = mock.fn((message, code) => {
  throw new Error(`Exit with code ${code}: ${message}`);
});
const outputLogMock = mock.fn();
const outputErrorMock = mock.fn();
const getGitRootMock = mock.fn();
const createWorktreeMock = mock.fn();
const executePostCreateCommandsMock = mock.fn();
const createContextMock = mock.fn();

mock.module("../errors.ts", {
  namedExports: {
    exitWithError: exitWithErrorMock,
    exitWithSuccess: mock.fn(() => {
      throw new Error("Exit with success");
    }),
    exitCodes: {
      validationError: 3,
      generalError: 1,
      success: 0,
    },
  },
});

mock.module("../output.ts", {
  namedExports: {
    output: { log: outputLogMock, error: outputErrorMock },
  },
});

mock.module("@aku11i/phantom-git", {
  namedExports: {
    getGitRoot: getGitRootMock,
  },
});

mock.module("@aku11i/phantom-core", {
  namedExports: {
    ConfigNotFoundError,
    ConfigParseError: class ConfigParseError extends Error {},
    ConfigValidationError: class ConfigValidationError extends Error {},
    WorktreeAlreadyExistsError: class WorktreeAlreadyExistsError extends Error {},
    createWorktree: createWorktreeMock,
    executePostCreateCommands: executePostCreateCommandsMock,
    createContext: createContextMock,
    execInWorktree: mock.fn(),
    shellInWorktree: mock.fn(),
  },
});

mock.module("@aku11i/phantom-process", {
  namedExports: {
    isInsideTmux: mock.fn(() => false),
    executeTmuxCommand: mock.fn(),
    getPhantomEnv: mock.fn(() => ({})),
  },
});

const { createHandler } = await import("./create.ts");

describe("createHandler postCreate", () => {
  it("should use executePostCreateCommands for command execution", async () => {
    exitWithErrorMock.mock.resetCalls();
    outputLogMock.mock.resetCalls();
    outputErrorMock.mock.resetCalls();
    getGitRootMock.mock.resetCalls();
    createWorktreeMock.mock.resetCalls();
    executePostCreateCommandsMock.mock.resetCalls();
    createContextMock.mock.resetCalls();

    getGitRootMock.mock.mockImplementation(() => Promise.resolve("/repo"));
    createContextMock.mock.mockImplementation((gitRoot) =>
      Promise.resolve({
        gitRoot,
        worktreesDirectory: `${gitRoot}/.git/phantom/worktrees`,
        config: {
          postCreate: {
            commands: ["npm install", "npm test"],
          },
        },
      }),
    );
    createWorktreeMock.mock.mockImplementation(() =>
      Promise.resolve(
        ok({
          message:
            "Created worktree 'feature' at /repo/.git/phantom/worktrees/feature",
          path: "/repo/.git/phantom/worktrees/feature",
        }),
      ),
    );
    executePostCreateCommandsMock.mock.mockImplementation(() =>
      Promise.resolve(ok({ executedCommands: ["npm install", "npm test"] })),
    );

    await rejects(
      async () => await createHandler(["feature"]),
      /Exit with success/,
    );

    deepStrictEqual(executePostCreateCommandsMock.mock.calls.length, 1);
    deepStrictEqual(executePostCreateCommandsMock.mock.calls[0].arguments[0], {
      gitRoot: "/repo",
      worktreesDirectory: "/repo/.git/phantom/worktrees",
      worktreeName: "feature",
      commands: ["npm install", "npm test"],
    });
    deepStrictEqual(
      outputLogMock.mock.calls[1].arguments[0],
      "\nRunning post-create commands...",
    );
    deepStrictEqual(
      outputLogMock.mock.calls[2].arguments[0],
      "Executing: npm install",
    );
    deepStrictEqual(
      outputLogMock.mock.calls[3].arguments[0],
      "Executing: npm test",
    );
  });

  it("should exit with error if executePostCreateCommands fails", async () => {
    exitWithErrorMock.mock.resetCalls();
    getGitRootMock.mock.resetCalls();
    createWorktreeMock.mock.resetCalls();
    executePostCreateCommandsMock.mock.resetCalls();
    createContextMock.mock.resetCalls();

    getGitRootMock.mock.mockImplementation(() => Promise.resolve("/repo"));
    createContextMock.mock.mockImplementation((gitRoot) =>
      Promise.resolve({
        gitRoot,
        worktreesDirectory: `${gitRoot}/.git/phantom/worktrees`,
        config: {
          postCreate: {
            commands: ["invalid-command"],
          },
        },
      }),
    );
    createWorktreeMock.mock.mockImplementation(() =>
      Promise.resolve(
        ok({
          message: "Created worktree 'feature'",
          path: "/repo/.git/phantom/worktrees/feature",
        }),
      ),
    );
    executePostCreateCommandsMock.mock.mockImplementation(() =>
      Promise.resolve(
        err(
          new Error(
            "Post-create command failed with exit code 127: invalid-command",
          ),
        ),
      ),
    );

    await rejects(
      async () => await createHandler(["feature"]),
      /Exit with code 1/,
    );

    deepStrictEqual(exitWithErrorMock.mock.calls[0].arguments, [
      "Post-create command failed with exit code 127: invalid-command",
      1,
    ]);
  });

  it("should not execute postCreate commands if config has no commands", async () => {
    exitWithErrorMock.mock.resetCalls();
    outputLogMock.mock.resetCalls();
    getGitRootMock.mock.resetCalls();
    createWorktreeMock.mock.resetCalls();
    executePostCreateCommandsMock.mock.resetCalls();
    createContextMock.mock.resetCalls();

    getGitRootMock.mock.mockImplementation(() => Promise.resolve("/repo"));
    createContextMock.mock.mockImplementation((gitRoot) =>
      Promise.resolve({
        gitRoot,
        worktreesDirectory: `${gitRoot}/.git/phantom/worktrees`,
        config: {
          postCreate: {
            copyFiles: [".env"],
          },
        },
      }),
    );
    createWorktreeMock.mock.mockImplementation(() =>
      Promise.resolve(
        ok({
          message: "Created worktree 'feature'",
          path: "/repo/.git/phantom/worktrees/feature",
        }),
      ),
    );

    await rejects(
      async () => await createHandler(["feature"]),
      /Exit with success/,
    );

    deepStrictEqual(executePostCreateCommandsMock.mock.calls.length, 0);
    const logMessages = outputLogMock.mock.calls.map(
      (call) => call.arguments[0],
    );
    deepStrictEqual(
      logMessages.includes("\nRunning post-create commands..."),
      false,
    );
  });
});
