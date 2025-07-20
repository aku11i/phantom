import type { CommandHelp } from "../help.ts";

export const gitHubOpenHelp: CommandHelp = {
  name: "open",
  usage: "phantom github open [<number>]",
  description: "Open GitHub page in browser",
  options: [],
  examples: [
    {
      command: "phantom github open",
      description:
        "Open PR/issue if in a phantom worktree, otherwise open repository",
    },
    {
      command: "phantom github open 123",
      description: "Open PR #123 or issue #123",
    },
  ],
  notes: [
    "When run in a phantom worktree without arguments, it will automatically detect the PR/issue number from the worktree name.",
    "Worktree names like 'pulls/123' or 'issues/456' will be recognized.",
    "When a number is specified, it first tries to open it as a PR, then as an issue if the PR is not found.",
    "Requires 'gh' CLI to be installed and authenticated.",
  ],
};
