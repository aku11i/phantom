export function generateFishCompletion(): string {
  return `# Fish completion script for phantom

# Disable file completion by default
complete -c phantom -f

# Commands
complete -c phantom -n __fish_use_subcommand -a create -d "Create a new phantom worktree"
complete -c phantom -n __fish_use_subcommand -a delete -d "Delete phantom worktrees"
complete -c phantom -n __fish_use_subcommand -a exec -d "Execute command in phantom worktree"
complete -c phantom -n __fish_use_subcommand -a list -d "List all phantom worktrees"
complete -c phantom -n __fish_use_subcommand -a shell -d "Open shell in phantom worktree"
complete -c phantom -n __fish_use_subcommand -a version -d "Show version information"
complete -c phantom -n __fish_use_subcommand -a where -d "Show phantom worktree path"
complete -c phantom -n __fish_use_subcommand -a attach -d "Attach an existing worktree as phantom"
complete -c phantom -n __fish_use_subcommand -a completion -d "Generate shell completion script"
complete -c phantom -n __fish_use_subcommand -a help -d "Show help for a command"

# Global options
complete -c phantom -s h -l help -d "Show help"

# create command
complete -c phantom -n "__fish_seen_subcommand_from create" -s b -l branch -d "Create from specific branch" -r
complete -c phantom -n "__fish_seen_subcommand_from create" -s o -l open -d "Open the worktree after creation"
complete -c phantom -n "__fish_seen_subcommand_from create" -l no-copy -d "Do not copy files after creation"

# delete command
complete -c phantom -n "__fish_seen_subcommand_from delete" -s f -l force -d "Force deletion"
complete -c phantom -n "__fish_seen_subcommand_from delete; and not __fish_seen_subcommand_from delete help" -a "(phantom list --names 2>/dev/null)"

# exec command
complete -c phantom -n "__fish_seen_subcommand_from exec; and __fish_is_first_arg" -a "(phantom list --names 2>/dev/null)"
complete -c phantom -n "__fish_seen_subcommand_from exec; and not __fish_is_first_arg" -a "(__fish_complete_command)"

# shell command
complete -c phantom -n "__fish_seen_subcommand_from shell" -a "(phantom list --names 2>/dev/null)"

# list command
complete -c phantom -n "__fish_seen_subcommand_from list" -l fzf -d "Use fzf for interactive selection"
complete -c phantom -n "__fish_seen_subcommand_from list" -l names -d "Output only phantom names"

# where command
complete -c phantom -n "__fish_seen_subcommand_from where" -a "(phantom list --names 2>/dev/null)"

# attach command
complete -c phantom -n "__fish_seen_subcommand_from attach" -a "(__fish_complete_directories)"

# completion command
complete -c phantom -n "__fish_seen_subcommand_from completion" -a "bash zsh fish"

# help command
complete -c phantom -n "__fish_seen_subcommand_from help" -a "create delete exec list shell version where attach completion"

# Helper function to check if we're on the first argument after the subcommand
function __fish_is_first_arg
    set -l cmd (commandline -opc)
    set -l subcmd_index 1
    for i in (seq 2 (count $cmd))
        if test $cmd[$i] = $cmd[2]
            set subcmd_index $i
            break
        end
    end
    test (math (count $cmd) - $subcmd_index) -eq 1
end`;
}
