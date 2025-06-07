import { rejects } from "node:assert";
import { beforeEach, describe, it, mock } from "node:test";
import { err, ok } from "../../core/types/result.ts";

const exitMock = mock.fn();
const outputLogMock = mock.fn();
const outputErrorMock = mock.fn();
const exitWithErrorMock = mock.fn((message, code) => {
  throw new Error(`Exit with code ${code}: ${message}`);
});
const getGitRootMock = mock.fn();
const listWorktreesMock = mock.fn();
const deleteWorktreeMock = mock.fn();
const checkFzfAvailableMock = mock.fn();
const selectWorktreeWithFzfMock = mock.fn();

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

mock.module("../../core/worktree/list.ts", {
  namedExports: {
    listWorktrees: listWorktreesMock,
  },
});

mock.module("../../core/worktree/delete.ts", {
  namedExports: {
    deleteWorktree: deleteWorktreeMock,
  },
});

mock.module("../../core/process/fzf.ts", {
  namedExports: {
    checkFzfAvailable: checkFzfAvailableMock,
    selectWorktreeWithFzf: selectWorktreeWithFzfMock,
  },
});

mock.module("../errors.ts", {
  namedExports: {
    exitWithError: exitWithErrorMock,
    exitCodes: {
      success: 0,
      generalError: 1,
      validationError: 3,
    },
  },
});

mock.module("../output.ts", {
  namedExports: {
    output: {
      log: outputLogMock,
      error: outputErrorMock,
    },
  },
});

const { listHandler } = await import("./list.ts");

