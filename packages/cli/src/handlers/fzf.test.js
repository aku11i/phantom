import { deepStrictEqual, rejects, strictEqual } from "node:assert";
import { EventEmitter } from "node:events";
import { describe, it, mock } from "node:test";
import { err, ok } from "@aku11i/phantom-shared";

// Create mocks
const exitMock = mock.fn();
const consoleLogMock = mock.fn();
const consoleErrorMock = mock.fn();
const listWorktreesMock = mock.fn();
const getGitRootMock = mock.fn();
const createContextMock = mock.fn();
const spawnMock = mock.fn();
const spawnFzfMock = mock.fn();
const platformMock = mock.fn();
const getClipboardCommandMock = mock.fn();
const getFileManagerCommandMock = mock.fn();
const spawnPhantomCommandMock = mock.fn();

// Mock modules
mock.module("node:process", {
  namedExports: {
    exit: exitMock,
  },
});

mock.module("node:child_process", {
  namedExports: {
    spawn: spawnMock,
  },
});

mock.module("node:os", {
  namedExports: {
    platform: platformMock,
  },
});

mock.module("@aku11i/phantom-core", {
  namedExports: {
    listWorktrees: listWorktreesMock,
    createContext: createContextMock,
  },
});

mock.module("@aku11i/phantom-process", {
  namedExports: {
    spawnFzf: spawnFzfMock,
    getClipboardCommand: getClipboardCommandMock,
    getFileManagerCommand: getFileManagerCommandMock,
    spawnPhantomCommand: spawnPhantomCommandMock,
  },
});

