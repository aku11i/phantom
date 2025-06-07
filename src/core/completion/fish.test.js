import { strictEqual } from "node:assert";
import { describe, it } from "node:test";
import { generateFishCompletion } from "./fish.ts";

describe("generateFishCompletion", () => {
  it("should generate valid fish completion script", () => {
    const script = generateFishCompletion();

    // Check script structure
    strictEqual(script.includes("# Fish completion script for phantom"), true);
    strictEqual(script.includes("complete -c phantom -f"), true);

    // Check command completions
    strictEqual(
      script.includes(
        'complete -c phantom -n __fish_use_subcommand -a create -d "Create a new phantom worktree"',
      ),
      true,
    );
    strictEqual(
      script.includes(
        'complete -c phantom -n __fish_use_subcommand -a delete -d "Delete phantom worktrees"',
      ),
      true,
    );
    strictEqual(
      script.includes(
        'complete -c phantom -n __fish_use_subcommand -a completion -d "Generate shell completion script"',
      ),
      true,
    );

    // Check option completions
    strictEqual(
      script.includes('-s b -l branch -d "Create from specific branch"'),
      true,
    );
    strictEqual(script.includes('-s f -l force -d "Force deletion"'), true);
    strictEqual(script.includes('-l format -d "Output format"'), true);

    // Check dynamic completions
    strictEqual(script.includes("phantom list --format=names"), true);
    strictEqual(script.includes('"bash zsh fish"'), true);

    // Check helper function
    strictEqual(script.includes("function __fish_is_first_arg"), true);
  });

  it("should have proper fish completion structure", () => {
    const script = generateFishCompletion();

    // Check fish-specific predicates
    strictEqual(script.includes("__fish_seen_subcommand_from"), true);
    strictEqual(script.includes("__fish_use_subcommand"), true);
    strictEqual(script.includes("__fish_complete_directories"), true);
    strictEqual(script.includes("__fish_complete_command"), true);

    // Check global options
    strictEqual(script.includes('-s h -l help -d "Show help"'), true);

    // Check conditional completions
    strictEqual(script.includes("; and not __fish_is_first_arg"), true);
    strictEqual(script.includes("; and __fish_is_first_arg"), true);
  });
});
