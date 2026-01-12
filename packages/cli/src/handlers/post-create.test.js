import { deepStrictEqual, rejects } from "node:assert";
import { describe, it, mock } from "node:test";
import { err, ok } from "@aku11i/phantom-shared";

const exitWithErrorMock = mock.fn((message, code) => {
  throw new Error(`Exit with code ${code}: ${message}`);
});
const exitWithSuccessMock = mock.fn(() => {
  throw new Error("Exit with success");
});
const outputLogMock = mock.fn();
const outputWarnMock = mock.fn();
const getGitRootMock = mock.fn();
const getCurrentWorktreeMock = mock.fn();
const createContextMock = mock.fn();
const validateWorktreeExistsMock = mock.fn();
const runPostCreateMock = mock.fn();
const selectWorktreeWithFzfMock = mock.fn();

class WorktreeNotFoundError extends Error {}

mock.module("../errors.ts", {
  namedExports: {
    exitWithError: exitWithErrorMock,
    exitWithSuccess: exitWithSuccessMock,
    exitCodes: {
      validationError: 3,
      generalError: 1,
      notFound: 2,
      success: 0,
    },
  },
});

mock.module("../output.ts", {
  namedExports: {
    output: { log: outputLogMock, warn: outputWarnMock },
  },
});

mock.module("@aku11i/phantom-git", {
  namedExports: {
    getGitRoot: getGitRootMock,
    getCurrentWorktree: getCurrentWorktreeMock,
  },
});

mock.module("@aku11i/phantom-core", {
  namedExports: {
    createContext: createContextMock,
    runPostCreate: runPostCreateMock,
    selectWorktreeWithFzf: selectWorktreeWithFzfMock,
    validateWorktreeExists: validateWorktreeExistsMock,
    WorktreeNotFoundError,
  },
});

const { postCreateHandler } = await import("./post-create.ts");

describe("postCreateHandler", () => {
  it("runs post-create actions for a named worktree", async () => {
    exitWithErrorMock.mock.resetCalls();
    exitWithSuccessMock.mock.resetCalls();
    outputLogMock.mock.resetCalls();
    outputWarnMock.mock.resetCalls();
    getGitRootMock.mock.resetCalls();
    createContextMock.mock.resetCalls();
    validateWorktreeExistsMock.mock.resetCalls();
    runPostCreateMock.mock.resetCalls();

    getGitRootMock.mock.mockImplementation(() => Promise.resolve("/repo"));
    createContextMock.mock.mockImplementation(() =>
      Promise.resolve({
        gitRoot: "/repo",
        worktreesDirectory: "/repo/.git/phantom/worktrees",
        config: {
          postCreate: {
            copyFiles: [".env"],
            commands: ["pnpm install"],
          },
        },
      }),
    );
    validateWorktreeExistsMock.mock.mockImplementation(() =>
      Promise.resolve(ok({ path: "/repo/.git/phantom/worktrees/feature" })),
    );
    runPostCreateMock.mock.mockImplementation(() =>
      Promise.resolve(ok({ copyError: undefined, executedCommands: [] })),
    );

    await rejects(
      async () => await postCreateHandler(["feature"]),
      /Exit with success/,
    );

    deepStrictEqual(runPostCreateMock.mock.calls.length, 1);
    deepStrictEqual(runPostCreateMock.mock.calls[0].arguments[0], {
      gitRoot: "/repo",
      worktreesDirectory: "/repo/.git/phantom/worktrees",
      worktreeName: "feature",
      copyFiles: [".env"],
      commands: ["pnpm install"],
    });
  });

  it("uses the current worktree when --current is set", async () => {
    exitWithErrorMock.mock.resetCalls();
    exitWithSuccessMock.mock.resetCalls();
    getGitRootMock.mock.resetCalls();
    getCurrentWorktreeMock.mock.resetCalls();
    createContextMock.mock.resetCalls();
    validateWorktreeExistsMock.mock.resetCalls();
    runPostCreateMock.mock.resetCalls();

    getGitRootMock.mock.mockImplementation(() => Promise.resolve("/repo"));
    getCurrentWorktreeMock.mock.mockImplementation(() =>
      Promise.resolve("current-branch"),
    );
    createContextMock.mock.mockImplementation(() =>
      Promise.resolve({
        gitRoot: "/repo",
        worktreesDirectory: "/repo/.git/phantom/worktrees",
        config: {
          postCreate: {
            commands: ["pnpm install"],
          },
        },
      }),
    );
    validateWorktreeExistsMock.mock.mockImplementation(() =>
      Promise.resolve(
        ok({ path: "/repo/.git/phantom/worktrees/current-branch" }),
      ),
    );
    runPostCreateMock.mock.mockImplementation(() =>
      Promise.resolve(ok({ copyError: undefined, executedCommands: [] })),
    );

    await rejects(
      async () => await postCreateHandler(["--current"]),
      /Exit with success/,
    );

    deepStrictEqual(runPostCreateMock.mock.calls.length, 1);
    deepStrictEqual(
      runPostCreateMock.mock.calls[0].arguments[0].worktreeName,
      "current-branch",
    );
  });

  it("warns and exits when no post-create actions are configured", async () => {
    exitWithErrorMock.mock.resetCalls();
    exitWithSuccessMock.mock.resetCalls();
    outputWarnMock.mock.resetCalls();
    getGitRootMock.mock.resetCalls();
    createContextMock.mock.resetCalls();
    validateWorktreeExistsMock.mock.resetCalls();
    runPostCreateMock.mock.resetCalls();

    getGitRootMock.mock.mockImplementation(() => Promise.resolve("/repo"));
    createContextMock.mock.mockImplementation(() =>
      Promise.resolve({
        gitRoot: "/repo",
        worktreesDirectory: "/repo/.git/phantom/worktrees",
        config: null,
      }),
    );
    validateWorktreeExistsMock.mock.mockImplementation(() =>
      Promise.resolve(ok({ path: "/repo/.git/phantom/worktrees/feature" })),
    );

    await rejects(
      async () => await postCreateHandler(["feature"]),
      /Exit with success/,
    );

    deepStrictEqual(outputWarnMock.mock.calls.length, 1);
    deepStrictEqual(
      outputWarnMock.mock.calls[0].arguments[0],
      "No post-create actions configured in phantom.config.json.",
    );
    deepStrictEqual(runPostCreateMock.mock.calls.length, 0);
  });

  it("fails when no target is provided", async () => {
    exitWithErrorMock.mock.resetCalls();

    await rejects(async () => await postCreateHandler([]), /Exit with code 3/);
  });

  it("surfaces post-create command errors", async () => {
    exitWithErrorMock.mock.resetCalls();
    getGitRootMock.mock.resetCalls();
    createContextMock.mock.resetCalls();
    validateWorktreeExistsMock.mock.resetCalls();
    runPostCreateMock.mock.resetCalls();

    getGitRootMock.mock.mockImplementation(() => Promise.resolve("/repo"));
    createContextMock.mock.mockImplementation(() =>
      Promise.resolve({
        gitRoot: "/repo",
        worktreesDirectory: "/repo/.git/phantom/worktrees",
        config: {
          postCreate: {
            commands: ["pnpm install"],
          },
        },
      }),
    );
    validateWorktreeExistsMock.mock.mockImplementation(() =>
      Promise.resolve(ok({ path: "/repo/.git/phantom/worktrees/feature" })),
    );
    runPostCreateMock.mock.mockImplementation(() =>
      Promise.resolve(err(new Error("Post-create command failed"))),
    );

    await rejects(
      async () => await postCreateHandler(["feature"]),
      /Exit with code 1/,
    );
  });
});
