import { rejects, strictEqual } from "node:assert";
import { describe, it, mock } from "node:test";

const exitMock = mock.fn();
const consoleLogMock = mock.fn();
const consoleErrorMock = mock.fn();
const exitWithErrorMock = mock.fn((message, code) => {
  if (message) consoleErrorMock(message);
  exitMock(code);
  throw new Error(`Exit with code ${code}: ${message}`);
});

// Mock process module
mock.module("node:process", {
  namedExports: {
    exit: exitMock,
  },
});

// Mock console module
const originalLog = console.log;
const originalError = console.error;
console.log = consoleLogMock;
console.error = consoleErrorMock;

// Mock output module
mock.module("../output.ts", {
  namedExports: {
    output: {
      log: consoleLogMock,
      error: consoleErrorMock,
    },
  },
});

// Mock errors module
mock.module("../errors.ts", {
  namedExports: {
    exitWithError: exitWithErrorMock,
    exitCodes: {
      success: 0,
      generalError: 1,
      notFound: 2,
      validationError: 3,
    },
  },
});

// Import handler after mocks are set up
const { completionHandler } = await import("./completion.ts");

describe("completionHandler", () => {
  it("should exit with error when no shell is provided", async () => {
    exitMock.mock.resetCalls();
    consoleErrorMock.mock.resetCalls();

    await rejects(async () => await completionHandler([]), {
      message: /Exit with code 3/,
    });

    strictEqual(exitMock.mock.calls.length, 1);
    strictEqual(exitMock.mock.calls[0].arguments[0], 3); // validationError
  });

  it("should exit with error for unsupported shell", async () => {
    exitMock.mock.resetCalls();
    consoleErrorMock.mock.resetCalls();

    await rejects(async () => await completionHandler(["invalid"]), {
      message: /Exit with code 3/,
    });

    strictEqual(exitMock.mock.calls.length, 1);
    strictEqual(exitMock.mock.calls[0].arguments[0], 3); // validationError
  });

  it("should generate bash completion script", async () => {
    exitMock.mock.resetCalls();
    consoleLogMock.mock.resetCalls();

    await completionHandler(["bash"]);

    strictEqual(consoleLogMock.mock.calls.length, 1);
    const script = consoleLogMock.mock.calls[0].arguments[0];
    strictEqual(script.includes("#!/usr/bin/env bash"), true);
    strictEqual(script.includes("_phantom()"), true);
    strictEqual(script.includes("complete -F _phantom phantom"), true);
  });

  it("should generate zsh completion script", async () => {
    exitMock.mock.resetCalls();
    consoleLogMock.mock.resetCalls();

    await completionHandler(["zsh"]);

    strictEqual(consoleLogMock.mock.calls.length, 1);
    const script = consoleLogMock.mock.calls[0].arguments[0];
    strictEqual(script.includes("#compdef phantom"), true);
    strictEqual(script.includes("_phantom()"), true);
  });

  it("should generate fish completion script", async () => {
    exitMock.mock.resetCalls();
    consoleLogMock.mock.resetCalls();

    await completionHandler(["fish"]);

    strictEqual(consoleLogMock.mock.calls.length, 1);
    const script = consoleLogMock.mock.calls[0].arguments[0];
    strictEqual(script.includes("# Fish completion script for phantom"), true);
    strictEqual(script.includes("complete -c phantom"), true);
  });
});

// Restore console after tests
process.on("exit", () => {
  console.log = originalLog;
  console.error = originalError;
});
