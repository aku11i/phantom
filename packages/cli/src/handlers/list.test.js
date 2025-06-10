import { rejects, strictEqual } from "node:assert";
import { describe, it, mock } from "node:test";
import { err, ok } from "@aku11i/phantom-shared";

const exitMock = mock.fn();
const consoleLogMock = mock.fn();
const consoleErrorMock = mock.fn();
const getGitRootMock = mock.fn();
const listWorktreesCoreMock = mock.fn();
const selectWorktreeWithFzfMock = mock.fn();
const exitWithErrorMock = mock.fn((message, code) => {
  if (message) consoleErrorMock(`Error: ${message}`);
  exitMock(code);
  throw new Error(`Exit with code ${code}: ${message}`);
});

// Mock process module
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
    listWorktrees: listWorktreesCoreMock,
    selectWorktreeWithFzf: selectWorktreeWithFzfMock,
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
    },
    exitWithError: exitWithErrorMock,
  },
});

const { listHandler } = await import("./list.ts");

describe("listHandler", () => {
  const resetMocks = () => {
    exitMock.mock.resetCalls();
    consoleLogMock.mock.resetCalls();
    consoleErrorMock.mock.resetCalls();
    getGitRootMock.mock.resetCalls();
    listWorktreesCoreMock.mock.resetCalls();
    selectWorktreeWithFzfMock.mock.resetCalls();
    exitWithErrorMock.mock.resetCalls();
  };

  it("should list worktrees in default format", async () => {
    resetMocks();
    getGitRootMock.mock.mockImplementation(() => Promise.resolve("/test/repo"));
    listWorktreesCoreMock.mock.mockImplementation(() =>
      Promise.resolve(
        ok({
          worktrees: [
            {
              name: "feature-1",
              path: "/test/repo/.git/phantom/worktrees/feature-1",
              branch: "feature-1",
              isClean: true,
            },
            {
              name: "feature-2",
              path: "/test/repo/.git/phantom/worktrees/feature-2",
              branch: "feature-2",
              isClean: false,
            },
          ],
        }),
      ),
    );

    await rejects(async () => await listHandler([]), /Exit with code 0/);

    strictEqual(getGitRootMock.mock.calls.length, 1);
    strictEqual(listWorktreesCoreMock.mock.calls.length, 1);
    strictEqual(consoleLogMock.mock.calls.length, 2);
    strictEqual(
      consoleLogMock.mock.calls[0].arguments[0],
      "feature-1  (feature-1)",
    );
    strictEqual(
      consoleLogMock.mock.calls[1].arguments[0],
      "feature-2  (feature-2) [dirty]",
    );
    strictEqual(exitMock.mock.calls[0].arguments[0], 0);
  });

  it("should list only worktree names with --names option", async () => {
    resetMocks();
    getGitRootMock.mock.mockImplementation(() => Promise.resolve("/test/repo"));
    listWorktreesCoreMock.mock.mockImplementation(() =>
      Promise.resolve(
        ok({
          worktrees: [
            {
              name: "feature-1",
              path: "/test/repo/.git/phantom/worktrees/feature-1",
              branch: "feature-1",
              isClean: true,
            },
            {
              name: "feature-2",
              path: "/test/repo/.git/phantom/worktrees/feature-2",
              branch: "feature-2",
              isClean: false,
            },
            {
              name: "bugfix-3",
              path: "/test/repo/.git/phantom/worktrees/bugfix-3",
              branch: "bugfix-3",
              isClean: true,
            },
          ],
        }),
      ),
    );

    await rejects(
      async () => await listHandler(["--names"]),
      /Exit with code 0/,
    );

    strictEqual(getGitRootMock.mock.calls.length, 1);
    strictEqual(listWorktreesCoreMock.mock.calls.length, 1);
    strictEqual(consoleLogMock.mock.calls.length, 3);
    strictEqual(consoleLogMock.mock.calls[0].arguments[0], "feature-1");
    strictEqual(consoleLogMock.mock.calls[1].arguments[0], "feature-2");
    strictEqual(consoleLogMock.mock.calls[2].arguments[0], "bugfix-3");
    strictEqual(exitMock.mock.calls[0].arguments[0], 0);
  });

  it("should handle empty worktree list with default format", async () => {
    resetMocks();
    getGitRootMock.mock.mockImplementation(() => Promise.resolve("/test/repo"));
    listWorktreesCoreMock.mock.mockImplementation(() =>
      Promise.resolve(
        ok({
          worktrees: [],
          message: "No worktrees found",
        }),
      ),
    );

    await rejects(async () => await listHandler([]), /Exit with code 0/);

    strictEqual(consoleLogMock.mock.calls.length, 1);
    strictEqual(
      consoleLogMock.mock.calls[0].arguments[0],
      "No worktrees found",
    );
    strictEqual(exitMock.mock.calls[0].arguments[0], 0);
  });

  it("should output nothing for empty worktree list with --names option", async () => {
    resetMocks();
    getGitRootMock.mock.mockImplementation(() => Promise.resolve("/test/repo"));
    listWorktreesCoreMock.mock.mockImplementation(() =>
      Promise.resolve(
        ok({
          worktrees: [],
          message: "No worktrees found",
        }),
      ),
    );

    await rejects(
      async () => await listHandler(["--names"]),
      /Exit with code 0/,
    );

    strictEqual(consoleLogMock.mock.calls.length, 0);
    strictEqual(exitMock.mock.calls[0].arguments[0], 0);
  });

  it("should handle fzf selection", async () => {
    resetMocks();
    getGitRootMock.mock.mockImplementation(() => Promise.resolve("/test/repo"));
    selectWorktreeWithFzfMock.mock.mockImplementation(() =>
      Promise.resolve(
        ok({
          name: "feature-1",
          path: "/test/repo/.git/phantom/worktrees/feature-1",
          branch: "feature-1",
          isClean: true,
        }),
      ),
    );

    await rejects(async () => await listHandler(["--fzf"]), /Exit with code 0/);

    strictEqual(getGitRootMock.mock.calls.length, 1);
    strictEqual(selectWorktreeWithFzfMock.mock.calls.length, 1);
    strictEqual(listWorktreesCoreMock.mock.calls.length, 0);
    strictEqual(consoleLogMock.mock.calls.length, 1);
    strictEqual(consoleLogMock.mock.calls[0].arguments[0], "feature-1");
    strictEqual(exitMock.mock.calls[0].arguments[0], 0);
  });

  it("should handle fzf selection error", async () => {
    resetMocks();
    getGitRootMock.mock.mockImplementation(() => Promise.resolve("/test/repo"));
    selectWorktreeWithFzfMock.mock.mockImplementation(() =>
      Promise.resolve(err({ message: "fzf not found" })),
    );

    await rejects(
      async () => await listHandler(["--fzf"]),
      /Exit with code 1: fzf not found/,
    );

    strictEqual(getGitRootMock.mock.calls.length, 1);
    strictEqual(selectWorktreeWithFzfMock.mock.calls.length, 1);
    strictEqual(consoleErrorMock.mock.calls.length, 1);
    strictEqual(
      consoleErrorMock.mock.calls[0].arguments[0],
      "Error: fzf not found",
    );
    strictEqual(exitMock.mock.calls[0].arguments[0], 1);
  });

  it("should handle listWorktrees error", async () => {
    resetMocks();
    getGitRootMock.mock.mockImplementation(() => Promise.resolve("/test/repo"));
    listWorktreesCoreMock.mock.mockImplementation(() =>
      Promise.resolve(err({ message: "Failed to list worktrees" })),
    );

    await rejects(
      async () => await listHandler([]),
      /Exit with code 1: Failed to list worktrees/,
    );

    strictEqual(getGitRootMock.mock.calls.length, 1);
    strictEqual(listWorktreesCoreMock.mock.calls.length, 1);
    strictEqual(consoleErrorMock.mock.calls.length, 1);
    strictEqual(
      consoleErrorMock.mock.calls[0].arguments[0],
      "Error: Failed to list worktrees",
    );
    strictEqual(exitMock.mock.calls[0].arguments[0], 1);
  });

  it("should handle fzf selection with no result", async () => {
    resetMocks();
    getGitRootMock.mock.mockImplementation(() => Promise.resolve("/test/repo"));
    selectWorktreeWithFzfMock.mock.mockImplementation(() =>
      Promise.resolve(ok(null)),
    );

    await rejects(async () => await listHandler(["--fzf"]), /Exit with code 0/);

    strictEqual(getGitRootMock.mock.calls.length, 1);
    strictEqual(selectWorktreeWithFzfMock.mock.calls.length, 1);
    strictEqual(consoleLogMock.mock.calls.length, 0);
    strictEqual(exitMock.mock.calls[0].arguments[0], 0);
  });
});
