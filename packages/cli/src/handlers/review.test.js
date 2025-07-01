import { rejects, strictEqual } from "node:assert";
import { mock } from "node:test";
import { describe, it } from "node:test";
import { WorktreeNotFoundError } from "@aku11i/phantom-core";
import { err, ok } from "@aku11i/phantom-shared";

const exitMock = mock.fn((code) => {
  throw new Error(
    `Exit with code ${code}: ${code === 0 ? "success" : "error"}`,
  );
});
const consoleLogMock = mock.fn();
const consoleErrorMock = mock.fn();
const getGitRootMock = mock.fn();
const execInWorktreeMock = mock.fn();
const validateWorktreeExistsMock = mock.fn();
const selectWorktreeWithFzfMock = mock.fn();
const exitWithErrorMock = mock.fn((message, code) => {
  consoleErrorMock(`Error: ${message}`);
  exitMock(code);
});
const exitWithSuccessMock = mock.fn(() => {
  exitMock(0);
});

mock.module("node:process", {
  namedExports: {
    exit: exitMock,
  },
});

mock.module("@aku11i/phantom-git", {
  namedExports: {
    getGitRoot: getGitRootMock,
  },
});

mock.module("@aku11i/phantom-core", {
  namedExports: {
    validateWorktreeExists: validateWorktreeExistsMock,
    selectWorktreeWithFzf: selectWorktreeWithFzfMock,
    execInWorktree: execInWorktreeMock,
    WorktreeNotFoundError,
    createContext: mock.fn((gitRoot) =>
      Promise.resolve({
        gitRoot,
        worktreesDirectory: `${gitRoot}/.git/phantom/worktrees`,
        config: null,
      }),
    ),
  },
});

mock.module("../output.ts", {
  namedExports: {
    output: {
      log: consoleLogMock,
      error: consoleErrorMock,
    },
  },
});

mock.module("../errors.ts", {
  namedExports: {
    exitWithError: exitWithErrorMock,
    exitWithSuccess: exitWithSuccessMock,
    exitCodes: {
      success: 0,
      generalError: 1,
      validationError: 3,
      notFound: 4,
    },
  },
});

const { reviewHandler } = await import("./review.ts");

