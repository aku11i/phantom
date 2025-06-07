import { rejects, strictEqual } from "node:assert";
import { describe, it, mock } from "node:test";
import { err, ok } from "../../core/types/result.ts";
import { WorktreeNotFoundError } from "../../core/worktree/errors.ts";

const exitMock = mock.fn();
const consoleLogMock = mock.fn();
const consoleErrorMock = mock.fn();
const getGitRootMock = mock.fn();
const deleteWorktreeMock = mock.fn();
const getCurrentWorktreeMock = mock.fn();
const exitWithErrorMock = mock.fn((message, code) => {
  consoleErrorMock(`Error: ${message}`);
  exitMock(code);
  throw new Error(`Exit with code ${code}: ${message}`);
});
const exitWithSuccessMock = mock.fn(() => {
  exitMock(0);
  throw new Error("Exit with code 0: success");
});

mock.module("node:process", {
  namedExports: {
    exit: exitMock,
  },
});

mock.module("../../core/git/libs/get-git-root.ts", {
  namedExports: {
    getGitRoot: getGitRootMock,
  },
});

mock.module("../../core/git/libs/get-current-worktree.ts", {
  namedExports: {
    getCurrentWorktree: getCurrentWorktreeMock,
  },
});

mock.module("../../core/worktree/delete.ts", {
  namedExports: {
    deleteWorktree: deleteWorktreeMock,
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
    exitCodes: {
      success: 0,
      generalError: 1,
      notFound: 2,
      validationError: 3,
    },
    exitWithError: exitWithErrorMock,
    exitWithSuccess: exitWithSuccessMock,
  },
});

const { deleteHandler } = await import("./delete.ts");

