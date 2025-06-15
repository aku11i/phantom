import { deepEqual, equal, ok } from "node:assert/strict";
import { describe, it, mock } from "node:test";

const getGitRootMock = mock.fn();
const fetchMock = mock.fn();
const attachWorktreeCoreMock = mock.fn();

// Mock the WorktreeAlreadyExistsError class
class MockWorktreeAlreadyExistsError extends Error {
  constructor(message) {
    super(message);
    this.name = "WorktreeAlreadyExistsError";
  }
}

mock.module("@aku11i/phantom-git", {
  namedExports: {
    getGitRoot: getGitRootMock,
    fetch: fetchMock,
  },
});

mock.module("@aku11i/phantom-core", {
  namedExports: {
    attachWorktreeCore: attachWorktreeCoreMock,
    WorktreeAlreadyExistsError: MockWorktreeAlreadyExistsError,
  },
});

const { checkoutPullRequest } = await import("./pr.ts");

describe("checkoutPullRequest", () => {
  const resetMocks = () => {
    getGitRootMock.mock.resetCalls();
    fetchMock.mock.resetCalls();
    attachWorktreeCoreMock.mock.resetCalls();
  };

  it("should export checkoutPullRequest function", () => {
    equal(typeof checkoutPullRequest, "function");
  });

  it("should have correct function signature", () => {
    // Takes 1 parameter: pullRequest
    equal(checkoutPullRequest.length, 1);
  });

  it("should checkout pull request successfully", async () => {
    resetMocks();
    const mockGitRoot = "/path/to/repo";
    const mockPullRequest = {
      number: 123,
      head: {
        ref: "feature-branch",
        repo: {
          full_name: "owner/repo",
        },
      },
      base: {
        repo: {
          full_name: "owner/repo",
        },
      },
    };

    getGitRootMock.mock.mockImplementation(async () => mockGitRoot);
    fetchMock.mock.mockImplementation(async () => ({
      ok: true,
      value: undefined,
    }));
    attachWorktreeCoreMock.mock.mockImplementation(async () => ({
      ok: true,
      value: "/path/to/repo/.git/phantom/worktrees/pr-123",
    }));

    const result = await checkoutPullRequest(mockPullRequest);

    ok(result.value);
    equal(
      result.value.message,
      "Checked out PR #123 from branch feature-branch",
    );
    equal(result.value.alreadyExists, undefined);

    // Verify mocks were called correctly
    equal(getGitRootMock.mock.calls.length, 1);
    equal(fetchMock.mock.calls.length, 1);
    equal(attachWorktreeCoreMock.mock.calls.length, 1);

    // Verify fetch was called with correct refspec
    const fetchOptions = fetchMock.mock.calls[0].arguments[0];
    equal(fetchOptions.refspec, "pull/123/head:pr-123");

    // Verify attach was called with correct parameters
    const [gitRoot, worktreeName] =
      attachWorktreeCoreMock.mock.calls[0].arguments;
    equal(gitRoot, mockGitRoot);
    equal(worktreeName, "pr-123");
  });

  it("should handle when worktree already exists", async () => {
    resetMocks();
    const mockGitRoot = "/path/to/repo";
    const mockPullRequest = {
      number: 456,
      head: {
        ref: "existing-branch",
        repo: {
          full_name: "owner/repo",
        },
      },
      base: {
        repo: {
          full_name: "owner/repo",
        },
      },
    };

    getGitRootMock.mock.mockImplementation(async () => mockGitRoot);
    fetchMock.mock.mockImplementation(async () => ({
      ok: true,
      value: undefined,
    }));
    attachWorktreeCoreMock.mock.mockImplementation(async () => ({
      ok: false,
      error: new MockWorktreeAlreadyExistsError("Worktree already exists"),
    }));

    const result = await checkoutPullRequest(mockPullRequest);

    ok(result.value);
    equal(result.value.message, "Worktree for PR #456 is already checked out");
    equal(result.value.alreadyExists, true);
  });

  it("should pass through other errors", async () => {
    resetMocks();
    const mockGitRoot = "/path/to/repo";
    const mockPullRequest = {
      number: 789,
      head: {
        ref: "error-branch",
        repo: {
          full_name: "owner/repo",
        },
      },
      base: {
        repo: {
          full_name: "owner/repo",
        },
      },
    };

    getGitRootMock.mock.mockImplementation(async () => mockGitRoot);
    fetchMock.mock.mockImplementation(async () => ({
      ok: true,
      value: undefined,
    }));
    const expectedError = new Error("Some git error");
    attachWorktreeCoreMock.mock.mockImplementation(async () => ({
      ok: false,
      error: expectedError,
    }));

    const result = await checkoutPullRequest(mockPullRequest);

    ok(result.error);
    equal(result.error, expectedError);
  });

  it("should use correct worktree naming", async () => {
    resetMocks();
    const mockGitRoot = "/path/to/repo";
    const mockPullRequest = {
      number: 999,
      head: {
        ref: "test-branch",
        repo: {
          full_name: "owner/repo",
        },
      },
      base: {
        repo: {
          full_name: "owner/repo",
        },
      },
    };

    getGitRootMock.mock.mockImplementation(async () => mockGitRoot);
    fetchMock.mock.mockImplementation(async () => ({
      ok: true,
      value: undefined,
    }));
    attachWorktreeCoreMock.mock.mockImplementation(async () => ({
      ok: true,
      value: "/path/to/repo/.git/phantom/worktrees/pr-999",
    }));

    await checkoutPullRequest(mockPullRequest);

    const [, worktreeName] = attachWorktreeCoreMock.mock.calls[0].arguments;
    equal(worktreeName, "pr-999");
  });

  it("should handle forked pull requests", async () => {
    resetMocks();
    const mockGitRoot = "/path/to/repo";
    const mockPullRequest = {
      number: 1234,
      head: {
        ref: "fork-feature",
        repo: {
          full_name: "contributor/fork-repo",
        },
      },
      base: {
        repo: {
          full_name: "owner/original-repo",
        },
      },
    };

    getGitRootMock.mock.mockImplementation(async () => mockGitRoot);
    fetchMock.mock.mockImplementation(async () => ({
      ok: true,
      value: undefined,
    }));
    attachWorktreeCoreMock.mock.mockImplementation(async () => ({
      ok: true,
      value: "/path/to/repo/.git/phantom/worktrees/pr-1234",
    }));

    const result = await checkoutPullRequest(mockPullRequest);

    ok(result.value);
    equal(result.value.message, "Checked out PR #1234 from fork contributor/fork-repo");

    // Verify it uses the same refspec for forked PRs
    const fetchOptions = fetchMock.mock.calls[0].arguments[0];
    equal(fetchOptions.refspec, "pull/1234/head:pr-1234");
    
    const [, worktreeName] = attachWorktreeCoreMock.mock.calls[0].arguments;
    equal(worktreeName, "pr-1234");
  });

  it("should handle fetch errors", async () => {
    resetMocks();
    const mockGitRoot = "/path/to/repo";
    const mockPullRequest = {
      number: 555,
      head: {
        ref: "missing-branch",
        repo: {
          full_name: "owner/repo",
        },
      },
      base: {
        repo: {
          full_name: "owner/repo",
        },
      },
    };

    getGitRootMock.mock.mockImplementation(async () => mockGitRoot);
    fetchMock.mock.mockImplementation(async () => ({
      ok: false,
      error: new Error("Could not find remote ref"),
    }));

    const result = await checkoutPullRequest(mockPullRequest);

    ok(result.error);
    ok(result.error.message.includes("Failed to fetch PR #555"));
    ok(result.error.message.includes("Could not find remote ref"));
  });
});