describe("reviewHandler", () => {
  it("should execute reviewit with default base branch", async () => {
    exitMock.mock.resetCalls();
    consoleLogMock.mock.resetCalls();
    getGitRootMock.mock.resetCalls();
    validateWorktreeExistsMock.mock.resetCalls();
    execInWorktreeMock.mock.resetCalls();

    getGitRootMock.mock.mockImplementation(() => "/repo");
    validateWorktreeExistsMock.mock.mockImplementation(() =>
      ok({ path: "/repo/.git/phantom/worktrees/feature" }),
    );
    execInWorktreeMock.mock.mockImplementation(() => ok({ exitCode: 0 }));

    await rejects(
      async () => await reviewHandler(["feature"]),
      /Exit with code 0: success/,
    );

    strictEqual(consoleLogMock.mock.calls.length, 2);
    strictEqual(
      consoleLogMock.mock.calls[0].arguments[0],
      "Opening review for worktree 'feature'...",
    );
    strictEqual(
      consoleLogMock.mock.calls[1].arguments[0],
      "powered by yoshiko-pg/reviewit (https://github.com/yoshiko-pg/reviewit)",
    );

    strictEqual(execInWorktreeMock.mock.calls.length, 1);
    const execCall = execInWorktreeMock.mock.calls[0];
    strictEqual(execCall.arguments[0], "/repo");
    strictEqual(execCall.arguments[1], "/repo/.git/phantom/worktrees");
    strictEqual(execCall.arguments[2], "feature");
    strictEqual(execCall.arguments[3].join(" "), "reviewit . origin/main");
    strictEqual(execCall.arguments[4].interactive, true);
  });

  it("should execute reviewit with custom base branch", async () => {
    exitMock.mock.resetCalls();
    consoleLogMock.mock.resetCalls();
    getGitRootMock.mock.resetCalls();
    validateWorktreeExistsMock.mock.resetCalls();
    execInWorktreeMock.mock.resetCalls();

    getGitRootMock.mock.mockImplementation(() => "/repo");
    validateWorktreeExistsMock.mock.mockImplementation(() =>
      ok({ path: "/repo/.git/phantom/worktrees/feature" }),
    );
    execInWorktreeMock.mock.mockImplementation(() => ok({ exitCode: 0 }));

    await rejects(
      async () => await reviewHandler(["feature", "--base", "origin/develop"]),
      /Exit with code 0: success/,
    );

    const execCall = execInWorktreeMock.mock.calls[0];
    strictEqual(execCall.arguments[3].join(" "), "reviewit . origin/develop");
  });

  it("should execute reviewit with local branch as base", async () => {
    exitMock.mock.resetCalls();
    consoleLogMock.mock.resetCalls();
    getGitRootMock.mock.resetCalls();
    validateWorktreeExistsMock.mock.resetCalls();
    execInWorktreeMock.mock.resetCalls();

    getGitRootMock.mock.mockImplementation(() => "/repo");
    validateWorktreeExistsMock.mock.mockImplementation(() =>
      ok({ path: "/repo/.git/phantom/worktrees/feature" }),
    );
    execInWorktreeMock.mock.mockImplementation(() => ok({ exitCode: 0 }));

    await rejects(
      async () => await reviewHandler(["feature", "--base", "main"]),
      /Exit with code 0: success/,
    );

    const execCall = execInWorktreeMock.mock.calls[0];
    strictEqual(execCall.arguments[3].join(" "), "reviewit . main");
  });

  it("should use defaultBranch from config when available", async () => {
    exitMock.mock.resetCalls();
    consoleLogMock.mock.resetCalls();
    getGitRootMock.mock.resetCalls();
    validateWorktreeExistsMock.mock.resetCalls();
    execInWorktreeMock.mock.resetCalls();

    // Mock createContext to return config with defaultBranch
    const createContextMock = mock.fn((gitRoot) =>
      Promise.resolve({
        gitRoot,
        worktreesDirectory: `${gitRoot}/.git/phantom/worktrees`,
        config: { defaultBranch: "develop" },
      }),
    );

    mock.module("@aku11i/phantom-core", {
      namedExports: {
        validateWorktreeExists: validateWorktreeExistsMock,
        selectWorktreeWithFzf: selectWorktreeWithFzfMock,
        execInWorktree: execInWorktreeMock,
        WorktreeNotFoundError,
        createContext: createContextMock,
      },
    });

    // Re-import to get the new mock
    const { reviewHandler: reviewHandlerWithConfig } = await import(
      "./review.ts"
    );

    getGitRootMock.mock.mockImplementation(() => "/repo");
    validateWorktreeExistsMock.mock.mockImplementation(() =>
      ok({ path: "/repo/.git/phantom/worktrees/feature" }),
    );
    execInWorktreeMock.mock.mockImplementation(() => ok({ exitCode: 0 }));

    await rejects(
      async () => await reviewHandlerWithConfig(["feature"]),
      /Exit with code 0: success/,
    );

    const execCall = execInWorktreeMock.mock.calls[0];
    strictEqual(execCall.arguments[3].join(" "), "reviewit . origin/develop");
  });

  it("should select worktree with fzf when --fzf is used", async () => {
    exitMock.mock.resetCalls();
    consoleLogMock.mock.resetCalls();
    getGitRootMock.mock.resetCalls();
    selectWorktreeWithFzfMock.mock.resetCalls();
    validateWorktreeExistsMock.mock.resetCalls();
    execInWorktreeMock.mock.resetCalls();

    getGitRootMock.mock.mockImplementation(() => "/repo");
    selectWorktreeWithFzfMock.mock.mockImplementation(() =>
      ok({
        name: "selected-feature",
        path: "/repo/.git/phantom/worktrees/selected-feature",
      }),
    );
    validateWorktreeExistsMock.mock.mockImplementation(() =>
      ok({ path: "/repo/.git/phantom/worktrees/selected-feature" }),
    );
    execInWorktreeMock.mock.mockImplementation(() => ok({ exitCode: 0 }));

    await rejects(
      async () => await reviewHandler(["--fzf"]),
      /Exit with code 0: success/,
    );

    strictEqual(selectWorktreeWithFzfMock.mock.calls.length, 1);
    strictEqual(
      consoleLogMock.mock.calls[0].arguments[0],
      "Opening review for worktree 'selected-feature'...",
    );
  });

  it("should error when worktree name not provided without --fzf", async () => {
    exitMock.mock.resetCalls();
    consoleErrorMock.mock.resetCalls();
    getGitRootMock.mock.resetCalls();

    await rejects(
      async () => await reviewHandler([]),
      /Exit with code 3: Usage: phantom review <worktree-name> \[--base <ref>\]/,
    );

    strictEqual(consoleErrorMock.mock.calls.length, 1);
    strictEqual(
      consoleErrorMock.mock.calls[0].arguments[0],
      "Error: Usage: phantom review <worktree-name> [--base <ref>]",
    );
  });

  it("should error when worktree name provided with --fzf", async () => {
    exitMock.mock.resetCalls();
    consoleErrorMock.mock.resetCalls();
    getGitRootMock.mock.resetCalls();

    await rejects(
      async () => await reviewHandler(["feature", "--fzf"]),
      /Exit with code 3: Cannot specify worktree name when using --fzf/,
    );

    strictEqual(consoleErrorMock.mock.calls.length, 1);
    strictEqual(
      consoleErrorMock.mock.calls[0].arguments[0],
      "Error: Cannot specify worktree name when using --fzf",
    );
  });

  it("should handle worktree not found error", async () => {
    exitMock.mock.resetCalls();
    consoleErrorMock.mock.resetCalls();
    getGitRootMock.mock.resetCalls();
    validateWorktreeExistsMock.mock.resetCalls();

    getGitRootMock.mock.mockImplementation(() => "/repo");
    validateWorktreeExistsMock.mock.mockImplementation(() =>
      err(new WorktreeNotFoundError("non-existent")),
    );

    await rejects(
      async () => await reviewHandler(["non-existent"]),
      /Exit with code 4: Worktree 'non-existent' not found/,
    );

    strictEqual(consoleErrorMock.mock.calls.length, 1);
    strictEqual(
      consoleErrorMock.mock.calls[0].arguments[0],
      "Error: Worktree 'non-existent' not found",
    );
  });

  it("should exit gracefully when fzf selection is cancelled", async () => {
    exitMock.mock.resetCalls();
    consoleLogMock.mock.resetCalls();
    getGitRootMock.mock.resetCalls();
    selectWorktreeWithFzfMock.mock.resetCalls();
    exitWithSuccessMock.mock.resetCalls();

    getGitRootMock.mock.mockImplementation(() => "/repo");
    selectWorktreeWithFzfMock.mock.mockImplementation(() => ok(null));

    await rejects(
      async () => await reviewHandler(["--fzf"]),
      /Exit with code 0: success/,
    );

    strictEqual(selectWorktreeWithFzfMock.mock.calls.length, 1);
    strictEqual(exitWithSuccessMock.mock.calls.length, 1);
    strictEqual(consoleLogMock.mock.calls.length, 0); // No log output when selection is cancelled
  });
});
