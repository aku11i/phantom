import { equal } from "node:assert/strict";
import { describe, it } from "node:test";
import { isPullRequest } from "./types.ts";

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
