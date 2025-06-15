import { equal } from "node:assert/strict";
import { describe, it } from "node:test";
import { fetchPullRequest } from "./pull-request.ts";

describe("fetchPullRequest", () => {
  it("should export fetchPullRequest function", () => {
    equal(typeof fetchPullRequest, "function");
  });

  it("should have correct function signature", () => {
    // Takes 3 parameters: owner, repo, number
    equal(fetchPullRequest.length, 3);
  });
});
