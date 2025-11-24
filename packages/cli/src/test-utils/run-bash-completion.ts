import { type SpawnSyncReturns, spawnSync } from "node:child_process";

const createWordsList = (words: string[]): string =>
  words.map((word) => JSON.stringify(word)).join(" ");

export type BashCompletionResult = {
  completions: string[];
  result: SpawnSyncReturns<string>;
};

export const runBashCompletion = (
  completionScriptPath: string,
  words: string[],
): BashCompletionResult => {
  const resolvedCurrentWordIndex = Math.max(words.length - 1, 0);
  const currentWord = words[resolvedCurrentWordIndex] ?? "";
  const previousWord = words[resolvedCurrentWordIndex - 1] ?? "";
  const wordList = createWordsList(words);

  const command = `
set -e
shopt -s progcomp
source "${completionScriptPath}"
_init_completion() {
  cur=${JSON.stringify(currentWord)}
  prev=${JSON.stringify(previousWord)}
  words=(${wordList})
  cword=${resolvedCurrentWordIndex}
  return 0
}
COMP_WORDS=(${wordList})
COMP_CWORD=${resolvedCurrentWordIndex}
_phantom_completion
printf '%s\\n' "\${COMPREPLY[@]}"
`;

  const result = spawnSync("bash", ["-lc", command], { encoding: "utf8" });

  const completions = result.stdout
    .trim()
    .split("\n")
    .filter((value) => value.length > 0);

  return { completions, result };
};
