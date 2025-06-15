import { deepStrictEqual, strictEqual } from "node:assert";
import { describe, it, mock } from "node:test";

const executeGitCommandMock = mock.fn();

mock.module("../executor.ts", {
  namedExports: {
    executeGitCommand: executeGitCommandMock,
  },
});

const { remoteBranchExists } = await import("./remote-branch-exists.ts");
const { isOk, isErr } = await import("@aku11i/phantom-shared");

describe("remoteBranchExists", () => {
  const resetMocks = () => {
    executeGitCommandMock.mock.resetCalls();
  };

  it("should return true when remote branch exists", async () => {
    resetMocks();
    executeGitCommandMock.mock.mockImplementation(() =>
      Promise.resolve({ stdout: "", stderr: "" }),
    );

    const result = await remoteBranchExists("/test/repo", "origin", "main");

    strictEqual(isOk(result), true);
    strictEqual(result.value, true);
    strictEqual(executeGitCommandMock.mock.calls.length, 1);
    deepStrictEqual(executeGitCommandMock.mock.calls[0].arguments[0], [
      "show-ref",
      "--verify",
      "--quiet",
      "refs/remotes/origin/main",
    ]);
    deepStrictEqual(executeGitCommandMock.mock.calls[0].arguments[1], {
      cwd: "/test/repo",
    });
  });

  it("should return false when remote branch does not exist", async () => {
    resetMocks();
    const error = new Error("Command failed with exit code 1");
    executeGitCommandMock.mock.mockImplementation(() => Promise.reject(error));

    const result = await remoteBranchExists(
      "/test/repo",
      "origin",
      "non-existent",
    );

    strictEqual(isOk(result), true);
    strictEqual(result.value, false);
  });

  it("should return error for other git failures", async () => {
    resetMocks();
    executeGitCommandMock.mock.mockImplementation(() =>
      Promise.reject(new Error("fatal: not a git repository")),
    );

    const result = await remoteBranchExists("/test/repo", "origin", "main");

    strictEqual(isErr(result), true);
    strictEqual(
      result.error.message.includes("fatal: not a git repository"),
      true,
    );
  });

  it("should handle non-Error exceptions", async () => {
    resetMocks();
    executeGitCommandMock.mock.mockImplementation(() =>
      Promise.reject("string error"),
    );

    const result = await remoteBranchExists("/test/repo", "origin", "main");

    strictEqual(isErr(result), true);
    strictEqual(
      result.error.message,
      "Failed to check remote branch: string error",
    );
  });
});
