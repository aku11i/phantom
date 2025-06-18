import { strictEqual } from "node:assert";
import { describe, it } from "node:test";
import { getWorktreePath, getWorktreesDirectory } from "./paths.ts";

describe("paths", () => {
  describe("getWorktreesDirectory", () => {
    it("should return correct phantom directory path", () => {
      const gitRoot = "/test/repo";
      const result = getWorktreesDirectory(gitRoot);
      strictEqual(result, "/test/repo/.git/phantom/worktrees");
    });

    it("should handle git root with trailing slash", () => {
      const gitRoot = "/test/repo/";
      const result = getWorktreesDirectory(gitRoot);
      strictEqual(result, "/test/repo/.git/phantom/worktrees");
    });

    it("should handle Windows-style paths", () => {
      const gitRoot = "C:\\test\\repo";
      const result = getWorktreesDirectory(gitRoot);
      // path.join normalizes separators based on the platform
      strictEqual(result.includes(".git"), true);
      strictEqual(result.includes("phantom"), true);
      strictEqual(result.includes("worktrees"), true);
    });

    describe("with worktreesDirectory", () => {
      it("should return default path when worktreesDirectory is undefined", () => {
        const gitRoot = "/test/repo";
        const result = getWorktreesDirectory(gitRoot, undefined);
        strictEqual(result, "/test/repo/.git/phantom/worktrees");
      });

      it("should handle relative worktreesDirectory", () => {
        const gitRoot = "/test/repo";
        const result = getWorktreesDirectory(gitRoot, "../phantom-external");
        strictEqual(result, "/test/phantom-external");
      });

      it("should handle absolute worktreesDirectory", () => {
        const gitRoot = "/test/repo";
        const result = getWorktreesDirectory(gitRoot, "/tmp/phantom-worktrees");
        strictEqual(result, "/tmp/phantom-worktrees");
      });

      it("should handle nested relative worktreesDirectory", () => {
        const gitRoot = "/test/repo";
        const result = getWorktreesDirectory(gitRoot, "custom/phantom");
        strictEqual(result, "/test/repo/custom/phantom");
      });

      it("should handle complex relative worktreesDirectory", () => {
        const gitRoot = "/test/repo";
        const result = getWorktreesDirectory(gitRoot, "../../shared/worktrees");
        strictEqual(result, "/shared/worktrees");
      });

      it("should handle worktreesDirectory with trailing slash", () => {
        const gitRoot = "/test/repo";
        const result = getWorktreesDirectory(gitRoot, "../phantom-external/");
        // path.join normalizes paths and may add trailing slash
        strictEqual(result, "/test/phantom-external/");
      });
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

    describe("with worktreesDirectory", () => {
      it("should return default worktree path when worktreesDirectory is undefined", () => {
        const gitRoot = "/test/repo";
        const name = "feature-branch";
        const result = getWorktreePath(gitRoot, name, undefined);
        strictEqual(result, "/test/repo/.git/phantom/worktrees/feature-branch");
      });

      it("should handle relative worktreesDirectory for worktree path", () => {
        const gitRoot = "/test/repo";
        const name = "feature-branch";
        const result = getWorktreePath(gitRoot, name, "../phantom-external");
        strictEqual(result, "/test/phantom-external/feature-branch");
      });

      it("should handle absolute worktreesDirectory for worktree path", () => {
        const gitRoot = "/test/repo";
        const name = "feature-branch";
        const result = getWorktreePath(gitRoot, name, "/tmp/phantom-worktrees");
        strictEqual(result, "/tmp/phantom-worktrees/feature-branch");
      });

      it("should handle worktree names with slashes and custom worktreesDirectory", () => {
        const gitRoot = "/test/repo";
        const name = "feature/user-auth";
        const result = getWorktreePath(gitRoot, name, "../phantom-external");
        strictEqual(result, "/test/phantom-external/feature/user-auth");
      });

      it("should handle nested worktreesDirectory with complex worktree names", () => {
        const gitRoot = "/test/repo";
        const name = "bugfix/issue-123";
        const result = getWorktreePath(gitRoot, name, "custom/phantom");
        strictEqual(result, "/test/repo/custom/phantom/bugfix/issue-123");
      });
    });
  });
});
