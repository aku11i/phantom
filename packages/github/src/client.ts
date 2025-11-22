import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { Octokit } from "@octokit/rest";

type OctokitOptions = ConstructorParameters<typeof Octokit>[0];

const execFileAsync = promisify(execFile);

export async function getGitHubToken(): Promise<string> {
  try {
    const { stdout } = await execFileAsync("gh", ["auth", "token"]);
    return stdout.trim();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Failed to get GitHub auth token: ${errorMessage}. Please run 'gh auth login' first.`,
    );
  }
}

export async function createGitHubClient(): Promise<Octokit> {
  const token = await getGitHubToken();
  const gheHost = process.env.GH_HOST?.trim();
  const baseUrl =
    gheHost && gheHost !== "undefined"
      ? `https://${gheHost}/api/v3`
      : undefined;
  const options: OctokitOptions = baseUrl
    ? { auth: token, baseUrl }
    : { auth: token };

  return new Octokit(options);
}
