import { equal } from "node:assert/strict";
import { describe, it } from "node:test";
import { checkoutPullRequest } from "./pr.ts";

describe("checkoutPullRequest", () => {
  it("should export checkoutPullRequest function", () => {
    equal(typeof checkoutPullRequest, "function");
  });

  it("should have correct function signature", () => {
    // Takes 1 parameter: pullRequest
    equal(checkoutPullRequest.length, 1);
  });
});
