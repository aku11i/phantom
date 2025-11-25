import { type SpawnSyncReturns, spawnSync } from "node:child_process";

const createWordsList = (words: string[]): string =>
  words.map((word) => JSON.stringify(word)).join(" ");

export type ZshCompletionResult = {
  completions: string[];
  result: SpawnSyncReturns<string>;
};

export const runZshCompletion = (
  completionScriptPath: string,
  words: string[],
): ZshCompletionResult => {
  const resolvedCurrentWordIndex = Math.max(words.length - 1, 0);
  const wordList = createWordsList(words);
  const buffer = words.join(" ");

  const command = `
set -e

compdef() {
  return 0
}

_arguments() {
  state="command"
  line=(${wordList})
  return 0
}

_describe() {
  local array_name=$2
  local -a items

  items=(\${(P)array_name[@]})

  for item in "\${items[@]}"; do
    completions+=("\${item%%:*}")
  done

  return 0
}

_command_names() {
  return 0
}

_files() {
  return 0
}

source "${completionScriptPath}"

words=(${wordList})
CURRENT=${resolvedCurrentWordIndex + 1}
BUFFER=${JSON.stringify(buffer)}
completions=()

_phantom

printf '%s\\n' "\${completions[@]}"
`;

  const result = spawnSync("zsh", ["-lc", command], {
    encoding: "utf8",
  });

  const completions = result.stdout
    .trim()
    .split("\n")
    .filter((value) => value.length > 0);

  return { completions, result };
};