mock.module("@aku11i/phantom-git", {
  namedExports: {
    getGitRoot: getGitRootMock,
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

const exitWithErrorMock = mock.fn((message, code) => {
  if (message) consoleErrorMock(`Error: ${message}`);
  exitMock(code || 1);
  throw new Error(`Exit with code ${code || 1}`);
});

mock.module("../errors.ts", {
  namedExports: {
    exitCodes: {
      success: 0,
      generalError: 1,
      validationError: 2,
    },
    exitWithError: exitWithErrorMock,
  },
});

// Mock exit implementations
const mockExit = (code) => {
  throw new Error(`Exit with code ${code}`);
};

// Import handler after mocks are set up
const { fzfHandler } = await import("./fzf.ts");

const resetMocks = () => {
  exitMock.mock.resetCalls();
  consoleLogMock.mock.resetCalls();
  consoleErrorMock.mock.resetCalls();
  listWorktreesMock.mock.resetCalls();
  getGitRootMock.mock.resetCalls();
  createContextMock.mock.resetCalls();
  spawnMock.mock.resetCalls();
  spawnFzfMock.mock.resetCalls();
  platformMock.mock.resetCalls();
  getClipboardCommandMock.mock.resetCalls();
  getFileManagerCommandMock.mock.resetCalls();
  spawnPhantomCommandMock.mock.resetCalls();
  exitWithErrorMock.mock.resetCalls();
  exitMock.mock.mockImplementation(mockExit);
};

describe("fzfHandler", () => {
  describe("when --help flag is provided", () => {
    it("should display help text", async () => {
      resetMocks();

      await fzfHandler(["--help"]);

      strictEqual(consoleLogMock.mock.calls.length, 1);
      const helpText = consoleLogMock.mock.calls[0].arguments[0];
      strictEqual(
        helpText.includes("Phantom Worktrees - Interactive Interface"),
        true,
      );
      strictEqual(helpText.includes("Keybindings:"), true);
    });
  });

  describe("when no worktrees exist", () => {
    it("should display 'No worktrees found' message", async () => {
      resetMocks();
      getGitRootMock.mock.mockImplementation(() =>
        Promise.resolve("/test/repo"),
      );
      createContextMock.mock.mockImplementation(() =>
        Promise.resolve({
          gitRoot: "/test/repo",
          worktreesDirectory: "/test/repo/.git/phantom/worktrees",
        }),
      );
      listWorktreesMock.mock.mockImplementation(() =>
        Promise.resolve(ok({ worktrees: [] })),
      );

      await fzfHandler([]);

      strictEqual(consoleLogMock.mock.calls.length, 1);
      strictEqual(
        consoleLogMock.mock.calls[0].arguments[0],
        "No worktrees found.",
      );
    });
  });

  describe("when fzf is executed successfully", () => {
    it("should spawn fzf with correct arguments on macOS", async () => {
      resetMocks();
      platformMock.mock.mockImplementation(() => "darwin");
      getClipboardCommandMock.mock.mockImplementation(() => "pbcopy");
      getFileManagerCommandMock.mock.mockImplementation(() => "open");
      getGitRootMock.mock.mockImplementation(() =>
        Promise.resolve("/test/repo"),
      );
      createContextMock.mock.mockImplementation(() =>
        Promise.resolve({
          gitRoot: "/test/repo",
          worktreesDirectory: "/test/repo/.git/phantom/worktrees",
        }),
      );
      listWorktreesMock.mock.mockImplementation(() =>
        Promise.resolve(
          ok({
            worktrees: [
              {
                name: "main",
                path: "/test/repo",
                branch: "main",
                isClean: true,
              },
              {
                name: "feature",
                path: "/test/repo/.git/phantom/worktrees/feature",
                branch: "feature",
                isClean: false,
              },
            ],
          }),
        ),
      );

      // Create a mock fzf process
      const fzfProcess = new EventEmitter();
      fzfProcess.stdout = new EventEmitter();

      spawnFzfMock.mock.mockImplementation(() => fzfProcess);

      // Start the handler
      const handlerPromise = fzfHandler([]);

      // Simulate fzf closing with code 1 (user canceled)
      setImmediate(() => {
        fzfProcess.emit("close", 1);
      });

      await handlerPromise;

      // Verify spawnFzf was called with correct arguments
      strictEqual(spawnFzfMock.mock.calls.length, 1);

      const [items, options] = spawnFzfMock.mock.calls[0].arguments;
      deepStrictEqual(items, ["main (main)", "feature (feature) [dirty]"]);

      strictEqual(options.ansi, true);
      strictEqual(options.layout, "reverse");
      strictEqual(options.border, "rounded");
      strictEqual(options.borderLabel, " Phantom Worktrees ");

      // Verify keybindings include correct commands for macOS
      const ctrlYBinding = options.bindings.find((b) => b.key === "ctrl-y");
      strictEqual(ctrlYBinding.action.includes("pbcopy"), true);

      const ctrlOBinding = options.bindings.find((b) => b.key === "ctrl-o");
      strictEqual(ctrlOBinding.action.includes("open"), true);
    });

    it("should use correct clipboard and file manager commands on Linux", async () => {
      resetMocks();
      platformMock.mock.mockImplementation(() => "linux");
      getClipboardCommandMock.mock.mockImplementation(
        () => "xclip -selection clipboard",
      );
      getFileManagerCommandMock.mock.mockImplementation(() => "xdg-open");
      getGitRootMock.mock.mockImplementation(() =>
        Promise.resolve("/test/repo"),
      );
      createContextMock.mock.mockImplementation(() =>
        Promise.resolve({
          gitRoot: "/test/repo",
          worktreesDirectory: "/test/repo/.git/phantom/worktrees",
        }),
      );
      listWorktreesMock.mock.mockImplementation(() =>
        Promise.resolve(
          ok({
            worktrees: [
              {
                name: "main",
                path: "/test/repo",
                branch: "main",
                isClean: true,
              },
            ],
          }),
        ),
      );

      const fzfProcess = new EventEmitter();
      fzfProcess.stdout = new EventEmitter();

      spawnFzfMock.mock.mockImplementation(() => fzfProcess);

      const handlerPromise = fzfHandler([]);

      setImmediate(() => {
        fzfProcess.emit("close", 130); // Ctrl+C
      });

      await handlerPromise;

      const options = spawnFzfMock.mock.calls[0].arguments[1];

      // Verify Linux-specific commands
      const ctrlYBinding = options.bindings.find((b) => b.key === "ctrl-y");
      strictEqual(
        ctrlYBinding.action.includes("xclip -selection clipboard"),
        true,
      );

      const ctrlOBinding = options.bindings.find((b) => b.key === "ctrl-o");
      strictEqual(ctrlOBinding.action.includes("xdg-open"), true);
    });

    it("should open shell when user selects a worktree", async () => {
      resetMocks();
      platformMock.mock.mockImplementation(() => "darwin");
      getClipboardCommandMock.mock.mockImplementation(() => "pbcopy");
      getFileManagerCommandMock.mock.mockImplementation(() => "open");
      getGitRootMock.mock.mockImplementation(() =>
        Promise.resolve("/test/repo"),
      );
      createContextMock.mock.mockImplementation(() =>
        Promise.resolve({
          gitRoot: "/test/repo",
          worktreesDirectory: "/test/repo/.git/phantom/worktrees",
        }),
      );
      listWorktreesMock.mock.mockImplementation(() =>
        Promise.resolve(
          ok({
            worktrees: [
              {
                name: "feature",
                path: "/test/repo/.git/phantom/worktrees/feature",
                branch: "feature",
                isClean: true,
              },
            ],
          }),
        ),
      );

      const fzfProcess = new EventEmitter();
      fzfProcess.stdin = { write: mock.fn(), end: mock.fn() };
      fzfProcess.stdout = new EventEmitter();

      spawnFzfMock.mock.mockImplementation(() => fzfProcess);

      const handlerPromise = fzfHandler([]);

      // Simulate user selecting "feature"
      setImmediate(() => {
        fzfProcess.stdout.emit("data", "feature (feature)\n");
        fzfProcess.emit("close", 0);
      });

      await handlerPromise;

      // Wait a bit for the shell spawn to happen
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Verify phantom shell was spawned
      strictEqual(spawnPhantomCommandMock.mock.calls.length, 1);
      deepStrictEqual(spawnPhantomCommandMock.mock.calls[0].arguments[0], [
        "shell",
        "feature",
      ]);
    });
  });

  describe("when fzf is not installed", () => {
    it("should exit with appropriate error message", async () => {
      resetMocks();
      platformMock.mock.mockImplementation(() => "darwin");
      getClipboardCommandMock.mock.mockImplementation(() => "pbcopy");
      getFileManagerCommandMock.mock.mockImplementation(() => "open");
      getGitRootMock.mock.mockImplementation(() =>
        Promise.resolve("/test/repo"),
      );
      createContextMock.mock.mockImplementation(() =>
        Promise.resolve({
          gitRoot: "/test/repo",
          worktreesDirectory: "/test/repo/.git/phantom/worktrees",
        }),
      );
      listWorktreesMock.mock.mockImplementation(() =>
        Promise.resolve(
          ok({
            worktrees: [
              {
                name: "main",
                path: "/test/repo",
                branch: "main",
                isClean: true,
              },
            ],
          }),
        ),
      );

      const fzfProcess = new EventEmitter();
      fzfProcess.stdout = new EventEmitter();

      spawnFzfMock.mock.mockImplementation(() => fzfProcess);

      // Start the handler - it will throw due to exitWithError
      await rejects(async () => {
        fzfHandler([]);

        // Need to give the handler time to set up before emitting error
        await new Promise((resolve) => setImmediate(resolve));

        // Simulate fzf not found error
        const error = new Error("spawn fzf ENOENT");
        error.message = "spawn fzf ENOENT";
        fzfProcess.emit("error", error);

        // Wait for the handler to process the error
        await new Promise((resolve) => setImmediate(resolve));
      }, /Exit with code 1/);

      strictEqual(exitWithErrorMock.mock.calls.length, 1);
      strictEqual(
        exitWithErrorMock.mock.calls[0].arguments[0],
        "fzf command not found. Please install fzf first.",
      );
    });
  });
});
