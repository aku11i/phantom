import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { z } from "zod";

const execFileAsync = promisify(execFile);

const repoInfoSchema = z.object({
  owner: z.string(),
  repo: z.string(),
});

export async function getGitHubRepoInfo(): Promise<{
  owner: string;
  repo: string;
}> {
  try {
    const { stdout } = await execFileAsync("gh", [
      "repo",
      "view",
      "--json",
      "owner,name",
    ]);
    const data = JSON.parse(stdout);
    return repoInfoSchema.parse({
      owner: data.owner.login,
      repo: data.name,
    });
  } catch (error) {
    const errorMessage =
      error instanceof z.ZodError
        ? JSON.stringify(
            error.issues.map((issue) => {
              const normalizedMessage = issue.message.replace(
                /^Invalid input: /,
                "",
              );
              return {
                ...issue,
                message:
                  normalizedMessage.charAt(0).toUpperCase() +
                  normalizedMessage.slice(1),
              };
            }),
            null,
            2,
          )
        : error instanceof Error
          ? error.message
          : String(error);
    throw new Error(`Failed to get repository info: ${errorMessage}`);
  }
}
