import type { CommandHelp } from "../help.ts";

export const gitHubOpenHelp: CommandHelp = {
  name: "open",
  usage: "phantom github open [<worktree>]",
  description: "Open GitHub page in browser",
  options: [],
  examples: [
    {
      command: "phantom github open",
      description:
        "Open PR/issue if in a phantom worktree, otherwise open repository",
    },
    {
      command: "phantom github open pulls/123",
      description: "Open PR #123 in browser",
    },
    {
      command: "phantom github open issues/456",
      description: "Open issue #456 in browser",
    },
    {
      command: "phantom github open my-feature",
      description: "Open repository page (worktree name doesn't match pattern)",
    },
  ],
  notes: [
    "When run without arguments, uses the current worktree name.",
    "Worktree names matching 'pulls/<number>' or 'issues/<number>' will open the corresponding PR/issue.",
    "Other worktree names will open the repository page.",
    "Requires 'gh' CLI to be installed and authenticated.",
  ],
};
