import { deepStrictEqual } from "node:assert";
import { describe, it } from "node:test";
import { err, ok } from "../../core/types/result.ts";
import {
  BranchNotFoundError,
  WorktreeAlreadyExistsError,
} from "../../core/worktree/errors.ts";

describe("attachHandler", () => {
  it("should attach to existing branch successfully", async (t) => {
    const exitWithErrorMock = t.mock.fn();
    const outputLogMock = t.mock.fn();
    const getGitRootMock = t.mock.fn(() => Promise.resolve("/repo"));
    const attachWorktreeCoreMock = t.mock.fn(() =>
      Promise.resolve(ok("/repo/.git/phantom/worktrees/feature")),
    );

    t.mock.module("../errors.ts", {
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

    t.mock.module("../output.ts", {
      namedExports: {
        output: { log: outputLogMock },
      },
    });

    t.mock.module("../../core/git/libs/get-git-root.ts", {
      namedExports: {
        getGitRoot: getGitRootMock,
      },
    });

    t.mock.module("../../core/worktree/attach.ts", {
      namedExports: {
        attachWorktreeCore: attachWorktreeCoreMock,
      },
    });

    t.mock.module("../../core/process/shell.ts", {
      namedExports: {
        shellInWorktree: t.mock.fn(),
      },
    });

    t.mock.module("../../core/process/exec.ts", {
      namedExports: {
        execInWorktree: t.mock.fn(),
      },
    });

    const { attachHandler } = await import("./attach.ts");

    await attachHandler(["feature"]);

    deepStrictEqual(exitWithErrorMock.mock.calls.length, 0);
    deepStrictEqual(
      outputLogMock.mock.calls[0].arguments[0],
      "Attached phantom: feature",
    );
    deepStrictEqual(attachWorktreeCoreMock.mock.calls[0].arguments, [
      "/repo",
      "feature",
    ]);
  });

  it("should exit with error when no branch name provided", async (t) => {
    const exitWithErrorMock = t.mock.fn();

    t.mock.module("../errors.ts", {
      namedExports: {
        exitWithError: exitWithErrorMock,
        exitCodes: {
          validationError: 3,
        },
      },
    });

    const { attachHandler } = await import("./attach.ts");

    await attachHandler([]);

    deepStrictEqual(exitWithErrorMock.mock.calls[0].arguments, [
      "Missing required argument: branch name",
      3,
    ]);
  });

  it("should exit with error when both --shell and --exec are provided", async (t) => {
    const exitWithErrorMock = t.mock.fn();

    t.mock.module("../errors.ts", {
      namedExports: {
        exitWithError: exitWithErrorMock,
        exitCodes: {
          validationError: 3,
        },
      },
    });

    const { attachHandler } = await import("./attach.ts");

    await attachHandler(["feature", "--shell", "--exec", "ls"]);

    deepStrictEqual(exitWithErrorMock.mock.calls[0].arguments, [
      "Cannot use both --shell and --exec options",
      3,
    ]);
  });

  it("should handle BranchNotFoundError", async (t) => {
    const exitWithErrorMock = t.mock.fn();
    const getGitRootMock = t.mock.fn(() => Promise.resolve("/repo"));
    const attachWorktreeCoreMock = t.mock.fn(() =>
      Promise.resolve(err(new BranchNotFoundError("nonexistent"))),
    );

    t.mock.module("../errors.ts", {
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

    t.mock.module("../../core/git/libs/get-git-root.ts", {
      namedExports: {
        getGitRoot: getGitRootMock,
      },
    });

    t.mock.module("../../core/worktree/attach.ts", {
      namedExports: {
        attachWorktreeCore: attachWorktreeCoreMock,
      },
    });

    const { attachHandler } = await import("./attach.ts");

    await attachHandler(["nonexistent"]);

    deepStrictEqual(exitWithErrorMock.mock.calls[0].arguments, [
      "Branch 'nonexistent' not found",
      2,
    ]);
  });

  it("should spawn shell when --shell flag is provided", async (t) => {
    const exitWithErrorMock = t.mock.fn();
    const outputLogMock = t.mock.fn();
    const shellInWorktreeMock = t.mock.fn(() =>
      Promise.resolve(ok({ exitCode: 0 })),
    );
    const getGitRootMock = t.mock.fn(() => Promise.resolve("/repo"));
    const attachWorktreeCoreMock = t.mock.fn(() =>
      Promise.resolve(ok("/repo/.git/phantom/worktrees/feature")),
    );

    t.mock.module("../errors.ts", {
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

    t.mock.module("../output.ts", {
      namedExports: {
        output: { log: outputLogMock },
      },
    });

    t.mock.module("../../core/git/libs/get-git-root.ts", {
      namedExports: {
        getGitRoot: getGitRootMock,
      },
    });

    t.mock.module("../../core/worktree/attach.ts", {
      namedExports: {
        attachWorktreeCore: attachWorktreeCoreMock,
      },
    });

    t.mock.module("../../core/process/shell.ts", {
      namedExports: {
        shellInWorktree: shellInWorktreeMock,
      },
    });

    t.mock.module("../../core/process/exec.ts", {
      namedExports: {
        execCommand: t.mock.fn(),
      },
    });

    const { attachHandler } = await import("./attach.ts");

    await attachHandler(["feature", "--shell"]);

    deepStrictEqual(shellInWorktreeMock.mock.calls[0].arguments, [
      "/repo",
      "feature",
    ]);
  });
});
