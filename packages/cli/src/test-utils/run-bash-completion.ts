import { spawnSync, type SpawnSyncReturns } from "node:child_process";

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

  /*
    The embedded bash script performs the following steps:
    - set -e: exit immediately if any command fails.
    - shopt -s progcomp: enable programmable completion support.
    - source "${completionScriptPath}": load the phantom completion script.
    - _init_completion() { ... }: stub the helper expected by the completion
      script, wiring in the current word, previous word, and word list.
    - COMP_WORDS=(...): expose the words array to the completion function.
    - COMP_CWORD=...: expose the index of the current word.
    - _phantom_completion: invoke the completion entrypoint.
    - printf '%s\n' "\${COMPREPLY[@]}": print each completion candidate on its
      own line for parsing in the test harness.
  */
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
