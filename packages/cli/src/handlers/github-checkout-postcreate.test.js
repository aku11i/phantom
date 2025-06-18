import { deepStrictEqual, rejects } from "node:assert";
import { describe, it, mock } from "node:test";
import { ConfigNotFoundError } from "@aku11i/phantom-core";
import { err, ok } from "@aku11i/phantom-shared";

const exitWithErrorMock = mock.fn((message, code) => {
  throw new Error(`Exit with code ${code}: ${message}`);
});
const outputLogMock = mock.fn();
const outputErrorMock = mock.fn();
const githubCheckoutMock = mock.fn();
const getGitRootMock = mock.fn();
const createContextMock = mock.fn();
const copyFilesToWorktreeMock = mock.fn();
const executePostCreateCommandsMock = mock.fn();

mock.module("../errors.ts", {
  namedExports: {
    exitWithError: exitWithErrorMock,
    exitCodes: {
      validationError: 3,
      generalError: 1,
    },
  },
});

mock.module("../output.ts", {
  namedExports: {
    output: { log: outputLogMock, error: outputErrorMock },
  },
});

mock.module("@aku11i/phantom-github", {
  namedExports: {
    githubCheckout: githubCheckoutMock,
  },
});

mock.module("@aku11i/phantom-git", {
  namedExports: {
    getGitRoot: getGitRootMock,
  },
});

mock.module("@aku11i/phantom-core", {
  namedExports: {
    ConfigNotFoundError,
    ConfigParseError: class ConfigParseError extends Error {},
    ConfigValidationError: class ConfigValidationError extends Error {},
    copyFilesToWorktree: copyFilesToWorktreeMock,
    createContext: createContextMock,
    executePostCreateCommands: executePostCreateCommandsMock,
  },
});

const { githubCheckoutHandler } = await import("./github-checkout.ts");

