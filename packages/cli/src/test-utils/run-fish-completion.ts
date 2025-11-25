import { type SpawnSyncReturns, spawnSync } from "node:child_process";

export type FishCompletionResult = {
  completions: string[];
  result: SpawnSyncReturns<string>;
};

export const runFishCompletion = (
  completionScriptPath: string,
  words: string[],
): FishCompletionResult => {
  const buffer = words.join(" ");

  const command = `
source ${JSON.stringify(completionScriptPath)}
complete -C${JSON.stringify(buffer)}
`;

  const result = spawnSync("fish", ["-c", command], { encoding: "utf8" });

  const completions = result.stdout
    .trim()
    .split("\n")
    .map((line) => line.split("\t")[0])
    .filter((value) => value.length > 0);

  return { completions, result };
};
