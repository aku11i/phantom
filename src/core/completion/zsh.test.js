import { strictEqual } from "node:assert";
import { describe, it } from "node:test";
import { generateZshCompletion } from "./zsh.ts";

describe("generateZshCompletion", () => {
  it("should generate valid zsh completion script", () => {
    const script = generateZshCompletion();

    // Check script structure
    strictEqual(script.includes("#compdef phantom"), true);
    strictEqual(script.includes("_phantom()"), true);
    strictEqual(script.includes('_phantom "$@"'), true);

    // Check zsh-specific functions
    strictEqual(script.includes("_phantom_commands()"), true);
    strictEqual(script.includes("_phantom_names()"), true);
    strictEqual(script.includes("_phantom_name_suggestion()"), true);

    // Check command descriptions
    strictEqual(script.includes("create:Create a new phantom worktree"), true);
    strictEqual(script.includes("delete:Delete phantom worktrees"), true);
    strictEqual(
      script.includes("completion:Generate shell completion script"),
      true,
    );

    // Check dynamic completions
    strictEqual(script.includes("phantom list --names"), true);
  });

  it("should have proper zsh completion structure", () => {
    const script = generateZshCompletion();

    // Check _arguments usage
    strictEqual(script.includes("_arguments -C"), true);
    strictEqual(script.includes("'1:command:_phantom_commands'"), true);
    strictEqual(script.includes("'*::arg:->args'"), true);

    // Check case statement for subcommands
    strictEqual(/case\s+\$state\s+in/.test(script), true);
    strictEqual(/case\s+\$line\[1\]\s+in/.test(script), true);

    // Check option specifications
    strictEqual(script.includes("(-b --branch)'{-b,--branch}"), true);
    strictEqual(script.includes("(-f --force)'{-f,--force}"), true);
    strictEqual(script.includes("'--names[Output only phantom names]'"), true);
  });
});
