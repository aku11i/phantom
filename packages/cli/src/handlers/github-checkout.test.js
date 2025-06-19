import { equal } from "node:assert/strict";
import { describe, it, mock } from "node:test";
import { exitCodes } from "../errors.ts";
import { githubCheckoutHandler } from "./github-checkout.ts";

describe("githubCheckoutHandler", () => {
  it("should export githubCheckoutHandler function", () => {
    equal(typeof githubCheckoutHandler, "function");
  });

  it("should have correct function signature", () => {
    // Check function accepts 1 parameter (args array)
    equal(githubCheckoutHandler.length, 1);
  });

  it("should exit with error when number is not provided", async () => {
    const mockExit = mock.method(process, "exit", () => {
      throw new Error("Process exited");
    });

    try {
      await githubCheckoutHandler([]);
    } catch {
      // Expected to throw due to mocked process.exit
    }

    equal(mockExit.mock.calls.length, 1);
    equal(mockExit.mock.calls[0].arguments[0], exitCodes.validationError);
    mockExit.mock.restore();
  });

  it("should exit with error when only base option is provided", async () => {
    const mockExit = mock.method(process, "exit", () => {
      throw new Error("Process exited");
    });

    try {
      await githubCheckoutHandler(["--base", "develop"]);
    } catch {
      // Expected to throw due to mocked process.exit
    }

    equal(mockExit.mock.calls.length, 1);
    equal(mockExit.mock.calls[0].arguments[0], exitCodes.validationError);
    mockExit.mock.restore();
  });
});
