import { strictEqual } from "node:assert";
import { describe, it, mock } from "node:test";
import { err, ok } from "../../core/types/result.ts";

describe("createHandler", () => {
  let exitMock: ReturnType<typeof mock.fn>;
  let consoleLogMock: ReturnType<typeof mock.fn>;
  let consoleErrorMock: ReturnType<typeof mock.fn>;
  let getGitRootMock: ReturnType<typeof mock.fn>;
  let createWorktreeMock: ReturnType<typeof mock.fn>;
  let execInWorktreeMock: ReturnType<typeof mock.fn>;
  let shellInWorktreeMock: ReturnType<typeof mock.fn>;

  it("should create worktree and execute command with --exec option", async () => {
    exitMock = mock.fn();
    consoleLogMock = mock.fn();
    consoleErrorMock = mock.fn();
    getGitRootMock = mock.fn(() => Promise.resolve("/test/repo"));
    createWorktreeMock = mock.fn(() =>
      Promise.resolve(
        ok({
          message:
            "Created worktree 'feature' at /test/repo/.git/phantom/worktrees/feature",
          path: "/test/repo/.git/phantom/worktrees/feature",
        }),
      ),
    );
    execInWorktreeMock = mock.fn(() => Promise.resolve(ok({ exitCode: 0 })));

    mock.module("node:process", {
      namedExports: {
        exit: exitMock,
        env: { SHELL: "/bin/bash" },
      },
    });

    mock.module("../../core/git/libs/get-git-root.ts", {
      namedExports: {
        getGitRoot: getGitRootMock,
      },
    });

    mock.module("../../core/worktree/create.ts", {
      namedExports: {
        createWorktree: createWorktreeMock,
      },
    });

    mock.module("../../core/process/exec.ts", {
      namedExports: {
        execInWorktree: execInWorktreeMock,
      },
    });

    shellInWorktreeMock = mock.fn();

    mock.module("../../core/process/shell.ts", {
      namedExports: {
        shellInWorktree: shellInWorktreeMock,
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

    const { createHandler } = await import("./create.ts");
    await createHandler(["feature", "--exec", "echo hello"]);

    strictEqual(createWorktreeMock.mock.calls.length, 1);
    strictEqual(createWorktreeMock.mock.calls[0].arguments[0], "/test/repo");
    strictEqual(createWorktreeMock.mock.calls[0].arguments[1], "feature");

    strictEqual(execInWorktreeMock.mock.calls.length, 1);
    strictEqual(execInWorktreeMock.mock.calls[0].arguments[0], "/test/repo");
    strictEqual(execInWorktreeMock.mock.calls[0].arguments[1], "feature");
    const execArgs = execInWorktreeMock.mock.calls[0].arguments[2] as string[];
    strictEqual(execArgs[0], "/bin/bash");
    strictEqual(execArgs[1], "-c");
    strictEqual(execArgs[2], "echo hello");

    strictEqual(consoleLogMock.mock.calls.length, 2);
    strictEqual(
      consoleLogMock.mock.calls[0].arguments[0],
      "Created worktree 'feature' at /test/repo/.git/phantom/worktrees/feature",
    );
    strictEqual(
      consoleLogMock.mock.calls[1].arguments[0],
      "\nExecuting command in worktree 'feature': echo hello",
    );

    strictEqual(exitMock.mock.calls[0].arguments[0], 0);
  });

  it("should handle exec command failure", async () => {
    exitMock = mock.fn();
    consoleLogMock = mock.fn();
    consoleErrorMock = mock.fn();
    getGitRootMock = mock.fn(() => Promise.resolve("/test/repo"));
    createWorktreeMock = mock.fn(() =>
      Promise.resolve(
        ok({
          message:
            "Created worktree 'feature' at /test/repo/.git/phantom/worktrees/feature",
          path: "/test/repo/.git/phantom/worktrees/feature",
        }),
      ),
    );
    execInWorktreeMock = mock.fn(() =>
      Promise.resolve(
        err({
          message: "Command failed",
          exitCode: 1,
        }),
      ),
    );

    mock.module("node:process", {
      namedExports: {
        exit: exitMock,
        env: { SHELL: "/bin/bash" },
      },
    });

    mock.module("../../core/git/libs/get-git-root.ts", {
      namedExports: {
        getGitRoot: getGitRootMock,
      },
    });

    mock.module("../../core/worktree/create.ts", {
      namedExports: {
        createWorktree: createWorktreeMock,
      },
    });

    mock.module("../../core/process/exec.ts", {
      namedExports: {
        execInWorktree: execInWorktreeMock,
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
          generalError: 1,
          validationError: 2,
        },
        exitWithError: mock.fn((message: string, code: number) => {
          if (message) consoleErrorMock(message);
          exitMock(code);
        }),
        exitWithSuccess: mock.fn(() => exitMock(0)),
      },
    });

    const { createHandler } = await import("./create.ts");
    await createHandler(["feature", "--exec", "false"]);

    strictEqual(createWorktreeMock.mock.calls.length, 1);
    strictEqual(execInWorktreeMock.mock.calls.length, 1);
    strictEqual(consoleErrorMock.mock.calls[0].arguments[0], "Command failed");
    strictEqual(exitMock.mock.calls[0].arguments[0], 1);
  });

  it("should error when --shell and --exec are used together", async () => {
    exitMock = mock.fn();
    consoleErrorMock = mock.fn();

    mock.module("node:process", {
      namedExports: {
        exit: exitMock,
      },
    });

    mock.module("../errors.ts", {
      namedExports: {
        exitCodes: {
          generalError: 1,
          validationError: 2,
        },
        exitWithError: mock.fn((message: string, code: number) => {
          consoleErrorMock(`Error: ${message}`);
          exitMock(code);
        }),
        exitWithSuccess: mock.fn(() => exitMock(0)),
      },
    });

    const { createHandler } = await import("./create.ts");
    await createHandler(["feature", "--shell", "--exec", "echo hello"]);

    strictEqual(consoleErrorMock.mock.calls.length, 1);
    strictEqual(
      consoleErrorMock.mock.calls[0].arguments[0],
      "Error: Cannot use --shell and --exec together",
    );
    strictEqual(exitMock.mock.calls[0].arguments[0], 2);
  });

  it("should use /bin/sh when SHELL env var is not set", async () => {
    exitMock = mock.fn();
    consoleLogMock = mock.fn();
    getGitRootMock = mock.fn(() => Promise.resolve("/test/repo"));
    createWorktreeMock = mock.fn(() =>
      Promise.resolve(
        ok({
          message:
            "Created worktree 'feature' at /test/repo/.git/phantom/worktrees/feature",
          path: "/test/repo/.git/phantom/worktrees/feature",
        }),
      ),
    );
    execInWorktreeMock = mock.fn(() => Promise.resolve(ok({ exitCode: 0 })));

    mock.module("node:process", {
      namedExports: {
        exit: exitMock,
        env: {},
      },
    });

    mock.module("../../core/git/libs/get-git-root.ts", {
      namedExports: {
        getGitRoot: getGitRootMock,
      },
    });

    mock.module("../../core/worktree/create.ts", {
      namedExports: {
        createWorktree: createWorktreeMock,
      },
    });

    mock.module("../../core/process/exec.ts", {
      namedExports: {
        execInWorktree: execInWorktreeMock,
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

    const { createHandler } = await import("./create.ts");
    await createHandler(["feature", "--exec", "echo hello"]);

    const execArgs = execInWorktreeMock.mock.calls[0].arguments[2] as string[];
    strictEqual(execArgs[0], "/bin/sh");
  });
});
