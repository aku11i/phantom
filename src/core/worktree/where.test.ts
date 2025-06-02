import { deepStrictEqual } from "node:assert";
import { describe, it, mock } from "node:test";
import { whereWorktree } from "./where.ts";

describe("whereWorktree", () => {
  it("should return path when worktree exists", async () => {
    const validateMock = mock.fn(() =>
      Promise.resolve({
        exists: true,
        path: "/test/repo/.git/phantom/worktrees/my-feature",
      }),
    );

    mock.module("./validate.ts", {
      namedExports: {
        validateWorktreeExists: validateMock,
      },
    });

    const { whereWorktree } = await import("./where.ts");
    const result = await whereWorktree("/test/repo", "my-feature");

    deepStrictEqual(result, {
      success: true,
      path: "/test/repo/.git/phantom/worktrees/my-feature",
    });

    deepStrictEqual(validateMock.mock.calls[0].arguments, [
      "/test/repo",
      "my-feature",
    ]);
  });

  it("should return error when worktree does not exist", async () => {
    const validateMock = mock.fn(() =>
      Promise.resolve({
        exists: false,
        message: "Worktree 'non-existent' not found",
      }),
    );

    mock.module("./validate.ts", {
      namedExports: {
        validateWorktreeExists: validateMock,
      },
    });

    const { whereWorktree } = await import("./where.ts");
    const result = await whereWorktree("/test/repo", "non-existent");

    deepStrictEqual(result, {
      success: false,
      message: "Worktree 'non-existent' not found",
    });
  });

  it("should provide default message when validation message is missing", async () => {
    const validateMock = mock.fn(() =>
      Promise.resolve({
        exists: false,
      }),
    );

    mock.module("./validate.ts", {
      namedExports: {
        validateWorktreeExists: validateMock,
      },
    });

    const { whereWorktree } = await import("./where.ts");
    const result = await whereWorktree("/test/repo", "missing");

    deepStrictEqual(result, {
      success: false,
      message: "Worktree 'missing' not found",
    });
  });
});
