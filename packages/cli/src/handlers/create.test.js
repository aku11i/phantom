import { rejects, strictEqual } from "node:assert";
import { describe, it, mock } from "node:test";
import {
  ConfigNotFoundError,
  ConfigParseError,
  ConfigValidationError,
  WorktreeAlreadyExistsError,
} from "@aku11i/phantom-core";
import { err, ok } from "@aku11i/phantom-shared";

const exitMock = mock.fn();
const consoleLogMock = mock.fn();
const consoleErrorMock = mock.fn();
const consoleWarnMock = mock.fn();
const getGitRootMock = mock.fn();
const createWorktreeMock = mock.fn();
const execInWorktreeMock = mock.fn();
const shellInWorktreeMock = mock.fn();
const loadConfigMock = mock.fn();
const isInsideTmuxMock = mock.fn();
const executeTmuxCommandMock = mock.fn();
const getPhantomEnvMock = mock.fn();
const exitWithErrorMock = mock.fn((message, code) => {
  if (message) consoleErrorMock(`Error: ${message}`);
  exitMock(code);
  throw new Error(`Exit with code ${code}: ${message}`);
});
const exitWithSuccessMock = mock.fn(() => {
  exitMock(0);
  throw new Error("Exit with code 0");
});

// Mock process module
const processEnvMock = {};
mock.module("node:process", {
  namedExports: {
    exit: exitMock,
    env: processEnvMock,
  },
});

mock.module("@aku11i/phantom-git", {
  namedExports: {
    getGitRoot: getGitRootMock,
  },
});

mock.module("@aku11i/phantom-core", {
  namedExports: {
    createWorktree: createWorktreeMock,
    execInWorktree: execInWorktreeMock,
    shellInWorktree: shellInWorktreeMock,
    loadConfig: loadConfigMock,
    ConfigNotFoundError,
    ConfigParseError,
    ConfigValidationError,
    WorktreeAlreadyExistsError,
  },
});

mock.module("@aku11i/phantom-process", {
  namedExports: {
    isInsideTmux: isInsideTmuxMock,
    executeTmuxCommand: executeTmuxCommandMock,
    getPhantomEnv: getPhantomEnvMock,
  },
});

mock.module("../output.ts", {
  namedExports: {
    output: {
      log: consoleLogMock,
      error: consoleErrorMock,
      warn: consoleWarnMock,
    },
  },
});

mock.module("../errors.ts", {
  namedExports: {
    exitCodes: {
      generalError: 1,
      validationError: 2,
    },
    exitWithError: exitWithErrorMock,
    exitWithSuccess: exitWithSuccessMock,
  },
});

const { createHandler } = await import("./create.ts");

