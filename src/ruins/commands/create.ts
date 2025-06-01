import { exit } from 'node:process';
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { getGitRoot } from '../../git/libs/get-git-root.ts';
import { addWorktree } from '../../git/libs/add-worktree.ts';

export function createRuin(
  name: string
): { success: boolean; message: string; path?: string } {
  if (!name) {
    return { success: false, message: 'Error: ruin name required' };
  }
  
  try {
    const gitRoot = getGitRoot();
    const ruinsPath = join(gitRoot, '.git', 'phantom', 'ruins');
    const worktreePath = join(ruinsPath, name);
    
    if (!existsSync(ruinsPath)) {
      mkdirSync(ruinsPath, { recursive: true });
    }
    
    if (existsSync(worktreePath)) {
      return { success: false, message: `Error: ruin '${name}' already exists` };
    }
    
    addWorktree({
      path: worktreePath,
      branch: `phantom/ruins/${name}`,
      commitish: 'HEAD'
    });
    
    return { 
      success: true, 
      message: `Created ruin '${name}' at ${worktreePath}`,
      path: worktreePath
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, message: `Error creating ruin: ${errorMessage}` };
  }
}

export function ruinsCreateHandler(args: string[]): void {
  const name = args[0];
  const result = createRuin(name);
  
  if (!result.success) {
    console.error(result.message);
    exit(1);
  }
  
  console.log(result.message);
}