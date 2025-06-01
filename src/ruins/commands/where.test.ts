import { strictEqual } from "node:assert";
import { before, describe, it, mock } from "node:test";

describe("whereRuin", () => {
  let accessMock: ReturnType<typeof mock.fn>;
  let execMock: ReturnType<typeof mock.fn>;
  let whereRuin: typeof import("./where.ts").whereRuin;

  before(async () => {
    accessMock = mock.fn();
    execMock = mock.fn();

    mock.module("node:fs/promises", {
      namedExports: {
        access: accessMock,
      },
    });

    mock.module("node:child_process", {
      namedExports: {
        exec: execMock,
      },
    });

    mock.module("node:util", {
      namedExports: {
        promisify: (fn: unknown) => fn,
      },
    });

    ({ whereRuin } = await import("./where.ts"));
  });

  it("should return error when name is not provided", async () => {
    const result = await whereRuin("");
    strictEqual(result.success, false);
    strictEqual(result.message, "Error: ruin name required");
  });

  it("should return error when ruin does not exist", async () => {
    accessMock.mock.resetCalls();
    execMock.mock.resetCalls();

    // Mock getGitRoot
    execMock.mock.mockImplementation((cmd: string) => {
      if (cmd === "git rev-parse --show-toplevel") {
        return Promise.resolve({ stdout: "/test/repo\n", stderr: "" });
      }
      return Promise.resolve({ stdout: "", stderr: "" });
    });

    // Mock ruin doesn't exist
    accessMock.mock.mockImplementation(() => {
      return Promise.reject(new Error("ENOENT"));
    });

    const result = await whereRuin("nonexistent-ruin");

    strictEqual(result.success, false);
    strictEqual(
      result.message,
      "Error: Ruin 'nonexistent-ruin' does not exist",
    );
  });

  it("should return path when ruin exists", async () => {
    accessMock.mock.resetCalls();
    execMock.mock.resetCalls();

    // Mock getGitRoot
    execMock.mock.mockImplementation((cmd: string) => {
      if (cmd === "git rev-parse --show-toplevel") {
        return Promise.resolve({ stdout: "/test/repo\n", stderr: "" });
      }
      return Promise.resolve({ stdout: "", stderr: "" });
    });

    // Mock ruin exists
    accessMock.mock.mockImplementation(() => Promise.resolve());

    const result = await whereRuin("existing-ruin");

    strictEqual(result.success, true);
    strictEqual(result.path, "/test/repo/.git/phantom/ruins/existing-ruin");
  });

  it("should handle git root detection failures", async () => {
    accessMock.mock.resetCalls();
    execMock.mock.resetCalls();

    // Mock getGitRoot failure
    execMock.mock.mockImplementation(() => {
      return Promise.reject(new Error("Not a git repository"));
    });

    const result = await whereRuin("some-ruin");

    strictEqual(result.success, false);
    strictEqual(result.message, "Error locating ruin: Not a git repository");
  });

  it("should handle different ruin names correctly", async () => {
    accessMock.mock.resetCalls();
    execMock.mock.resetCalls();

    // Mock getGitRoot
    execMock.mock.mockImplementation((cmd: string) => {
      if (cmd === "git rev-parse --show-toplevel") {
        return Promise.resolve({ stdout: "/different/repo\n", stderr: "" });
      }
      return Promise.resolve({ stdout: "", stderr: "" });
    });

    // Mock ruin exists
    accessMock.mock.mockImplementation(() => Promise.resolve());

    const result = await whereRuin("feature-branch-123");

    strictEqual(result.success, true);
    strictEqual(
      result.path,
      "/different/repo/.git/phantom/ruins/feature-branch-123",
    );
  });

  it("should handle special characters in ruin names", async () => {
    accessMock.mock.resetCalls();
    execMock.mock.resetCalls();

    // Mock getGitRoot
    execMock.mock.mockImplementation((cmd: string) => {
      if (cmd === "git rev-parse --show-toplevel") {
        return Promise.resolve({ stdout: "/test/repo\n", stderr: "" });
      }
      return Promise.resolve({ stdout: "", stderr: "" });
    });

    // Mock ruin exists
    accessMock.mock.mockImplementation(() => Promise.resolve());

    const result = await whereRuin("feature-with-dashes_and_underscores");

    strictEqual(result.success, true);
    strictEqual(
      result.path,
      "/test/repo/.git/phantom/ruins/feature-with-dashes_and_underscores",
    );
  });
});
