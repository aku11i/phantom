import { deepEqual, equal } from "node:assert/strict";
import { describe, it, mock } from "node:test";

const createGitHubClientMock = mock.fn();
let mockOctokit;

mock.module("../client.ts", {
  namedExports: {
    createGitHubClient: createGitHubClientMock,
  },
});

const { fetchPullRequest } = await import("./pull-request.ts");

describe("fetchPullRequest", () => {
  const resetMocks = () => {
    createGitHubClientMock.mock.resetCalls();
    mockOctokit = undefined;
  };

  it("should export fetchPullRequest function", () => {
    equal(typeof fetchPullRequest, "function");
  });

  it("should have correct function signature", () => {
    // Takes 3 parameters: owner, repo, number
    equal(fetchPullRequest.length, 3);
  });

  it("should fetch pull request successfully", async () => {
    resetMocks();
    mockOctokit = {
      pulls: {
        get: mock.fn(async () => ({
          data: {
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
          },
        })),
      },
    };
    createGitHubClientMock.mock.mockImplementation(async () => mockOctokit);

    const result = await fetchPullRequest("owner", "repo", "123");
    deepEqual(result, {
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
    });

    equal(mockOctokit.pulls.get.mock.calls.length, 1);
    deepEqual(mockOctokit.pulls.get.mock.calls[0].arguments[0], {
      owner: "owner",
      repo: "repo",
      pull_number: 123,
    });
  });

  it("should return null when pull request not found", async () => {
    resetMocks();
    mockOctokit = {
      pulls: {
        get: mock.fn(async () => {
          const error = new Error("Not found");
          error.status = 404;
          throw error;
        }),
      },
    };
    createGitHubClientMock.mock.mockImplementation(async () => mockOctokit);

    const result = await fetchPullRequest("owner", "repo", "123");
    equal(result, null);
  });

  it("should throw error for non-404 errors", async () => {
    resetMocks();
    mockOctokit = {
      pulls: {
        get: mock.fn(async () => {
          throw new Error("API Error");
        }),
      },
    };
    createGitHubClientMock.mock.mockImplementation(async () => mockOctokit);

    try {
      await fetchPullRequest("owner", "repo", "123");
      throw new Error("Should have thrown");
    } catch (error) {
      equal(error.message, "API Error");
    }
  });

  it("should parse string number to integer", async () => {
    resetMocks();
    mockOctokit = {
      pulls: {
        get: mock.fn(async () => ({
          data: {
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
          },
        })),
      },
    };
    createGitHubClientMock.mock.mockImplementation(async () => mockOctokit);

    await fetchPullRequest("owner", "repo", "123");
    
    deepEqual(mockOctokit.pulls.get.mock.calls[0].arguments[0], {
      owner: "owner",
      repo: "repo",
      pull_number: 123, // Should be parsed to integer
    });
  });
});
