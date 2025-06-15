import { equal } from "node:assert/strict";
import { describe, it } from "node:test";
import { checkoutPullRequest } from "./pr-checkout.ts";

describe("checkoutPullRequest", () => {
  it("should export checkoutPullRequest function", () => {
    equal(typeof checkoutPullRequest, "function");
  });

  it("should have correct function signature", () => {
    // Takes 2 parameters: pullRequest, number
    equal(checkoutPullRequest.length, 2);
  });
});
