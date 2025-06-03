import { deepStrictEqual } from "node:assert";
import { describe, it, mock } from "node:test";
import { err, ok } from "../../core/types/result.ts";
import {
  BranchNotFoundError,
  WorktreeAlreadyExistsError,
} from "../../core/worktree/errors.ts";

describe("attachHandler", () => {
  let exitWithErrorMock: ReturnType<typeof mock.fn>;
  let outputLogMock: ReturnType<typeof mock.fn>;
  let getGitRootMock: ReturnType<typeof mock.fn>;
  let attachWorktreeCoreMock: ReturnType<typeof mock.fn>;
  let shellInWorktreeMock: ReturnType<typeof mock.fn>;
  let execInWorktreeMock: ReturnType<typeof mock.fn>;

  it("should attach to existing branch successfully", async () => {
    exitWithErrorMock = mock.fn();
    outputLogMock = mock.fn();
    getGitRootMock = mock.fn(() => Promise.resolve("/repo"));
    attachWorktreeCoreMock = mock.fn(() =>
      Promise.resolve(ok("/repo/.git/phantom/worktrees/feature")),
    );

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
        output: { log: outputLogMock },
      },
    });

    mock.module("../../core/git/libs/get-git-root.ts", {
      namedExports: {
        getGitRoot: getGitRootMock,
      },
    });

    mock.module("../../core/worktree/attach.ts", {
      namedExports: {
        attachWorktreeCore: attachWorktreeCoreMock,
      },
    });

    mock.module("../../core/process/shell.ts", {
      namedExports: {
        shellInWorktree: mock.fn(),
      },
    });

    mock.module("../../core/process/exec.ts", {
      namedExports: {
        execInWorktree: mock.fn(),
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

  it("should exit with error when no branch name provided", async () => {
    exitWithErrorMock = mock.fn();

    mock.module("../errors.ts", {
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

  it("should exit with error when both --shell and --exec are provided", async () => {
    exitWithErrorMock = mock.fn();

    mock.module("../errors.ts", {
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

  it("should handle BranchNotFoundError", async () => {
    exitWithErrorMock = mock.fn();
    getGitRootMock = mock.fn(() => Promise.resolve("/repo"));
    attachWorktreeCoreMock = mock.fn(() =>
      Promise.resolve(err(new BranchNotFoundError("nonexistent"))),
    );

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

    mock.module("../../core/git/libs/get-git-root.ts", {
      namedExports: {
        getGitRoot: getGitRootMock,
      },
    });

    mock.module("../../core/worktree/attach.ts", {
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

  it("should spawn shell when --shell flag is provided", async () => {
    exitWithErrorMock = mock.fn();
    outputLogMock = mock.fn();
    shellInWorktreeMock = mock.fn(() => Promise.resolve(ok({ exitCode: 0 })));
    getGitRootMock = mock.fn(() => Promise.resolve("/repo"));
    attachWorktreeCoreMock = mock.fn(() =>
      Promise.resolve(ok("/repo/.git/phantom/worktrees/feature")),
    );

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
        output: { log: outputLogMock },
      },
    });

    mock.module("../../core/git/libs/get-git-root.ts", {
      namedExports: {
        getGitRoot: getGitRootMock,
      },
    });

    mock.module("../../core/worktree/attach.ts", {
      namedExports: {
        attachWorktreeCore: attachWorktreeCoreMock,
      },
    });

    mock.module("../../core/process/shell.ts", {
      namedExports: {
        shellInWorktree: shellInWorktreeMock,
      },
    });

    mock.module("../../core/process/exec.ts", {
      namedExports: {
        execCommand: mock.fn(),
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
