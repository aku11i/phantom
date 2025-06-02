import { strictEqual } from "node:assert";
import { describe, it } from "node:test";
import { getPhantomDirectory, getWorktreePath } from "./paths.ts";

describe("paths", () => {
  describe("getPhantomDirectory", () => {
    it("should return correct phantom directory path", () => {
      const gitRoot = "/test/repo";
      const result = getPhantomDirectory(gitRoot);
      strictEqual(result, "/test/repo/.git/phantom/worktrees");
    });

    it("should handle git root with trailing slash", () => {
      const gitRoot = "/test/repo/";
      const result = getPhantomDirectory(gitRoot);
      strictEqual(result, "/test/repo/.git/phantom/worktrees");
    });

    it("should handle Windows-style paths", () => {
      const gitRoot = "C:\\test\\repo";
      const result = getPhantomDirectory(gitRoot);
      // path.join normalizes separators based on the platform
      strictEqual(result.includes(".git"), true);
      strictEqual(result.includes("phantom"), true);
      strictEqual(result.includes("worktrees"), true);
    });
  });

  describe("getWorktreePath", () => {
    it("should return correct worktree path", () => {
      const gitRoot = "/test/repo";
      const name = "feature-branch";
      const result = getWorktreePath(gitRoot, name);
      strictEqual(result, "/test/repo/.git/phantom/worktrees/feature-branch");
    });

    it("should handle names with special characters", () => {
      const gitRoot = "/test/repo";
      const name = "feature/branch-123";
      const result = getWorktreePath(gitRoot, name);
      strictEqual(
        result,
        "/test/repo/.git/phantom/worktrees/feature/branch-123",
      );
    });

    it("should handle empty name", () => {
      const gitRoot = "/test/repo";
      const name = "";
      const result = getWorktreePath(gitRoot, name);
      // path.join removes trailing slashes
      strictEqual(result, "/test/repo/.git/phantom/worktrees");
    });
  });
});
