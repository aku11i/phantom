import { deepStrictEqual, rejects, strictEqual } from "node:assert";
import { describe, it, mock } from "node:test";

const execFileMock = mock.fn();

mock.module("node:child_process", {
  namedExports: {
    execFile: (cmd, args, callback) => {
      const result = execFileMock(cmd, args);
      if (callback) {
        result.then(
          (res) => callback(null, res),
          (err) => callback(err),
        );
      }
      return {};
    },
  },
});

mock.module("node:util", {
  namedExports: {
    promisify: () => execFileMock,
  },
});

const { getGitHubRepoInfo } = await import("./repo-info.ts");

describe("getGitHubRepoInfo", () => {
  const resetMocks = () => {
    execFileMock.mock.resetCalls();
  };

  it("should export getGitHubRepoInfo function", () => {
    strictEqual(typeof getGitHubRepoInfo, "function");
  });

  it("should return repository info successfully", async () => {
    resetMocks();
    execFileMock.mock.mockImplementation(() =>
      Promise.resolve({
        stdout: JSON.stringify({
          owner: { login: "test-owner" },
          name: "test-repo",
        }),
        stderr: "",
      }),
    );

    const result = await getGitHubRepoInfo();
    deepStrictEqual(result, {
      owner: "test-owner",
      repo: "test-repo",
    });

    strictEqual(execFileMock.mock.calls.length, 1);
    const [cmd, args] = execFileMock.mock.calls[0].arguments;
    strictEqual(cmd, "gh");
    deepStrictEqual(args, ["repo", "view", "--json", "owner,name"]);
  });

  it("should throw error when gh command fails", async () => {
    resetMocks();
    execFileMock.mock.mockImplementation(() =>
      Promise.reject(new Error("Command failed")),
    );

    await rejects(
      getGitHubRepoInfo(),
      /Failed to get repository info: Command failed/,
    );
  });

  it("should throw error when response is invalid", async () => {
    resetMocks();
    execFileMock.mock.mockImplementation(() =>
      Promise.resolve({
        stdout: JSON.stringify({
          owner: { login: 123 }, // Invalid: should be string
          name: "test-repo",
        }),
        stderr: "",
      }),
    );

    await rejects(
      getGitHubRepoInfo(),
      /Invalid input: expected string, received number/,
    );
  });
});
