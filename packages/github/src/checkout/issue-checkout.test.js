import { equal } from "node:assert/strict";
import { describe, it } from "node:test";
import { checkoutIssue } from "./issue-checkout.ts";

describe("checkoutIssue", () => {
  it("should export checkoutIssue function", () => {
    equal(typeof checkoutIssue, "function");
  });

  it("should have correct function signature", () => {
    // Takes 3 parameters: issue, number, base (optional)
    equal(checkoutIssue.length, 3);
  });
});
