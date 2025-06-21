import { parseArgs } from "node:util";
import {
  type WorktreeInfo,
  createContext,
  listWorktrees,
} from "@aku11i/phantom-core";
import { getGitRoot } from "@aku11i/phantom-git";
import {
  getClipboardCommand,
  getFileManagerCommand,
  spawnFzf,
  spawnPhantomCommand,
} from "@aku11i/phantom-process";
import { isOk } from "@aku11i/phantom-shared";
import { exitWithError } from "../errors.ts";
import { output } from "../output.ts";

const HELP_TEXT = `
Phantom Worktrees - Interactive Interface

Keybindings:
  enter    Open shell in the worktree (default)
  ctrl-d   Delete the worktree
  ctrl-w   Show worktree path (where)
  ctrl-o   Open worktree directory in file manager
  ctrl-y   Copy worktree path to clipboard
  alt-?    Toggle help

Navigation:
  ↑/↓      Move selection
  /        Start search
  esc      Cancel search or exit
`;

export async function fzfHandler(args: string[]): Promise<void> {
  const { values } = parseArgs({
    args,
    options: {
      help: {
        type: "boolean",
        short: "h",
      },
    },
    allowPositionals: false,
  });

  if (values.help) {
    output.log(HELP_TEXT);
    return;
  }

  const gitRoot = await getGitRoot();
  const context = await createContext(gitRoot);

  const listResult = await listWorktrees(
    context.gitRoot,
    context.worktreesDirectory,
  );

  if (!isOk(listResult)) {
    // This should never happen since listWorktrees returns Result<T, never>
    return;
  }

  const { worktrees } = listResult.value;
  if (worktrees.length === 0) {
    output.log("No worktrees found.");
    return;
  }

  // Format worktree list for display
  const formattedWorktrees = worktrees.map((wt: WorktreeInfo) => {
    const branchInfo = wt.branch ? `(${wt.branch})` : "";
    const status = !wt.isClean ? " [dirty]" : "";
    return `${wt.name} ${branchInfo}${status}`;
  });

  // Build fzf command with keybindings
  const clipboardCmd = getClipboardCommand();
  const fileManagerCmd = getFileManagerCommand();

  const fzf = spawnFzf(formattedWorktrees, {
    ansi: true,
    layout: "reverse",
    border: "rounded",
    borderLabel: " Phantom Worktrees ",
    header: "enter:shell  ^d:delete  ^w:where  ^o:open  ^y:copy  alt-?:help",
    bindings: [
      { key: "enter", action: "accept" },
      { key: "ctrl-d", action: "execute(phantom delete {1} < /dev/tty)+abort" },
      { key: "ctrl-w", action: "execute-silent(phantom where {1})+abort" },
      {
        key: "ctrl-o",
        action: `execute-silent(${fileManagerCmd} $(phantom where {1}))+abort`,
      },
      {
        key: "ctrl-y",
        action: `execute-silent(phantom where {1} | ${clipboardCmd})+abort`,
      },
      { key: "alt-?", action: "toggle-preview" },
    ],
    previewWindow: "hidden",
    previewCommand: `echo '${HELP_TEXT.trim()}'`,
    stdio: "inherit",
  });

  let result = "";

  if (fzf.stdout) {
    fzf.stdout.on("data", (data) => {
      result += data.toString();
    });
  }

  fzf.on("error", (error) => {
    if (error.message.includes("ENOENT")) {
      exitWithError("fzf command not found. Please install fzf first.");
    } else {
      exitWithError(error.message);
    }
  });

  fzf.on("close", (code) => {
    if (code === 0 && result) {
      // Extract worktree name from the selected line
      const selectedName = result.trim().split(" ")[0];
      // Open shell in the selected worktree
      spawnPhantomCommand(["shell", selectedName]);
    }
    // Exit silently if user cancels (code 1 or 130)
  });
}
