import { equal, rejects } from "node:assert/strict";
import { describe, it } from "node:test";
import { githubCheckoutHandler } from "./github-checkout.ts";

describe("githubCheckoutHandler", () => {
  it("should export githubCheckoutHandler function", () => {
    equal(typeof githubCheckoutHandler, "function");
  });

  it("should have correct function signature", () => {
    // Check function accepts 1 parameter (args array)
    equal(githubCheckoutHandler.length, 1);
  });

  it("should throw error when number is not provided", async () => {
    await rejects(
      githubCheckoutHandler([]),
      /Please specify a PR or issue number/,
    );
  });

  it("should throw error when only base option is provided", async () => {
    await rejects(
      githubCheckoutHandler(["--base", "develop"]),
      /Please specify a PR or issue number/,
    );
  });
});
