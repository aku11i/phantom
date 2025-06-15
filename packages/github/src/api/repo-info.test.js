import { equal } from "node:assert/strict";
import { describe, it } from "node:test";
import { getGitHubRepoInfo } from "./repo-info.ts";

describe("getGitHubRepoInfo", () => {
  it("should export getGitHubRepoInfo function", () => {
    equal(typeof getGitHubRepoInfo, "function");
  });
});
