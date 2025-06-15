import { deepEqual, equal, ok } from "node:assert/strict";
import { describe, it, mock } from "node:test";

const getGitRootMock = mock.fn();
const createWorktreeCoreMock = mock.fn();

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
  },
});

mock.module("@aku11i/phantom-core", {
  namedExports: {
    createWorktree: createWorktreeCoreMock,
    WorktreeAlreadyExistsError: MockWorktreeAlreadyExistsError,
  },
});

const { checkoutPullRequest } = await import("./pr.ts");

describe("checkoutPullRequest", () => {
  const resetMocks = () => {
    getGitRootMock.mock.resetCalls();
    createWorktreeCoreMock.mock.resetCalls();
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
    createWorktreeCoreMock.mock.mockImplementation(async () => ({
      ok: true,
      value: {
        message:
          "Created worktree pr-123 and checked out branch feature-branch",
      },
    }));

    const result = await checkoutPullRequest(mockPullRequest);

    ok(result.value);
    equal(
      result.value.message,
      "Created worktree pr-123 and checked out branch feature-branch",
    );
    equal(result.value.alreadyExists, undefined);

    // Verify mocks were called correctly
    equal(getGitRootMock.mock.calls.length, 1);
    equal(createWorktreeCoreMock.mock.calls.length, 1);

    const [gitRoot, worktreeName, options] =
      createWorktreeCoreMock.mock.calls[0].arguments;
    equal(gitRoot, mockGitRoot);
    equal(worktreeName, "pr-123");
    deepEqual(options, {
      branch: "feature-branch",
      base: "origin/feature-branch",
    });
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
    createWorktreeCoreMock.mock.mockImplementation(async () => ({
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
    const expectedError = new Error("Some git error");
    createWorktreeCoreMock.mock.mockImplementation(async () => ({
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
    createWorktreeCoreMock.mock.mockImplementation(async () => ({
      ok: true,
      value: {
        message: "Success",
      },
    }));

    await checkoutPullRequest(mockPullRequest);

    const [, worktreeName] = createWorktreeCoreMock.mock.calls[0].arguments;
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
    createWorktreeCoreMock.mock.mockImplementation(async () => ({
      ok: true,
      value: {
        message: "Created worktree pr-1234 for forked PR",
      },
    }));

    const result = await checkoutPullRequest(mockPullRequest);

    ok(result.value);
    equal(result.value.message, "Created worktree pr-1234 for forked PR");

    // Verify it uses the special GitHub ref for forked PRs
    const [, worktreeName, options] =
      createWorktreeCoreMock.mock.calls[0].arguments;
    equal(worktreeName, "pr-1234");
    deepEqual(options, {
      branch: "pr-1234",
      base: "origin/pull/1234/head",
    });
  });
});