describe("deleteHandler", () => {
  const resetMocks = () => {
    exitMock.mock.resetCalls();
    consoleLogMock.mock.resetCalls();
    consoleErrorMock.mock.resetCalls();
    getGitRootMock.mock.resetCalls();
    deleteWorktreeMock.mock.resetCalls();
    getCurrentWorktreeMock.mock.resetCalls();
    exitWithErrorMock.mock.resetCalls();
    exitWithSuccessMock.mock.resetCalls();
  };

  it("should delete worktree by name", async () => {
    resetMocks();
    getGitRootMock.mock.mockImplementation(() => Promise.resolve("/test/repo"));
    deleteWorktreeMock.mock.mockImplementation(() =>
      Promise.resolve(
        ok({
          message: "Deleted worktree 'feature' and its branch 'feature'",
        }),
      ),
    );

    await rejects(
      async () => await deleteHandler(["feature"]),
      /Exit with code 0: success/,
    );

    strictEqual(deleteWorktreeMock.mock.calls.length, 1);
    strictEqual(deleteWorktreeMock.mock.calls[0].arguments[0], "/test/repo");
    strictEqual(deleteWorktreeMock.mock.calls[0].arguments[1], "feature");
    const deleteOptions = deleteWorktreeMock.mock.calls[0].arguments[2];
    strictEqual(deleteOptions.force, false);

    strictEqual(consoleLogMock.mock.calls.length, 1);
    strictEqual(
      consoleLogMock.mock.calls[0].arguments[0],
      "Deleted worktree 'feature' and its branch 'feature'",
    );

    strictEqual(exitMock.mock.calls[0].arguments[0], 0);
  });

  it("should delete current worktree with --current option", async () => {
    resetMocks();
    getGitRootMock.mock.mockImplementation(() => Promise.resolve("/test/repo"));
    getCurrentWorktreeMock.mock.mockImplementation(() =>
      Promise.resolve("issue-93"),
    );
    deleteWorktreeMock.mock.mockImplementation(() =>
      Promise.resolve(
        ok({
          message: "Deleted worktree 'issue-93' and its branch 'issue-93'",
        }),
      ),
    );

    await rejects(
      async () => await deleteHandler(["--current"]),
      /Exit with code 0: success/,
    );

    strictEqual(getCurrentWorktreeMock.mock.calls.length, 1);
    strictEqual(
      getCurrentWorktreeMock.mock.calls[0].arguments[0],
      "/test/repo",
    );

    strictEqual(deleteWorktreeMock.mock.calls.length, 1);
    strictEqual(deleteWorktreeMock.mock.calls[0].arguments[0], "/test/repo");
    strictEqual(deleteWorktreeMock.mock.calls[0].arguments[1], "issue-93");
    const deleteOptions = deleteWorktreeMock.mock.calls[0].arguments[2];
    strictEqual(deleteOptions.force, false);

    strictEqual(consoleLogMock.mock.calls.length, 1);
    strictEqual(
      consoleLogMock.mock.calls[0].arguments[0],
      "Deleted worktree 'issue-93' and its branch 'issue-93'",
    );

    strictEqual(exitMock.mock.calls[0].arguments[0], 0);
  });

  it("should error when --current is used outside a worktree", async () => {
    resetMocks();
    getGitRootMock.mock.mockImplementation(() => Promise.resolve("/test/repo"));
    getCurrentWorktreeMock.mock.mockImplementation(() => Promise.resolve(null));

    await rejects(
      async () => await deleteHandler(["--current"]),
      /Exit with code 3: Not in a worktree directory/,
    );

    strictEqual(getCurrentWorktreeMock.mock.calls.length, 1);
    strictEqual(consoleErrorMock.mock.calls.length, 2); // exitWithError is called twice - once in the handler, once in the catch block
    strictEqual(
      consoleErrorMock.mock.calls[0].arguments[0],
      "Error: Not in a worktree directory. The --current option can only be used from within a worktree.",
    );
    strictEqual(
      consoleErrorMock.mock.calls[1].arguments[0],
      "Error: Exit with code 3: Not in a worktree directory. The --current option can only be used from within a worktree.",
    );
    strictEqual(exitMock.mock.calls.length, 2);
    strictEqual(exitMock.mock.calls[0].arguments[0], 3); // first call with validationError
    strictEqual(exitMock.mock.calls[1].arguments[0], 1); // second call with generalError
  });

  it("should error when both name and --current are provided", async () => {
    resetMocks();

    await rejects(
      async () => await deleteHandler(["feature", "--current"]),
      /Exit with code 3: Cannot specify --current with a worktree name or --fzf option/,
    );

    strictEqual(consoleErrorMock.mock.calls.length, 1);
    strictEqual(
      consoleErrorMock.mock.calls[0].arguments[0],
      "Error: Cannot specify --current with a worktree name or --fzf option",
    );
    strictEqual(exitMock.mock.calls[0].arguments[0], 3); // validationError
  });

  it("should error when no arguments are provided", async () => {
    resetMocks();

    await rejects(
      async () => await deleteHandler([]),
      /Exit with code 3: Please provide a worktree name to delete, use --current to delete the current worktree, or use --fzf for interactive selection/,
    );

    strictEqual(consoleErrorMock.mock.calls.length, 1);
    strictEqual(
      consoleErrorMock.mock.calls[0].arguments[0],
      "Error: Please provide a worktree name to delete, use --current to delete the current worktree, or use --fzf for interactive selection",
    );
    strictEqual(exitMock.mock.calls[0].arguments[0], 3); // validationError
  });

  it("should handle force deletion with --current", async () => {
    resetMocks();
    getGitRootMock.mock.mockImplementation(() => Promise.resolve("/test/repo"));
    getCurrentWorktreeMock.mock.mockImplementation(() =>
      Promise.resolve("feature"),
    );
    deleteWorktreeMock.mock.mockImplementation(() =>
      Promise.resolve(
        ok({
          message:
            "Warning: Worktree 'feature' had uncommitted changes (2 files)\nDeleted worktree 'feature' and its branch 'feature'",
          hasUncommittedChanges: true,
          changedFiles: 2,
        }),
      ),
    );

    await rejects(
      async () => await deleteHandler(["--current", "--force"]),
      /Exit with code 0: success/,
    );

    strictEqual(deleteWorktreeMock.mock.calls.length, 1);
    const deleteOptions = deleteWorktreeMock.mock.calls[0].arguments[2];
    strictEqual(deleteOptions.force, true);

    strictEqual(consoleLogMock.mock.calls.length, 1);
    strictEqual(exitMock.mock.calls[0].arguments[0], 0);
  });

  it("should handle worktree not found error", async () => {
    resetMocks();
    getGitRootMock.mock.mockImplementation(() => Promise.resolve("/test/repo"));
    deleteWorktreeMock.mock.mockImplementation(() =>
      Promise.resolve(err(new WorktreeNotFoundError("feature"))),
    );

    await rejects(
      async () => await deleteHandler(["feature"]),
      /Exit with code 3: Worktree 'feature' not found/,
    );

    strictEqual(consoleErrorMock.mock.calls.length, 2); // exitWithError is called twice
    strictEqual(
      consoleErrorMock.mock.calls[0].arguments[0],
      "Error: Worktree 'feature' not found",
    );
    strictEqual(
      consoleErrorMock.mock.calls[1].arguments[0],
      "Error: Exit with code 3: Worktree 'feature' not found",
    );
    strictEqual(exitMock.mock.calls.length, 2);
    strictEqual(exitMock.mock.calls[0].arguments[0], 3); // first call with validationError
    strictEqual(exitMock.mock.calls[1].arguments[0], 1); // second call with generalError
  });
});
