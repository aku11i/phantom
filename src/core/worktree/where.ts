import { validateWorktreeExists } from "./validate.ts";

export interface WhereWorktreeResult {
  success: boolean;
  message?: string;
  path?: string;
}

export async function whereWorktree(
  gitRoot: string,
  name: string,
): Promise<WhereWorktreeResult> {
  const validation = await validateWorktreeExists(gitRoot, name);

  if (!validation.exists) {
    return {
      success: false,
      message: validation.message || `Worktree '${name}' not found`,
    };
  }

  return {
    success: true,
    path: validation.path,
  };
}
