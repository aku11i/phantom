import { equal } from "node:assert/strict";
import { describe, it } from "node:test";
import { fetchIssue } from "./issue.ts";

describe("fetchIssue", () => {
  it("should export fetchIssue function", () => {
    equal(typeof fetchIssue, "function");
  });

  it("should have correct function signature", () => {
    // Takes 3 parameters: owner, repo, number
    equal(fetchIssue.length, 3);
  });
});
