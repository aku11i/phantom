import { deepEqual, equal, ok } from "node:assert/strict";
import { describe, it, mock } from "node:test";

const getGitHubRepoInfoMock = mock.fn();
const fetchIssueMock = mock.fn();
const isPullRequestMock = mock.fn();
const checkoutPullRequestMock = mock.fn();
const checkoutIssueMock = mock.fn();

mock.module("./api/index.ts", {
  namedExports: {
    getGitHubRepoInfo: getGitHubRepoInfoMock,
    fetchIssue: fetchIssueMock,
    isPullRequest: isPullRequestMock,
  },
});

mock.module("./checkout/pr.ts", {
  namedExports: {
    checkoutPullRequest: checkoutPullRequestMock,
  },
});

mock.module("./checkout/issue.ts", {
  namedExports: {
    checkoutIssue: checkoutIssueMock,
  },
});

const { githubCheckout } = await import("./checkout.ts");

describe("githubCheckout", () => {
  const resetMocks = () => {
    getGitHubRepoInfoMock.mock.resetCalls();
    fetchIssueMock.mock.resetCalls();
    isPullRequestMock.mock.resetCalls();
    checkoutPullRequestMock.mock.resetCalls();
    checkoutIssueMock.mock.resetCalls();
  };

  it("should export githubCheckout function", () => {
    equal(typeof githubCheckout, "function");
  });

  it("should have correct function signature", () => {
    // Check function accepts 1 required parameter (options), with optional logger parameter
    equal(githubCheckout.length, 1);
  });

  it("should return error when issue/PR not found", async () => {
    resetMocks();
    getGitHubRepoInfoMock.mock.mockImplementation(async () => ({
      owner: "test-owner",
      repo: "test-repo",
    }));
    fetchIssueMock.mock.mockImplementation(async () => null);

    const result = await githubCheckout({ number: "123" });

    ok(result.error);
    equal(
      result.error.message,
      "GitHub issue or pull request #123 not found or you don't have permission to access it.",
    );

    // Verify API calls
    equal(fetchIssueMock.mock.calls.length, 1);
    deepEqual(fetchIssueMock.mock.calls[0].arguments, [
      "test-owner",
      "test-repo",
      "123",
    ]);
  });

  it("should checkout pull request successfully", async () => {
    resetMocks();
    const mockPR = {
      number: 123,
      isFromFork: false,
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
    const mockIssue = {
      number: 123,
      pullRequest: mockPR,
    };

    getGitHubRepoInfoMock.mock.mockImplementation(async () => ({
      owner: "test-owner",
      repo: "test-repo",
    }));
    fetchIssueMock.mock.mockImplementation(async () => mockIssue);
    isPullRequestMock.mock.mockImplementation(() => true);
    checkoutPullRequestMock.mock.mockImplementation(async () => ({
      ok: true,
      value: { message: "Checked out PR #123" },
    }));

    const result = await githubCheckout({ number: "123" });

    ok(result.value);
    equal(result.value.message, "Checked out PR #123");

    // Verify calls
    equal(checkoutPullRequestMock.mock.calls.length, 1);
    equal(checkoutPullRequestMock.mock.calls[0].arguments[0], mockPR);
    equal(checkoutIssueMock.mock.calls.length, 0);
  });

  it("should error when using --base with pull request", async () => {
    resetMocks();
    const mockPR = {
      number: 456,
      isFromFork: false,
      head: {
        ref: "pr-branch",
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
    const mockIssue = {
      number: 456,
      pullRequest: mockPR,
    };

    getGitHubRepoInfoMock.mock.mockImplementation(async () => ({
      owner: "test-owner",
      repo: "test-repo",
    }));
    fetchIssueMock.mock.mockImplementation(async () => mockIssue);
    isPullRequestMock.mock.mockImplementation(() => true);

    const result = await githubCheckout({ number: "456", base: "develop" });

    ok(result.error);
    equal(
      result.error.message,
      "The --base option cannot be used with pull requests. Pull request #456 already has a branch 'pr-branch'.",
    );

    // Should not call checkout functions
    equal(checkoutPullRequestMock.mock.calls.length, 0);
    equal(checkoutIssueMock.mock.calls.length, 0);
  });

  it("should checkout issue successfully without base", async () => {
    resetMocks();
    const mockIssue = {
      number: 789,
    };

    getGitHubRepoInfoMock.mock.mockImplementation(async () => ({
      owner: "test-owner",
      repo: "test-repo",
    }));
    fetchIssueMock.mock.mockImplementation(async () => mockIssue);
    isPullRequestMock.mock.mockImplementation(() => false);
    checkoutIssueMock.mock.mockImplementation(async () => ({
      ok: true,
      value: { message: "Checked out issue #789" },
    }));

    const result = await githubCheckout({ number: "789" });

    ok(result.value);
    equal(result.value.message, "Checked out issue #789");

    // Verify calls
    equal(checkoutIssueMock.mock.calls.length, 1);
    // Check first two arguments (issue and base)
    equal(checkoutIssueMock.mock.calls[0].arguments[0], mockIssue);
    equal(checkoutIssueMock.mock.calls[0].arguments[1], undefined);
    equal(checkoutPullRequestMock.mock.calls.length, 0);
  });

  it("should checkout issue with custom base branch", async () => {
    resetMocks();
    const mockIssue = {
      number: 999,
    };

    getGitHubRepoInfoMock.mock.mockImplementation(async () => ({
      owner: "test-owner",
      repo: "test-repo",
    }));
    fetchIssueMock.mock.mockImplementation(async () => mockIssue);
    isPullRequestMock.mock.mockImplementation(() => false);
    checkoutIssueMock.mock.mockImplementation(async () => ({
      ok: true,
      value: { message: "Checked out issue #999 from develop" },
    }));

    const result = await githubCheckout({ number: "999", base: "develop" });

    ok(result.value);
    equal(result.value.message, "Checked out issue #999 from develop");

    // Verify calls
    equal(checkoutIssueMock.mock.calls.length, 1);
    // Check first two arguments (issue and base)
    equal(checkoutIssueMock.mock.calls[0].arguments[0], mockIssue);
    equal(checkoutIssueMock.mock.calls[0].arguments[1], "develop");
  });

  it("should pass through errors from checkoutPullRequest", async () => {
    resetMocks();
    const mockPR = {
      number: 111,
      isFromFork: false,
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
    const mockIssue = {
      number: 111,
      pullRequest: mockPR,
    };
    const expectedError = new Error("Git error");

    getGitHubRepoInfoMock.mock.mockImplementation(async () => ({
      owner: "test-owner",
      repo: "test-repo",
    }));
    fetchIssueMock.mock.mockImplementation(async () => mockIssue);
    isPullRequestMock.mock.mockImplementation(() => true);
    checkoutPullRequestMock.mock.mockImplementation(async () => ({
      ok: false,
      error: expectedError,
    }));

    const result = await githubCheckout({ number: "111" });

    ok(result.error);
    equal(result.error, expectedError);
  });

  it("should pass through errors from checkoutIssue", async () => {
    resetMocks();
    const mockIssue = {
      number: 222,
    };
    const expectedError = new Error("Permission denied");

    getGitHubRepoInfoMock.mock.mockImplementation(async () => ({
      owner: "test-owner",
      repo: "test-repo",
    }));
    fetchIssueMock.mock.mockImplementation(async () => mockIssue);
    isPullRequestMock.mock.mockImplementation(() => false);
    checkoutIssueMock.mock.mockImplementation(async () => ({
      ok: false,
      error: expectedError,
    }));

    const result = await githubCheckout({ number: "222" });

    ok(result.error);
    equal(result.error, expectedError);
  });
});
