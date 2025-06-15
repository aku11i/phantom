import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { Octokit } from "@octokit/rest";

const execFileAsync = promisify(execFile);

let octokitInstance: Octokit | null = null;

async function getGitHubToken(): Promise<string> {
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
  if (!octokitInstance) {
    const token = await getGitHubToken();
    octokitInstance = new Octokit({ auth: token });
  }
  return octokitInstance;
}
