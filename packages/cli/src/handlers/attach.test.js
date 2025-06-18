import { deepStrictEqual, rejects } from "node:assert";
import { describe, it, mock } from "node:test";
import {
  BranchNotFoundError,
  ConfigNotFoundError,
  WorktreeAlreadyExistsError,
} from "@aku11i/phantom-core";
import { err, ok } from "@aku11i/phantom-shared";

const exitWithErrorMock = mock.fn((message, code) => {
  throw new Error(`Exit with code ${code}: ${message}`);
});
const outputLogMock = mock.fn();
const outputErrorMock = mock.fn();
const getGitRootMock = mock.fn();
const attachWorktreeCoreMock = mock.fn();
const shellInWorktreeMock = mock.fn();
const execInWorktreeMock = mock.fn();
const createContextMock = mock.fn();

mock.module("../errors.ts", {
  namedExports: {
    exitWithError: exitWithErrorMock,
    exitCodes: {
      validationError: 3,
      notFound: 2,
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
    attachWorktreeCore: attachWorktreeCoreMock,
    BranchNotFoundError,
    WorktreeAlreadyExistsError,
    shellInWorktree: shellInWorktreeMock,
    execInWorktree: execInWorktreeMock,
    createContext: createContextMock,
    getWorktreesDirectory: mock.fn((gitRoot, worktreesDirectory) => {
      return worktreesDirectory || `${gitRoot}/.git/phantom/worktrees`;
    }),
  },
});

const { attachHandler } = await import("./attach.ts");

describe("attachHandler", () => {
  it("should attach to existing branch successfully", async () => {
    exitWithErrorMock.mock.resetCalls();
    outputLogMock.mock.resetCalls();
    createContextMock.mock.resetCalls();
    attachWorktreeCoreMock.mock.resetCalls();

    getGitRootMock.mock.mockImplementation(() => Promise.resolve("/repo"));
    createContextMock.mock.mockImplementation((gitRoot) =>
      Promise.resolve({
        gitRoot,
        worktreesDirectory: `${gitRoot}/.git/phantom/worktrees`,
        config: null,
      }),
    );
    attachWorktreeCoreMock.mock.mockImplementation(() =>
      Promise.resolve(ok("/repo/.git/phantom/worktrees/feature")),
    );

    await attachHandler(["feature"]);

    deepStrictEqual(exitWithErrorMock.mock.calls.length, 0);
    deepStrictEqual(
      outputLogMock.mock.calls[0].arguments[0],
      "Attached phantom: feature",
    );
    deepStrictEqual(attachWorktreeCoreMock.mock.calls[0].arguments, [
      "/repo",
      "/repo/.git/phantom/worktrees",
      "feature",
      null, // config
    ]);
  });

  it("should exit with error when no branch name provided", async () => {
    exitWithErrorMock.mock.resetCalls();
    createContextMock.mock.resetCalls();

    await rejects(async () => await attachHandler([]), /Exit with code 3/);

    deepStrictEqual(exitWithErrorMock.mock.calls[0].arguments, [
      "Missing required argument: branch name",
      3,
    ]);
    deepStrictEqual(createContextMock.mock.calls.length, 0);
  });

  it("should exit with error when both --shell and --exec are provided", async () => {
    exitWithErrorMock.mock.resetCalls();
    getGitRootMock.mock.resetCalls();
    attachWorktreeCoreMock.mock.resetCalls();
    createContextMock.mock.resetCalls();

    await rejects(
      async () => await attachHandler(["feature", "--shell", "--exec", "ls"]),
      /Exit with code 3/,
    );

    deepStrictEqual(exitWithErrorMock.mock.calls[0].arguments, [
      "Cannot use both --shell and --exec options",
      3,
    ]);
    deepStrictEqual(getGitRootMock.mock.calls.length, 0);
    deepStrictEqual(attachWorktreeCoreMock.mock.calls.length, 0);
    deepStrictEqual(createContextMock.mock.calls.length, 0);
  });

  it("should handle BranchNotFoundError", async () => {
    exitWithErrorMock.mock.resetCalls();
    createContextMock.mock.resetCalls();
    getGitRootMock.mock.mockImplementation(() => Promise.resolve("/repo"));
    createContextMock.mock.mockImplementation((gitRoot) =>
      Promise.resolve({
        gitRoot,
        worktreesDirectory: `${gitRoot}/.git/phantom/worktrees`,
        config: null,
      }),
    );
    attachWorktreeCoreMock.mock.mockImplementation(() =>
      Promise.resolve(err(new BranchNotFoundError("nonexistent"))),
    );

    await rejects(
      async () => await attachHandler(["nonexistent"]),
      /Exit with code 2/,
    );

    deepStrictEqual(exitWithErrorMock.mock.calls[0].arguments, [
      "Branch 'nonexistent' not found",
      2,
    ]);
  });

  it("should spawn shell when --shell flag is provided", async () => {
    exitWithErrorMock.mock.resetCalls();
    outputLogMock.mock.resetCalls();
    createContextMock.mock.resetCalls();
    shellInWorktreeMock.mock.resetCalls();
    shellInWorktreeMock.mock.mockImplementation(() =>
      Promise.resolve(ok({ exitCode: 0 })),
    );
    getGitRootMock.mock.mockImplementation(() => Promise.resolve("/repo"));
    createContextMock.mock.mockImplementation((gitRoot) =>
      Promise.resolve({
        gitRoot,
        worktreesDirectory: `${gitRoot}/.git/phantom/worktrees`,
        config: null,
      }),
    );
    attachWorktreeCoreMock.mock.mockImplementation(() =>
      Promise.resolve(ok("/repo/.git/phantom/worktrees/feature")),
    );

    await attachHandler(["feature", "--shell"]);

    deepStrictEqual(shellInWorktreeMock.mock.calls[0].arguments, [
      "/repo",
      "/repo/.git/phantom/worktrees",
      "feature",
    ]);
  });

  it("should execute command when --exec flag is provided", async () => {
    exitWithErrorMock.mock.resetCalls();
    outputLogMock.mock.resetCalls();
    createContextMock.mock.resetCalls();
    execInWorktreeMock.mock.resetCalls();
    execInWorktreeMock.mock.mockImplementation(() =>
      Promise.resolve(ok({ exitCode: 0 })),
    );
    getGitRootMock.mock.mockImplementation(() => Promise.resolve("/repo"));
    createContextMock.mock.mockImplementation((gitRoot) =>
      Promise.resolve({
        gitRoot,
        worktreesDirectory: `${gitRoot}/.git/phantom/worktrees`,
        config: null,
      }),
    );
    attachWorktreeCoreMock.mock.mockImplementation(() =>
      Promise.resolve(ok("/repo/.git/phantom/worktrees/feature")),
    );

    process.env.SHELL = "/bin/bash";
    await attachHandler(["feature", "--exec", "echo hello"]);

    deepStrictEqual(execInWorktreeMock.mock.calls[0].arguments[0], "/repo");
    deepStrictEqual(
      execInWorktreeMock.mock.calls[0].arguments[1],
      "/repo/.git/phantom/worktrees",
    );
    deepStrictEqual(execInWorktreeMock.mock.calls[0].arguments[2], "feature");
    const execArgs = execInWorktreeMock.mock.calls[0].arguments[3];
    deepStrictEqual(execArgs[0], "/bin/bash");
    deepStrictEqual(execArgs[1], "-c");
    deepStrictEqual(execArgs[2], "echo hello");
  });

  it("should pass postCreate config to attachWorktreeCore", async () => {
    exitWithErrorMock.mock.resetCalls();
    outputLogMock.mock.resetCalls();
    outputErrorMock.mock.resetCalls();
    createContextMock.mock.resetCalls();
    attachWorktreeCoreMock.mock.resetCalls();

    getGitRootMock.mock.mockImplementation(() => Promise.resolve("/repo"));
    createContextMock.mock.mockImplementation((gitRoot) =>
      Promise.resolve({
        gitRoot,
        worktreesDirectory: `${gitRoot}/.git/phantom/worktrees`,
        config: {
          postCreate: {
            copyFiles: [".env", "config.json"],
            commands: ["npm install", "npm run build"],
          },
        },
      }),
    );
    attachWorktreeCoreMock.mock.mockImplementation(() =>
      Promise.resolve(ok("/repo/.git/phantom/worktrees/feature")),
    );

    await attachHandler(["feature"]);

    // Verify that attachWorktreeCore was called with full postCreate config
    deepStrictEqual(attachWorktreeCoreMock.mock.calls.length, 1);
    const [gitRoot, worktreeDirectory, name, config] =
      attachWorktreeCoreMock.mock.calls[0].arguments;
    deepStrictEqual(gitRoot, "/repo");
    deepStrictEqual(worktreeDirectory, "/repo/.git/phantom/worktrees");
    deepStrictEqual(name, "feature");
    deepStrictEqual(config, {
      postCreate: {
        copyFiles: [".env", "config.json"],
        commands: ["npm install", "npm run build"],
      },
    });
  });

  it("should handle config not found gracefully", async () => {
    exitWithErrorMock.mock.resetCalls();
    outputLogMock.mock.resetCalls();
    outputErrorMock.mock.resetCalls();
    createContextMock.mock.resetCalls();
    attachWorktreeCoreMock.mock.resetCalls();

    getGitRootMock.mock.mockImplementation(() => Promise.resolve("/repo"));
    createContextMock.mock.mockImplementation((gitRoot) =>
      Promise.resolve({
        gitRoot,
        worktreesDirectory: `${gitRoot}/.git/phantom/worktrees`,
        config: null,
      }),
    );
    attachWorktreeCoreMock.mock.mockImplementation(() =>
      Promise.resolve(ok("/repo/.git/phantom/worktrees/feature")),
    );

    await attachHandler(["feature"]);

    // Verify that attachWorktreeCore was called with null config
    deepStrictEqual(attachWorktreeCoreMock.mock.calls.length, 1);
    const [gitRoot, worktreeDirectory, name, config] =
      attachWorktreeCoreMock.mock.calls[0].arguments;
    deepStrictEqual(config, null);
    deepStrictEqual(outputErrorMock.mock.calls.length, 0);
  });

  it("should pass config with postCreate to attachWorktreeCore", async () => {
    exitWithErrorMock.mock.resetCalls();
    outputLogMock.mock.resetCalls();
    outputErrorMock.mock.resetCalls();
    createContextMock.mock.resetCalls();
    attachWorktreeCoreMock.mock.resetCalls();

    getGitRootMock.mock.mockImplementation(() => Promise.resolve("/repo"));
    createContextMock.mock.mockImplementation((gitRoot) =>
      Promise.resolve({
        gitRoot,
        worktreesDirectory: `${gitRoot}/.git/phantom/worktrees`,
        config: {
          postCreate: {
            copyFiles: [".env"],
            commands: ["echo test"],
          },
        },
      }),
    );
    attachWorktreeCoreMock.mock.mockImplementation(() =>
      Promise.resolve(ok("/repo/.git/phantom/worktrees/feature")),
    );

    await attachHandler(["feature"]);

    // Verify that attachWorktreeCore was called with the config
    deepStrictEqual(attachWorktreeCoreMock.mock.calls.length, 1);
    const [gitRoot, worktreeDirectory, name, config] =
      attachWorktreeCoreMock.mock.calls[0].arguments;
    deepStrictEqual(config, {
      postCreate: {
        copyFiles: [".env"],
        commands: ["echo test"],
      },
    });
  });

  it("should exit with error if attachWorktreeCore fails due to postCreate", async () => {
    exitWithErrorMock.mock.resetCalls();
    outputLogMock.mock.resetCalls();
    createContextMock.mock.resetCalls();
    attachWorktreeCoreMock.mock.resetCalls();

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
    // attachWorktreeCore now handles postCreate internally and returns error
    attachWorktreeCoreMock.mock.mockImplementation(() =>
      Promise.resolve(err(new Error("Command failed: invalid-command"))),
    );

    await rejects(
      async () => await attachHandler(["feature"]),
      /Exit with code 1/,
    );

    deepStrictEqual(exitWithErrorMock.mock.calls[0].arguments, [
      "Command failed: invalid-command",
      1,
    ]);

    // Verify that attachWorktreeCore was called with config
    deepStrictEqual(attachWorktreeCoreMock.mock.calls.length, 1);
    const [gitRoot, worktreeDirectory, name, config] =
      attachWorktreeCoreMock.mock.calls[0].arguments;
    deepStrictEqual(config, {
      postCreate: {
        commands: ["invalid-command"],
      },
    });
  });
});
