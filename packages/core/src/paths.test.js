import { strictEqual } from "node:assert";
import { describe, it } from "node:test";
import { getWorktreesDirectory } from "./paths.ts";

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
});
