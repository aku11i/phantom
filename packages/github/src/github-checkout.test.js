import { equal, ok } from "node:assert/strict";
import { describe, it } from "node:test";
import { githubCheckout } from "./github-checkout.ts";

describe("githubCheckout", () => {
  it("should export githubCheckout function", () => {
    equal(typeof githubCheckout, "function");
  });

  it("should have correct function signature", () => {
    // Check function accepts 1 parameter
    equal(githubCheckout.length, 1);
  });
});