describe("githubCheckoutHandler postCreate", () => {
  it("should execute postCreate commands and copy files after successful checkout", async () => {
    exitWithErrorMock.mock.resetCalls();
    outputLogMock.mock.resetCalls();
    outputErrorMock.mock.resetCalls();
    githubCheckoutMock.mock.resetCalls();
    getGitRootMock.mock.resetCalls();
    createContextMock.mock.resetCalls();
    copyFilesToWorktreeMock.mock.resetCalls();
    executePostCreateCommandsMock.mock.resetCalls();

    githubCheckoutMock.mock.mockImplementation(() =>
      Promise.resolve(
        ok({
          message: "Checked out issue #123",
          worktree: "issue-123",
          path: "/repo/.git/phantom/worktrees/issue-123",
        }),
      ),
    );
    getGitRootMock.mock.mockImplementation(() => Promise.resolve("/repo"));
    createContextMock.mock.mockImplementation((gitRoot) =>
      Promise.resolve({
        gitRoot,
        worktreesDirectory: `${gitRoot}/.git/phantom/worktrees`,
        config: {
          postCreate: {
            copyFiles: [".env", "config.json"],
            commands: ["npm install", "npm run build"],
          },
        },
      }),
    );
    copyFilesToWorktreeMock.mock.mockImplementation(() =>
      Promise.resolve(ok(undefined)),
    );
    executePostCreateCommandsMock.mock.mockImplementation(() =>
      Promise.resolve(
        ok({ executedCommands: ["npm install", "npm run build"] }),
      ),
    );

    await githubCheckoutHandler(["123"]);

    deepStrictEqual(githubCheckoutMock.mock.calls.length, 1);
    deepStrictEqual(githubCheckoutMock.mock.calls[0].arguments[0], {
      number: "123",
      base: undefined,
    });
    deepStrictEqual(
      outputLogMock.mock.calls[0].arguments[0],
      "Checked out issue #123",
    );
    deepStrictEqual(copyFilesToWorktreeMock.mock.calls.length, 1);
    deepStrictEqual(copyFilesToWorktreeMock.mock.calls[0].arguments, [
      "/repo",
      "/repo/.git/phantom/worktrees",
      "issue-123",
      [".env", "config.json"],
    ]);
    deepStrictEqual(executePostCreateCommandsMock.mock.calls.length, 1);
    deepStrictEqual(executePostCreateCommandsMock.mock.calls[0].arguments[0], {
      gitRoot: "/repo",
      worktreesDirectory: "/repo/.git/phantom/worktrees",
      worktreeName: "issue-123",
      commands: ["npm install", "npm run build"],
    });
  });

  it("should skip postCreate if worktree already exists", async () => {
    exitWithErrorMock.mock.resetCalls();
    outputLogMock.mock.resetCalls();
    githubCheckoutMock.mock.resetCalls();
    getGitRootMock.mock.resetCalls();
    createContextMock.mock.resetCalls();
    copyFilesToWorktreeMock.mock.resetCalls();
    executePostCreateCommandsMock.mock.resetCalls();

    githubCheckoutMock.mock.mockImplementation(() =>
      Promise.resolve(
        ok({
          message: "Worktree for PR #456 is already checked out",
          worktree: "pr-456",
          path: "/repo/.git/phantom/worktrees/pr-456",
          alreadyExists: true,
        }),
      ),
    );

    await githubCheckoutHandler(["456"]);

    deepStrictEqual(githubCheckoutMock.mock.calls.length, 1);
    deepStrictEqual(
      outputLogMock.mock.calls[0].arguments[0],
      "Worktree for PR #456 is already checked out",
    );
    deepStrictEqual(getGitRootMock.mock.calls.length, 0);
    deepStrictEqual(createContextMock.mock.calls.length, 0);
    deepStrictEqual(copyFilesToWorktreeMock.mock.calls.length, 0);
    deepStrictEqual(executePostCreateCommandsMock.mock.calls.length, 0);
  });

  it("should handle githubCheckout error", async () => {
    exitWithErrorMock.mock.resetCalls();
    githubCheckoutMock.mock.resetCalls();

    githubCheckoutMock.mock.mockImplementation(() =>
      Promise.resolve(err(new Error("GitHub API error"))),
    );

    await rejects(
      async () => await githubCheckoutHandler(["123"]),
      /Exit with code 1/,
    );

    deepStrictEqual(exitWithErrorMock.mock.calls[0].arguments, [
      "GitHub API error",
      1,
    ]);
  });

  it("should pass base option to githubCheckout", async () => {
    exitWithErrorMock.mock.resetCalls();
    githubCheckoutMock.mock.resetCalls();
    getGitRootMock.mock.resetCalls();
    createContextMock.mock.resetCalls();

    githubCheckoutMock.mock.mockImplementation(() =>
      Promise.resolve(
        ok({
          message: "Checked out issue #123",
          worktree: "issue-123",
          path: "/repo/.git/phantom/worktrees/issue-123",
        }),
      ),
    );
    getGitRootMock.mock.mockImplementation(() => Promise.resolve("/repo"));
    createContextMock.mock.mockImplementation((gitRoot) =>
      Promise.resolve({
        gitRoot,
        worktreesDirectory: `${gitRoot}/.git/phantom/worktrees`,
        config: null,
      }),
    );

    await githubCheckoutHandler(["123", "--base", "develop"]);

    deepStrictEqual(githubCheckoutMock.mock.calls[0].arguments[0], {
      number: "123",
      base: "develop",
    });
  });

  it("should handle config not found gracefully", async () => {
    exitWithErrorMock.mock.resetCalls();
    outputLogMock.mock.resetCalls();
    outputErrorMock.mock.resetCalls();
    githubCheckoutMock.mock.resetCalls();
    getGitRootMock.mock.resetCalls();
    createContextMock.mock.resetCalls();
    copyFilesToWorktreeMock.mock.resetCalls();
    executePostCreateCommandsMock.mock.resetCalls();

    githubCheckoutMock.mock.mockImplementation(() =>
      Promise.resolve(
        ok({
          message: "Checked out issue #123",
          worktree: "issue-123",
          path: "/repo/.git/phantom/worktrees/issue-123",
        }),
      ),
    );
    getGitRootMock.mock.mockImplementation(() => Promise.resolve("/repo"));
    createContextMock.mock.mockImplementation((gitRoot) =>
      Promise.resolve({
        gitRoot,
        worktreesDirectory: `${gitRoot}/.git/phantom/worktrees`,
        config: null,
      }),
    );

    await githubCheckoutHandler(["123"]);

    deepStrictEqual(copyFilesToWorktreeMock.mock.calls.length, 0);
    deepStrictEqual(executePostCreateCommandsMock.mock.calls.length, 0);
    deepStrictEqual(outputErrorMock.mock.calls.length, 0);
  });
});
