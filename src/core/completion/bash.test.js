import { strictEqual } from "node:assert";
import { describe, it } from "node:test";
import { generateBashCompletion } from "./bash.ts";

describe("generateBashCompletion", () => {
  it("should generate valid bash completion script", () => {
    const script = generateBashCompletion();

    // Check script structure
    strictEqual(script.includes("#!/usr/bin/env bash"), true);
    strictEqual(script.includes("_phantom()"), true);
    strictEqual(script.includes("complete -F _phantom phantom"), true);

    // Check command completions
    strictEqual(
      script.includes(
        "create delete exec list shell version where attach completion help",
      ),
      true,
    );

    // Check option completions
    strictEqual(
      script.includes("-b --branch -o --open --no-copy --help -h"),
      true,
    );
    strictEqual(script.includes("-f --force --help -h"), true);
    strictEqual(script.includes("--format --help -h"), true);

    // Check dynamic completions
    strictEqual(script.includes("phantom list --format=names"), true);
    strictEqual(script.includes("bash zsh fish"), true);
  });

  it("should have proper bash function structure", () => {
    const script = generateBashCompletion();

    // Check function declaration
    strictEqual(/_phantom\(\)\s*{/.test(script), true);

    // Check bash completion initialization
    strictEqual(script.includes("_init_completion || return"), true);

    // Check COMPREPLY usage
    strictEqual(script.includes("COMPREPLY=("), true);

    // Check case statement structure
    strictEqual(/case\s+"\$cmd"\s+in/.test(script), true);
    strictEqual(script.includes("esac"), true);
  });
});
