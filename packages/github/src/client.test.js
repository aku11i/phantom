import { deepEqual, equal, ok } from "node:assert/strict";
import { afterEach, describe, it, mock } from "node:test";

const execFileAsyncMock = mock.fn();
let OctokitMockImplementation;

mock.module("node:child_process", {
  namedExports: {
    execFile: (command, args, callback) => {
      execFileAsyncMock(command, args, callback);
    },
  },
});

mock.module("node:util", {
  namedExports: {
    promisify: () => execFileAsyncMock,
  },
});

class OctokitMock {
  constructor(options) {
    if (OctokitMockImplementation) {
      const instance = OctokitMockImplementation(options);
      Object.assign(this, instance);
    } else {
      this.options = options;
    }
  }
}

mock.module("@octokit/rest", {
  namedExports: {
    Octokit: OctokitMock,
  },
});

const { createGitHubClient, getGitHubToken } = await import("./client.ts");

describe("getGitHubToken", () => {
  const resetMocks = () => {
    execFileAsyncMock.mock.resetCalls();
    OctokitMockImplementation = undefined;
  };

  it("should export getGitHubToken function", () => {
    equal(typeof getGitHubToken, "function");
  });

  it("should have correct function signature", () => {
    equal(getGitHubToken.length, 0);
  });

  it("should get token from gh CLI successfully", async () => {
    resetMocks();
    const mockToken = "ghp_test123token";
    execFileAsyncMock.mock.mockImplementation(async (command, args) => {
      equal(command, "gh");
      deepEqual(args, ["auth", "token"]);
      return { stdout: `${mockToken}\n`, stderr: "" };
    });

    const token = await getGitHubToken();

    equal(token, mockToken);
    equal(execFileAsyncMock.mock.calls.length, 1);
  });

  it("should throw error when gh CLI fails", async () => {
    resetMocks();
    const errorMessage = "gh: command not found";
    execFileAsyncMock.mock.mockImplementation(async () => {
      throw new Error(errorMessage);
    });

    try {
      await getGitHubToken();
      ok(false, "Should have thrown an error");
    } catch (error) {
      ok(error instanceof Error);
      ok(error.message.includes("Failed to get GitHub auth token"));
      ok(error.message.includes(errorMessage));
      ok(error.message.includes("Please run 'gh auth login' first"));
    }

    equal(execFileAsyncMock.mock.calls.length, 1);
  });

  it("should handle non-Error exceptions", async () => {
    resetMocks();
    const errorString = "Something went wrong";
    execFileAsyncMock.mock.mockImplementation(async () => {
      throw errorString;
    });

    try {
      await getGitHubToken();
      ok(false, "Should have thrown an error");
    } catch (error) {
      ok(error instanceof Error);
      ok(error.message.includes("Failed to get GitHub auth token"));
      ok(error.message.includes(errorString));
    }
  });
});

describe("createGitHubClient", () => {
  const originalGhHost = process.env.GH_HOST;
  const resetMocks = () => {
    execFileAsyncMock.mock.resetCalls();
    OctokitMockImplementation = undefined;
    process.env.GH_HOST = originalGhHost ?? "";
  };

  afterEach(resetMocks);

  it("should export createGitHubClient function", () => {
    equal(typeof createGitHubClient, "function");
  });

  it("should have correct function signature", () => {
    equal(createGitHubClient.length, 0);
  });

  it("should create new Octokit instance with token", async () => {
    resetMocks();
    const mockToken = "ghp_test456token";
    const mockOctokitInstance = { auth: mockToken };

    execFileAsyncMock.mock.mockImplementation(async () => ({
      stdout: mockToken,
      stderr: "",
    }));

    OctokitMockImplementation = (options) => {
      equal(options.auth, mockToken);
      return mockOctokitInstance;
    };

    const client = await createGitHubClient();

    ok(client instanceof OctokitMock);
    equal(client.auth, mockToken);
    equal(execFileAsyncMock.mock.calls.length, 1);
  });

  it("should use default github.com when GH_HOST is not set", async () => {
    resetMocks();
    process.env.GH_HOST = "";
    const mockToken = "ghp_test789token";

    execFileAsyncMock.mock.mockImplementation(async () => ({
      stdout: mockToken,
      stderr: "",
    }));

    OctokitMockImplementation = (options) => {
      equal(options.auth, mockToken);
      equal(options.baseUrl, undefined);
      return { auth: mockToken };
    };

    await createGitHubClient();
    equal(execFileAsyncMock.mock.calls.length, 1);
  });

  it("should use custom baseUrl when GH_HOST is set", async () => {
    resetMocks();
    const gheHost = "github.company.com";
    process.env.GH_HOST = gheHost;
    const mockToken = "ghp_enterprise123";

    execFileAsyncMock.mock.mockImplementation(async () => ({
      stdout: mockToken,
      stderr: "",
    }));

    OctokitMockImplementation = (options) => {
      equal(options.auth, mockToken);
      equal(options.baseUrl, `https://${gheHost}/api/v3`);
      return { auth: mockToken, baseUrl: options.baseUrl };
    };

    const client = await createGitHubClient();
    equal(client.baseUrl, `https://${gheHost}/api/v3`);
    equal(execFileAsyncMock.mock.calls.length, 1);
  });

  it("should propagate errors from getGitHubToken", async () => {
    resetMocks();
    const errorMessage = "Authentication failed";
    execFileAsyncMock.mock.mockImplementation(async () => {
      throw new Error(errorMessage);
    });

    try {
      await createGitHubClient();
      ok(false, "Should have thrown an error");
    } catch (error) {
      ok(error instanceof Error);
      ok(error.message.includes("Failed to get GitHub auth token"));
      ok(error.message.includes(errorMessage));
    }
  });
});
