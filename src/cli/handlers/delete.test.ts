import { strictEqual } from "node:assert";
import { describe, it } from "node:test";
import { err, ok } from "../../core/types/result.ts";
import { WorktreeNotFoundError } from "../../core/worktree/errors.ts";

describe("deleteHandler", () => {
  it("should delete worktree by name", async (t) => {
    const exitMock = t.mock.fn();
    const consoleLogMock = t.mock.fn();
    const consoleErrorMock = t.mock.fn();
    const getGitRootMock = t.mock.fn(() => Promise.resolve("/test/repo"));
    const deleteWorktreeMock = t.mock.fn(() =>
      Promise.resolve(
        ok({
          message: "Deleted worktree 'feature' and its branch 'feature'",
        }),
      ),
    );

    t.mock.module("node:process", {
      namedExports: {
        exit: exitMock,
      },
    });

    t.mock.module("../../core/git/libs/get-git-root.ts", {
      namedExports: {
        getGitRoot: getGitRootMock,
      },
    });

    t.mock.module("../../core/worktree/delete.ts", {
      namedExports: {
        deleteWorktree: deleteWorktreeMock,
      },
    });

    t.mock.module("../output.ts", {
      namedExports: {
        output: {
          log: consoleLogMock,
          error: consoleErrorMock,
        },
      },
    });

    t.mock.module("../errors.ts", {
      namedExports: {
        exitCodes: {
          generalError: 1,
          validationError: 2,
        },
        exitWithError: t.mock.fn((message: string, code: number) => {
          consoleErrorMock(`Error: ${message}`);
          exitMock(code);
        }),
        exitWithSuccess: t.mock.fn(() => exitMock(0)),
      },
    });

    const { deleteHandler } = await import("./delete.ts");
    await deleteHandler(["feature"]);

    strictEqual(deleteWorktreeMock.mock.calls.length, 1);
    strictEqual(
      (deleteWorktreeMock.mock.calls[0] as any)?.arguments[0],
      "/test/repo",
    );
    strictEqual(
      (deleteWorktreeMock.mock.calls[0] as any)?.arguments[1],
      "feature",
    );
    const deleteOptions = (deleteWorktreeMock.mock.calls[0] as any)
      ?.arguments[2] as {
      force: boolean;
    };
    strictEqual(deleteOptions.force, false);

    strictEqual(consoleLogMock.mock.calls.length, 1);
    strictEqual(
      consoleLogMock.mock.calls[0]?.arguments[0],
      "Deleted worktree 'feature' and its branch 'feature'",
    );

    strictEqual(exitMock.mock.calls[0]?.arguments[0], 0);
  });

  it("should delete current worktree with --current option", async (t) => {
    const exitMock = t.mock.fn();
    const consoleLogMock = t.mock.fn();
    const consoleErrorMock = t.mock.fn();
    const getGitRootMock = t.mock.fn(() => Promise.resolve("/test/repo"));
    const getCurrentWorktreeMock = t.mock.fn(() => Promise.resolve("issue-93"));
    const deleteWorktreeMock = t.mock.fn(() =>
      Promise.resolve(
        ok({
          message: "Deleted worktree 'issue-93' and its branch 'issue-93'",
        }),
      ),
    );

    t.mock.module("node:process", {
      namedExports: {
        exit: exitMock,
      },
    });

    t.mock.module("../../core/git/libs/get-git-root.ts", {
      namedExports: {
        getGitRoot: getGitRootMock,
      },
    });

    t.mock.module("../../core/git/libs/get-current-worktree.ts", {
      namedExports: {
        getCurrentWorktree: getCurrentWorktreeMock,
      },
    });

    t.mock.module("../../core/worktree/delete.ts", {
      namedExports: {
        deleteWorktree: deleteWorktreeMock,
      },
    });

    t.mock.module("../output.ts", {
      namedExports: {
        output: {
          log: consoleLogMock,
          error: consoleErrorMock,
        },
      },
    });

    t.mock.module("../errors.ts", {
      namedExports: {
        exitCodes: {
          generalError: 1,
          validationError: 2,
        },
        exitWithError: t.mock.fn((message: string, code: number) => {
          consoleErrorMock(`Error: ${message}`);
          exitMock(code);
        }),
        exitWithSuccess: t.mock.fn(() => exitMock(0)),
      },
    });

    const { deleteHandler } = await import("./delete.ts");
    await deleteHandler(["--current"]);

    strictEqual(getCurrentWorktreeMock.mock.calls.length, 1);
    strictEqual(
      (getCurrentWorktreeMock.mock.calls[0] as any)?.arguments[0],
      "/test/repo",
    );

    strictEqual(deleteWorktreeMock.mock.calls.length, 1);
    strictEqual(
      (deleteWorktreeMock.mock.calls[0] as any)?.arguments[0],
      "/test/repo",
    );
    strictEqual(
      (deleteWorktreeMock.mock.calls[0] as any)?.arguments[1],
      "issue-93",
    );
    const deleteOptions = (deleteWorktreeMock.mock.calls[0] as any)
      ?.arguments[2] as {
      force: boolean;
    };
    strictEqual(deleteOptions.force, false);

    strictEqual(consoleLogMock.mock.calls.length, 1);
    strictEqual(
      consoleLogMock.mock.calls[0]?.arguments[0],
      "Deleted worktree 'issue-93' and its branch 'issue-93'",
    );

    strictEqual(exitMock.mock.calls[0]?.arguments[0], 0);
  });

  it("should error when --current is used outside a worktree", async (t) => {
    const exitMock = t.mock.fn();
    const consoleErrorMock = t.mock.fn();
    const getGitRootMock = t.mock.fn(() => Promise.resolve("/test/repo"));
    const getCurrentWorktreeMock = t.mock.fn(() => Promise.resolve(null));

    t.mock.module("node:process", {
      namedExports: {
        exit: exitMock,
      },
    });

    t.mock.module("../../core/git/libs/get-git-root.ts", {
      namedExports: {
        getGitRoot: getGitRootMock,
      },
    });

    t.mock.module("../../core/git/libs/get-current-worktree.ts", {
      namedExports: {
        getCurrentWorktree: getCurrentWorktreeMock,
      },
    });

    t.mock.module("../errors.ts", {
      namedExports: {
        exitCodes: {
          generalError: 1,
          validationError: 2,
        },
        exitWithError: t.mock.fn((message: string, code: number) => {
          consoleErrorMock(`Error: ${message}`);
          exitMock(code);
        }),
        exitWithSuccess: t.mock.fn(() => exitMock(0)),
      },
    });

    const { deleteHandler } = await import("./delete.ts");
    await deleteHandler(["--current"]);

    strictEqual(getCurrentWorktreeMock.mock.calls.length, 1);
    strictEqual(consoleErrorMock.mock.calls.length, 1);
    strictEqual(
      consoleErrorMock.mock.calls[0]?.arguments[0],
      "Error: Not in a worktree directory. The --current option can only be used from within a worktree.",
    );
    strictEqual(exitMock.mock.calls[0]?.arguments[0], 2);
  });

  it("should error when both name and --current are provided", async (t) => {
    const exitMock = t.mock.fn();
    const consoleErrorMock = t.mock.fn();

    t.mock.module("node:process", {
      namedExports: {
        exit: exitMock,
      },
    });

    t.mock.module("../errors.ts", {
      namedExports: {
        exitCodes: {
          generalError: 1,
          validationError: 2,
        },
        exitWithError: t.mock.fn((message: string, code: number) => {
          consoleErrorMock(`Error: ${message}`);
          exitMock(code);
        }),
        exitWithSuccess: t.mock.fn(() => exitMock(0)),
      },
    });

    const { deleteHandler } = await import("./delete.ts");
    await deleteHandler(["feature", "--current"]);

    strictEqual(consoleErrorMock.mock.calls.length, 1);
    strictEqual(
      consoleErrorMock.mock.calls[0]?.arguments[0],
      "Error: Cannot specify both a worktree name and --current option",
    );
    strictEqual(exitMock.mock.calls[0]?.arguments[0], 2);
  });

  it("should error when no arguments are provided", async (t) => {
    const exitMock = t.mock.fn();
    const consoleErrorMock = t.mock.fn();

    t.mock.module("node:process", {
      namedExports: {
        exit: exitMock,
      },
    });

    t.mock.module("../errors.ts", {
      namedExports: {
        exitCodes: {
          generalError: 1,
          validationError: 2,
        },
        exitWithError: t.mock.fn((message: string, code: number) => {
          consoleErrorMock(`Error: ${message}`);
          exitMock(code);
        }),
        exitWithSuccess: t.mock.fn(() => exitMock(0)),
      },
    });

    const { deleteHandler } = await import("./delete.ts");
    await deleteHandler([]);

    strictEqual(consoleErrorMock.mock.calls.length, 1);
    strictEqual(
      consoleErrorMock.mock.calls[0]?.arguments[0],
      "Error: Please provide a worktree name to delete or use --current to delete the current worktree",
    );
    strictEqual(exitMock.mock.calls[0]?.arguments[0], 2);
  });

  it("should handle force deletion with --current", async (t) => {
    const exitMock = t.mock.fn();
    const consoleLogMock = t.mock.fn();
    const consoleErrorMock = t.mock.fn();
    const getGitRootMock = t.mock.fn(() => Promise.resolve("/test/repo"));
    const getCurrentWorktreeMock = t.mock.fn(() => Promise.resolve("feature"));
    const deleteWorktreeMock = t.mock.fn(() =>
      Promise.resolve(
        ok({
          message:
            "Warning: Worktree 'feature' had uncommitted changes (2 files)\nDeleted worktree 'feature' and its branch 'feature'",
          hasUncommittedChanges: true,
          changedFiles: 2,
        }),
      ),
    );

    t.mock.module("node:process", {
      namedExports: {
        exit: exitMock,
      },
    });

    t.mock.module("../../core/git/libs/get-git-root.ts", {
      namedExports: {
        getGitRoot: getGitRootMock,
      },
    });

    t.mock.module("../../core/git/libs/get-current-worktree.ts", {
      namedExports: {
        getCurrentWorktree: getCurrentWorktreeMock,
      },
    });

    t.mock.module("../../core/worktree/delete.ts", {
      namedExports: {
        deleteWorktree: deleteWorktreeMock,
      },
    });

    t.mock.module("../output.ts", {
      namedExports: {
        output: {
          log: consoleLogMock,
          error: consoleErrorMock,
        },
      },
    });

    t.mock.module("../errors.ts", {
      namedExports: {
        exitCodes: {
          generalError: 1,
          validationError: 2,
        },
        exitWithError: t.mock.fn((message: string, code: number) => {
          consoleErrorMock(`Error: ${message}`);
          exitMock(code);
        }),
        exitWithSuccess: t.mock.fn(() => exitMock(0)),
      },
    });

    const { deleteHandler } = await import("./delete.ts");
    await deleteHandler(["--current", "--force"]);

    strictEqual(deleteWorktreeMock.mock.calls.length, 1);
    const deleteOptions = (deleteWorktreeMock.mock.calls[0] as any)
      ?.arguments[2] as {
      force: boolean;
    };
    strictEqual(deleteOptions.force, true);

    strictEqual(consoleLogMock.mock.calls.length, 1);
    strictEqual(exitMock.mock.calls[0]?.arguments[0], 0);
  });

  it("should handle worktree not found error", async (t) => {
    const exitMock = t.mock.fn();
    const consoleErrorMock = t.mock.fn();
    const consoleLogMock = t.mock.fn();
    const getGitRootMock = t.mock.fn(() => Promise.resolve("/test/repo"));
    const deleteWorktreeMock = t.mock.fn(() =>
      Promise.resolve(err(new WorktreeNotFoundError("feature"))),
    );

    t.mock.module("node:process", {
      namedExports: {
        exit: exitMock,
      },
    });

    t.mock.module("../../core/git/libs/get-git-root.ts", {
      namedExports: {
        getGitRoot: getGitRootMock,
      },
    });

    t.mock.module("../../core/worktree/delete.ts", {
      namedExports: {
        deleteWorktree: deleteWorktreeMock,
      },
    });

    t.mock.module("../output.ts", {
      namedExports: {
        output: {
          log: consoleLogMock,
          error: consoleErrorMock,
        },
      },
    });

    t.mock.module("../errors.ts", {
      namedExports: {
        exitCodes: {
          generalError: 1,
          validationError: 2,
        },
        exitWithError: t.mock.fn((message: string, code: number) => {
          consoleErrorMock(`Error: ${message}`);
          exitMock(code);
        }),
        exitWithSuccess: t.mock.fn(() => exitMock(0)),
      },
    });

    const { deleteHandler } = await import("./delete.ts");
    await deleteHandler(["feature"]);

    strictEqual(consoleErrorMock.mock.calls.length, 1);
    strictEqual(
      consoleErrorMock.mock.calls[0]?.arguments[0],
      "Error: Worktree 'feature' not found",
    );
    strictEqual(exitMock.mock.calls[0]?.arguments[0], 2);
  });
});
