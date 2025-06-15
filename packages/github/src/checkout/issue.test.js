import { equal } from "node:assert/strict";
import { describe, it } from "node:test";
import { checkoutIssue } from "./issue.ts";

describe("checkoutIssue", () => {
  it("should export checkoutIssue function", () => {
    equal(typeof checkoutIssue, "function");
  });

  it("should have correct function signature", () => {
    // Takes 2 parameters: issue, base (optional)
    equal(checkoutIssue.length, 2);
  });
});