describe("listHandler", () => {
  const mockWorktrees = [
    {
      name: "feature-1",
      path: "/path/to/feature-1",
      branch: "feature/branch-1",
      isClean: true,
    },
    {
      name: "feature-2",
      path: "/path/to/feature-2",
      branch: "feature/branch-2",
      isClean: false,
    },
  ];

  beforeEach(() => {
    getGitRootMock.mock.mockImplementation(() =>
      Promise.resolve("/path/to/repo"),
    );
    listWorktreesMock.mock.mockImplementation(() =>
      Promise.resolve(ok({ worktrees: mockWorktrees })),
    );
    exitMock.mock.mockImplementation(() => {
      throw new Error("process.exit called");
    });
  });

  describe("basic listing", () => {
    it("should list worktrees without flags", async () => {
      await rejects(listHandler([]), /process\.exit called/);

      const logCalls = outputLogMock.mock.calls;
      const hasFeature1 = logCalls.some(
        (call) => call.arguments[0] === "feature-1  (feature/branch-1)",
      );
      const hasFeature2 = logCalls.some(
        (call) => call.arguments[0] === "feature-2  (feature/branch-2) [dirty]",
      );

      if (!hasFeature1 || !hasFeature2) {
        throw new Error("Expected worktrees not logged");
      }

      const exitCall = exitMock.mock.calls[0];
      if (exitCall.arguments[0] !== 0) {
        throw new Error(`Expected exit code 0, got ${exitCall.arguments[0]}`);
      }
    });

    it("should handle empty worktree list", async () => {
      listWorktreesMock.mock.mockImplementation(() =>
        Promise.resolve(ok({ worktrees: [], message: "No worktrees found" })),
      );

      await rejects(listHandler([]), /process\.exit called/);

      const logCalls = outputLogMock.mock.calls;
      const hasMessage = logCalls.some(
        (call) => call.arguments[0] === "No worktrees found",
      );

      if (!hasMessage) {
        throw new Error("Expected 'No worktrees found' message not logged");
      }

      const exitCall = exitMock.mock.calls[0];
      if (exitCall.arguments[0] !== 0) {
        throw new Error(`Expected exit code 0, got ${exitCall.arguments[0]}`);
      }
    });
  });

  describe("fzf integration", () => {
    beforeEach(() => {
      checkFzfAvailableMock.mock.mockImplementation(() =>
        Promise.resolve(true),
      );
    });

    it("should use fzf when --fzf flag is provided", async () => {
      selectWorktreeWithFzfMock.mock.mockImplementation(() =>
        Promise.resolve(ok({ selected: [mockWorktrees[0]] })),
      );

      await rejects(listHandler(["--fzf"]), /process\.exit called/);

      if (checkFzfAvailableMock.mock.calls.length !== 1) {
        throw new Error("checkFzfAvailable should be called once");
      }

      if (selectWorktreeWithFzfMock.mock.calls.length !== 1) {
        throw new Error("selectWorktreeWithFzf should be called once");
      }

      const selectCall = selectWorktreeWithFzfMock.mock.calls[0];
      if (selectCall.arguments[1].multiSelect !== false) {
        throw new Error("Expected multiSelect to be false");
      }
      if (selectCall.arguments[1].prompt !== "Select worktree: ") {
        throw new Error("Expected prompt to be 'Select worktree: '");
      }

      const logCalls = outputLogMock.mock.calls;
      const hasPath = logCalls.some(
        (call) => call.arguments[0] === "/path/to/feature-1",
      );

      if (!hasPath) {
        throw new Error("Expected worktree path not logged");
      }

      const exitCall = exitMock.mock.calls[0];
      if (exitCall.arguments[0] !== 0) {
        throw new Error(`Expected exit code 0, got ${exitCall.arguments[0]}`);
      }
    });

    it("should handle -f short flag", async () => {
      selectWorktreeWithFzfMock.mock.mockImplementation(() =>
        Promise.resolve(ok({ selected: [mockWorktrees[0]] })),
      );

      await rejects(listHandler(["-f"]), /process\.exit called/);

      if (selectWorktreeWithFzfMock.mock.calls.length !== 1) {
        throw new Error("selectWorktreeWithFzf should be called once");
      }
    });

    it("should error when fzf is not available", async () => {
      checkFzfAvailableMock.mock.mockImplementation(() =>
        Promise.resolve(false),
      );

      await rejects(listHandler(["--fzf"]), /Exit with code/);

      if (exitWithErrorMock.mock.calls.length !== 1) {
        throw new Error("exitWithError should be called once");
      }

      const errorCall = exitWithErrorMock.mock.calls[0];
      if (!errorCall.arguments[0].includes("fzf is not installed")) {
        throw new Error("Expected 'fzf is not installed' error message");
      }
      if (errorCall.arguments[1] !== 3) {
        throw new Error(`Expected exit code 3, got ${errorCall.arguments[1]}`);
      }
    });

    it("should handle fzf cancellation", async () => {
      selectWorktreeWithFzfMock.mock.mockImplementation(() =>
        Promise.resolve(ok({ selected: [] })),
      );

      await rejects(listHandler(["--fzf"]), /process\.exit called/);

      const logCalls = outputLogMock.mock.calls;
      const hasMessage = logCalls.some(
        (call) => call.arguments[0] === "No worktree selected.",
      );

      if (!hasMessage) {
        throw new Error("Expected 'No worktree selected.' message not logged");
      }

      const exitCall = exitMock.mock.calls[0];
      if (exitCall.arguments[0] !== 0) {
        throw new Error(`Expected exit code 0, got ${exitCall.arguments[0]}`);
      }
    });
  });

  describe("delete mode", () => {
    beforeEach(() => {
      checkFzfAvailableMock.mock.mockImplementation(() =>
        Promise.resolve(true),
      );
    });

    it("should error when --delete is used without --fzf", async () => {
      await rejects(listHandler(["--delete"]), /Exit with code/);

      if (exitWithErrorMock.mock.calls.length !== 1) {
        throw new Error("exitWithError should be called once");
      }

      const errorCall = exitWithErrorMock.mock.calls[0];
      if (
        !errorCall.arguments[0].includes(
          "--delete flag can only be used with --fzf",
        )
      ) {
        throw new Error(
          "Expected '--delete flag can only be used with --fzf' error message",
        );
      }
      if (errorCall.arguments[1] !== 3) {
        throw new Error(`Expected exit code 3, got ${errorCall.arguments[1]}`);
      }
    });

    it("should delete selected worktrees with --fzf --delete", async () => {
      selectWorktreeWithFzfMock.mock.mockImplementation(() =>
        Promise.resolve(ok({ selected: mockWorktrees })),
      );
      deleteWorktreeMock.mock.mockImplementation(() =>
        Promise.resolve(ok({ message: "Deleted" })),
      );

      await rejects(listHandler(["--fzf", "--delete"]), /process\.exit called/);

      const selectCall = selectWorktreeWithFzfMock.mock.calls[0];
      if (selectCall.arguments[1].multiSelect !== true) {
        throw new Error("Expected multiSelect to be true");
      }
      if (selectCall.arguments[1].prompt !== "Select worktree(s) to delete: ") {
        throw new Error(
          "Expected prompt to be 'Select worktree(s) to delete: '",
        );
      }

      if (deleteWorktreeMock.mock.calls.length !== 2) {
        throw new Error("deleteWorktree should be called twice");
      }

      const logCalls = outputLogMock.mock.calls;
      const hasDeletedFeature1 = logCalls.some(
        (call) => call.arguments[0] === "✓ Deleted: feature-1",
      );
      const hasDeletedFeature2 = logCalls.some(
        (call) => call.arguments[0] === "✓ Deleted: feature-2",
      );

      if (!hasDeletedFeature1 || !hasDeletedFeature2) {
        throw new Error("Expected deletion success messages not logged");
      }

      const exitCall = exitMock.mock.calls[0];
      if (exitCall.arguments[0] !== 0) {
        throw new Error(`Expected exit code 0, got ${exitCall.arguments[0]}`);
      }
    });

    it("should handle deletion errors", async () => {
      selectWorktreeWithFzfMock.mock.mockImplementation(() =>
        Promise.resolve(ok({ selected: [mockWorktrees[0]] })),
      );
      deleteWorktreeMock.mock.mockImplementation(() =>
        Promise.resolve(err(new Error("Failed to delete"))),
      );

      await rejects(listHandler(["--fzf", "--delete"]), /process\.exit called/);

      const errorCalls = outputErrorMock.mock.calls;
      const hasError = errorCalls.some((call) =>
        call.arguments[0].includes("Failed to delete feature-1"),
      );

      if (!hasError) {
        throw new Error("Expected deletion error message not logged");
      }

      const exitCall = exitMock.mock.calls[0];
      if (exitCall.arguments[0] !== 1) {
        throw new Error(`Expected exit code 1, got ${exitCall.arguments[0]}`);
      }
    });

    it("should handle -d short flag", async () => {
      selectWorktreeWithFzfMock.mock.mockImplementation(() =>
        Promise.resolve(ok({ selected: [] })),
      );

      await rejects(listHandler(["-f", "-d"]), /process\.exit called/);

      const selectCall = selectWorktreeWithFzfMock.mock.calls[0];
      if (selectCall.arguments[1].multiSelect !== true) {
        throw new Error("Expected multiSelect to be true");
      }
    });
  });
});