describe("createHandler", () => {
  const resetMocks = () => {
    // Reset all mocks
    exitMock.mock.resetCalls();
    consoleLogMock.mock.resetCalls();
    consoleErrorMock.mock.resetCalls();
    consoleWarnMock.mock.resetCalls();
    getGitRootMock.mock.resetCalls();
    createWorktreeMock.mock.resetCalls();
    execInWorktreeMock.mock.resetCalls();
    shellInWorktreeMock.mock.resetCalls();
    loadConfigMock.mock.resetCalls();
    isInsideTmuxMock.mock.resetCalls();
    executeTmuxCommandMock.mock.resetCalls();
    getPhantomEnvMock.mock.resetCalls();
    exitWithErrorMock.mock.resetCalls();
    exitWithSuccessMock.mock.resetCalls();

    // Clear process env
    for (const key in processEnvMock) {
      delete processEnvMock[key];
    }
  };

  it("should create worktree and execute command with --exec option", async () => {
    resetMocks();
    processEnvMock.SHELL = "/bin/bash";
    getGitRootMock.mock.mockImplementation(() => Promise.resolve("/test/repo"));
    loadConfigMock.mock.mockImplementation(() =>
      Promise.resolve(err(new ConfigNotFoundError())),
    );
    createWorktreeMock.mock.mockImplementation(() =>
      Promise.resolve(
        ok({
          message:
            "Created worktree 'feature' at /test/repo/.git/phantom/worktrees/feature",
          path: "/test/repo/.git/phantom/worktrees/feature",
        }),
      ),
    );
    execInWorktreeMock.mock.mockImplementation(() =>
      Promise.resolve(ok({ exitCode: 0 })),
    );

    await rejects(
      async () => await createHandler(["feature", "--exec", "echo hello"]),
      /Exit with code 0/,
    );

    strictEqual(createWorktreeMock.mock.calls.length, 1);
    strictEqual(createWorktreeMock.mock.calls[0].arguments[0], "/test/repo");
    strictEqual(createWorktreeMock.mock.calls[0].arguments[1], "feature");

    strictEqual(execInWorktreeMock.mock.calls.length, 1);
    strictEqual(execInWorktreeMock.mock.calls[0].arguments[0], "/test/repo");
    strictEqual(execInWorktreeMock.mock.calls[0].arguments[1], "feature");
    const execArgs = execInWorktreeMock.mock.calls[0].arguments[2];
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
    resetMocks();
    processEnvMock.SHELL = "/bin/bash";
    getGitRootMock.mock.mockImplementation(() => Promise.resolve("/test/repo"));
    loadConfigMock.mock.mockImplementation(() =>
      Promise.resolve(err(new ConfigNotFoundError())),
    );
    createWorktreeMock.mock.mockImplementation(() =>
      Promise.resolve(
        ok({
          message:
            "Created worktree 'feature' at /test/repo/.git/phantom/worktrees/feature",
          path: "/test/repo/.git/phantom/worktrees/feature",
        }),
      ),
    );
    execInWorktreeMock.mock.mockImplementation(() =>
      Promise.resolve(
        err({
          message: "Command failed",
          exitCode: 1,
        }),
      ),
    );

    await rejects(
      async () => await createHandler(["feature", "--exec", "false"]),
      /Exit with code 1/,
    );

    strictEqual(createWorktreeMock.mock.calls.length, 1);
    strictEqual(execInWorktreeMock.mock.calls.length, 1);
    strictEqual(
      consoleErrorMock.mock.calls[0].arguments[0],
      "Error: Command failed",
    );
    strictEqual(exitMock.mock.calls[0].arguments[0], 1);
  });

  it("should error when --shell and --exec are used together", async () => {
    resetMocks();
    await rejects(
      async () =>
        await createHandler(["feature", "--shell", "--exec", "echo hello"]),
      /Exit with code 2/,
    );

    strictEqual(consoleErrorMock.mock.calls.length, 1);
    strictEqual(
      consoleErrorMock.mock.calls[0].arguments[0],
      "Error: Cannot use --shell and --exec together",
    );
    strictEqual(exitMock.mock.calls[0].arguments[0], 2);
  });

  it("should use /bin/sh when SHELL env var is not set", async () => {
    resetMocks();
    // No SHELL env var set
    getGitRootMock.mock.mockImplementation(() => Promise.resolve("/test/repo"));
    loadConfigMock.mock.mockImplementation(() =>
      Promise.resolve(err(new ConfigNotFoundError())),
    );
    createWorktreeMock.mock.mockImplementation(() =>
      Promise.resolve(
        ok({
          message:
            "Created worktree 'feature' at /test/repo/.git/phantom/worktrees/feature",
          path: "/test/repo/.git/phantom/worktrees/feature",
        }),
      ),
    );
    execInWorktreeMock.mock.mockImplementation(() =>
      Promise.resolve(ok({ exitCode: 0 })),
    );

    await rejects(
      async () => await createHandler(["feature", "--exec", "echo hello"]),
      /Exit with code 0/,
    );

    const execArgs = execInWorktreeMock.mock.calls[0].arguments[2];
    strictEqual(execArgs[0], "/bin/sh");
  });

  it("should error when --tmux is used outside tmux session", async () => {
    resetMocks();
    isInsideTmuxMock.mock.mockImplementation(() => Promise.resolve(false));

    await rejects(
      async () => await createHandler(["feature", "--tmux"]),
      /Exit with code 2/,
    );

    strictEqual(consoleErrorMock.mock.calls.length, 1);
    strictEqual(
      consoleErrorMock.mock.calls[0].arguments[0],
      "Error: The --tmux option can only be used inside a tmux session",
    );
    strictEqual(exitMock.mock.calls[0].arguments[0], 2);
  });

  it("should create worktree and open in tmux window", async () => {
    resetMocks();
    processEnvMock.SHELL = "/bin/bash";
    processEnvMock.TMUX = "/tmp/tmux-1000/default,12345,0";
    getGitRootMock.mock.mockImplementation(() => Promise.resolve("/test/repo"));
    loadConfigMock.mock.mockImplementation(() =>
      Promise.resolve(err(new ConfigNotFoundError())),
    );
    createWorktreeMock.mock.mockImplementation(() =>
      Promise.resolve(
        ok({
          message:
            "Created worktree 'feature' at /test/repo/.git/phantom/worktrees/feature",
          path: "/test/repo/.git/phantom/worktrees/feature",
        }),
      ),
    );
    isInsideTmuxMock.mock.mockImplementation(() => Promise.resolve(true));
    executeTmuxCommandMock.mock.mockImplementation(() =>
      Promise.resolve(ok({ exitCode: 0 })),
    );
    getPhantomEnvMock.mock.mockImplementation((name, path) => ({
      PHANTOM_NAME: name,
      PHANTOM_PATH: path,
    }));

    await rejects(
      async () => await createHandler(["feature", "--tmux"]),
      /Exit with code 0/,
    );

    strictEqual(createWorktreeMock.mock.calls.length, 1);
    strictEqual(executeTmuxCommandMock.mock.calls.length, 1);

    // Verify tmux command was called with correct arguments
    const tmuxArgs = executeTmuxCommandMock.mock.calls[0].arguments[0];
    strictEqual(tmuxArgs.direction, "new");
    strictEqual(tmuxArgs.cwd, "/test/repo/.git/phantom/worktrees/feature");
    strictEqual(tmuxArgs.windowName, "feature");

    strictEqual(
      consoleLogMock.mock.calls[0].arguments[0],
      "Created worktree 'feature' at /test/repo/.git/phantom/worktrees/feature",
    );
    strictEqual(
      consoleLogMock.mock.calls[1].arguments[0],
      "\nOpening worktree 'feature' in tmux window...",
    );

    strictEqual(exitMock.mock.calls[0].arguments[0], 0);
  });

  it("should create worktree and open in tmux pane with vertical split", async () => {
    resetMocks();
    processEnvMock.SHELL = "/bin/bash";
    processEnvMock.TMUX = "/tmp/tmux-1000/default,12345,0";
    getGitRootMock.mock.mockImplementation(() => Promise.resolve("/test/repo"));
    loadConfigMock.mock.mockImplementation(() =>
      Promise.resolve(err(new ConfigNotFoundError())),
    );
    createWorktreeMock.mock.mockImplementation(() =>
      Promise.resolve(
        ok({
          message:
            "Created worktree 'feature' at /test/repo/.git/phantom/worktrees/feature",
          path: "/test/repo/.git/phantom/worktrees/feature",
        }),
      ),
    );
    isInsideTmuxMock.mock.mockImplementation(() => Promise.resolve(true));
    executeTmuxCommandMock.mock.mockImplementation(() =>
      Promise.resolve(ok({ exitCode: 0 })),
    );
    getPhantomEnvMock.mock.mockImplementation((name, path) => ({
      PHANTOM_NAME: name,
      PHANTOM_PATH: path,
    }));

    await rejects(
      async () => await createHandler(["feature", "--tmux-vertical"]),
      /Exit with code 0/,
    );

    strictEqual(createWorktreeMock.mock.calls.length, 1);
    strictEqual(executeTmuxCommandMock.mock.calls.length, 1);

    // Verify tmux command was called with correct arguments
    const tmuxArgs = executeTmuxCommandMock.mock.calls[0].arguments[0];
    strictEqual(tmuxArgs.direction, "vertical");
    strictEqual(tmuxArgs.cwd, "/test/repo/.git/phantom/worktrees/feature");
    strictEqual(tmuxArgs.windowName, undefined);

    strictEqual(
      consoleLogMock.mock.calls[0].arguments[0],
      "Created worktree 'feature' at /test/repo/.git/phantom/worktrees/feature",
    );
    strictEqual(
      consoleLogMock.mock.calls[1].arguments[0],
      "\nOpening worktree 'feature' in tmux pane...",
    );

    strictEqual(exitMock.mock.calls[0].arguments[0], 0);
  });

  it("should error when multiple action options are used together", async () => {
    resetMocks();
    await rejects(
      async () => await createHandler(["feature", "--shell", "--tmux"]),
      /Exit with code 2/,
    );

    strictEqual(consoleErrorMock.mock.calls.length, 1);
    strictEqual(
      consoleErrorMock.mock.calls[0].arguments[0],
      "Error: Cannot use --shell, --exec, and --tmux options together",
    );
    strictEqual(exitMock.mock.calls[0].arguments[0], 2);
  });
});
