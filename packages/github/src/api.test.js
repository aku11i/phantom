import { equal } from "node:assert/strict";
import { describe, it } from "node:test";
import {
  fetchIssue,
  fetchPullRequest,
  getGitHubRepoInfo,
  isPullRequest,
} from "./api.ts";

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

  describe("isPullRequest", () => {
    it("should export isPullRequest function", () => {
      equal(typeof isPullRequest, "function");
    });

    it("should return true for issues with pullRequest", () => {
      const issueWithPR = {
        number: 123,
        pullRequest: {
          number: 123,
          head: { ref: "feature-branch" },
        },
      };
      equal(isPullRequest(issueWithPR), true);
    });

    it("should return false for issues without pullRequest", () => {
      const pureIssue = {
        number: 124,
      };
      equal(isPullRequest(pureIssue), false);
    });

    it("should work as type guard", () => {
      const issue = {
        number: 125,
        pullRequest: {
          number: 125,
          head: { ref: "feature" },
        },
      };
      
      if (isPullRequest(issue)) {
        // TypeScript should know pullRequest is defined here
        equal(issue.pullRequest.number, 125);
      }
    });
  });
});
