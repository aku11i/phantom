export interface GitHubPullRequest {
  number: number;
  head: {
    ref: string;
    repo: {
      full_name: string;
    } | null;
  };
  base: {
    repo: {
      full_name: string;
    };
  };
}

export interface GitHubIssue {
  number: number;
  pullRequest?: GitHubPullRequest;
}

export function isPullRequest(
  issue: GitHubIssue,
): issue is GitHubIssue & { pullRequest: GitHubPullRequest } {
  return issue.pullRequest !== undefined;
}
