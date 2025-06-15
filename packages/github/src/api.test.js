import { equal } from "node:assert/strict";
import { describe, it } from "node:test";
import { fetchIssue, fetchPullRequest, getGitHubRepoInfo } from "./api.ts";

describe("api", () => {
  describe("getGitHubRepoInfo", () => {
    it("should export getGitHubRepoInfo function", () => {
      equal(typeof getGitHubRepoInfo, "function");
    });
  });

  describe("fetchPullRequest", () => {
    it("should export fetchPullRequest function", () => {
      equal(typeof fetchPullRequest, "function");
    });

    it("should have correct function signature", () => {
      // Takes 3 parameters: owner, repo, number
      equal(fetchPullRequest.length, 3);
    });
  });

  describe("fetchIssue", () => {
    it("should export fetchIssue function", () => {
      equal(typeof fetchIssue, "function");
    });

    it("should have correct function signature", () => {
      // Takes 3 parameters: owner, repo, number
      equal(fetchIssue.length, 3);
    });
  });
});
