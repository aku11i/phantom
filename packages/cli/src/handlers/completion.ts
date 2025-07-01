import { exit } from "node:process";
import { output } from "../output.ts";

const FISH_COMPLETION_SCRIPT = `# Fish completion for phantom
# Load with: phantom completion fish | source

function __phantom_list_worktrees
    phantom list --names 2>/dev/null
end

function __phantom_using_command
    set -l cmd (commandline -opc)
    set -l cmd_count (count $cmd)
    if test $cmd_count -eq 1
        # No subcommand yet, so any command can be used
        if test (count $argv) -eq 0
            return 0
        else
            return 1
        end
    else if test $cmd_count -ge 2
        # Check if we're in the context of a specific command
        if test (count $argv) -gt 0 -a "$argv[1]" = "$cmd[2]"
            return 0
        end
    end
    return 1
end

# Disable file completion for phantom
complete -c phantom -f

# Main commands
complete -c phantom -n "__phantom_using_command" -a "create" -d "Create a new Git worktree (phantom)"
complete -c phantom -n "__phantom_using_command" -a "attach" -d "Attach to an existing branch by creating a new worktree"
complete -c phantom -n "__phantom_using_command" -a "list" -d "List all Git worktrees (phantoms)"
complete -c phantom -n "__phantom_using_command" -a "where" -d "Output the filesystem path of a specific worktree"
complete -c phantom -n "__phantom_using_command" -a "delete" -d "Delete a Git worktree (phantom)"
complete -c phantom -n "__phantom_using_command" -a "exec" -d "Execute a command in a worktree directory"
complete -c phantom -n "__phantom_using_command" -a "review" -d "Review changes in a worktree with a local PR review interface (experimental)"
complete -c phantom -n "__phantom_using_command" -a "shell" -d "Open an interactive shell in a worktree directory"
complete -c phantom -n "__phantom_using_command" -a "github" -d "GitHub integration commands"
complete -c phantom -n "__phantom_using_command" -a "gh" -d "GitHub integration commands (alias)"
complete -c phantom -n "__phantom_using_command" -a "version" -d "Display phantom version information"
complete -c phantom -n "__phantom_using_command" -a "completion" -d "Generate shell completion scripts"
complete -c phantom -n "__phantom_using_command" -a "mcp" -d "Manage Model Context Protocol (MCP) server"

# Global options
complete -c phantom -l help -d "Show help (-h)"
complete -c phantom -l version -d "Show version (-v)"

# create command options
complete -c phantom -n "__phantom_using_command create" -l shell -d "Open an interactive shell in the new worktree after creation (-s)"
complete -c phantom -n "__phantom_using_command create" -l exec -d "Execute a command in the new worktree after creation (-x)" -x
complete -c phantom -n "__phantom_using_command create" -l tmux -d "Open the worktree in a new tmux window (-t)"
complete -c phantom -n "__phantom_using_command create" -l tmux-vertical -d "Open the worktree in a vertical tmux pane"
complete -c phantom -n "__phantom_using_command create" -l tmux-horizontal -d "Open the worktree in a horizontal tmux pane"
complete -c phantom -n "__phantom_using_command create" -l copy-file -d "Copy specified files from the current worktree" -r
complete -c phantom -n "__phantom_using_command create" -l base -d "Branch or commit to create the new worktree from (defaults to HEAD)" -x

# attach command options
complete -c phantom -n "__phantom_using_command attach" -l shell -d "Open an interactive shell in the worktree after attaching (-s)"
complete -c phantom -n "__phantom_using_command attach" -l exec -d "Execute a command in the worktree after attaching (-x)" -x

# list command options
complete -c phantom -n "__phantom_using_command list" -l fzf -d "Use fzf for interactive selection"
complete -c phantom -n "__phantom_using_command list" -l names -d "Output only phantom names (for scripts and completion)"

# where command options
complete -c phantom -n "__phantom_using_command where" -l fzf -d "Use fzf for interactive selection"
complete -c phantom -n "__phantom_using_command where" -a "(__phantom_list_worktrees)"

# delete command options
complete -c phantom -n "__phantom_using_command delete" -l force -d "Force deletion even if worktree has uncommitted changes (-f)"
complete -c phantom -n "__phantom_using_command delete" -l current -d "Delete the current worktree"
complete -c phantom -n "__phantom_using_command delete" -l fzf -d "Use fzf for interactive selection"
complete -c phantom -n "__phantom_using_command delete" -a "(__phantom_list_worktrees)"

# exec command options
complete -c phantom -n "__phantom_using_command exec" -l fzf -d "Use fzf for interactive selection"
complete -c phantom -n "__phantom_using_command exec" -l tmux -d "Execute command in new tmux window (-t)"
complete -c phantom -n "__phantom_using_command exec" -l tmux-vertical -d "Execute command in vertical split pane"
complete -c phantom -n "__phantom_using_command exec" -l tmux-horizontal -d "Execute command in horizontal split pane"
complete -c phantom -n "__phantom_using_command exec" -a "(__phantom_list_worktrees)"

# review command options
complete -c phantom -n "__phantom_using_command review" -l fzf -d "Use fzf for interactive selection"
complete -c phantom -n "__phantom_using_command review" -l base -d "Base reference for comparison" -x
complete -c phantom -n "__phantom_using_command review" -a "(__phantom_list_worktrees)"

# shell command options
complete -c phantom -n "__phantom_using_command shell" -l fzf -d "Use fzf for interactive selection"
complete -c phantom -n "__phantom_using_command shell" -l tmux -d "Open shell in new tmux window (-t)"
complete -c phantom -n "__phantom_using_command shell" -l tmux-vertical -d "Open shell in vertical split pane"
complete -c phantom -n "__phantom_using_command shell" -l tmux-horizontal -d "Open shell in horizontal split pane"
complete -c phantom -n "__phantom_using_command shell" -a "(__phantom_list_worktrees)"

# completion command - shell names
complete -c phantom -n "__phantom_using_command completion" -a "fish zsh bash" -d "Shell type"

# github command options
complete -c phantom -n "__phantom_using_command github" -a "checkout" -d "Create a worktree for a GitHub PR or issue"
complete -c phantom -n "__phantom_using_command gh" -a "checkout" -d "Create a worktree for a GitHub PR or issue"

# github checkout command options
complete -c phantom -n "__phantom_using_command github checkout" -l base -d "Base branch for new issue branches (issues only)" -x
complete -c phantom -n "__phantom_using_command gh checkout" -l base -d "Base branch for new issue branches (issues only)" -x

# mcp command options
complete -c phantom -n "__phantom_using_command mcp" -a "serve" -d "Start MCP server"`;

const ZSH_COMPLETION_SCRIPT = `#compdef phantom
# Zsh completion for phantom
# Load with: eval "$(phantom completion zsh)"

# Only define the function, don't execute it
_phantom() {
    local -a commands
    commands=(
        'create:Create a new Git worktree (phantom)'
        'attach:Attach to an existing branch by creating a new worktree'
        'list:List all Git worktrees (phantoms)'
        'where:Output the filesystem path of a specific worktree'
        'delete:Delete a Git worktree (phantom)'
        'exec:Execute a command in a worktree directory'
        'review:Review changes in a worktree with a local PR review interface (experimental)'
        'shell:Open an interactive shell in a worktree directory'
        'github:GitHub integration commands'
        'gh:GitHub integration commands (alias)'
        'version:Display phantom version information'
        'completion:Generate shell completion scripts'
        'mcp:Manage Model Context Protocol (MCP) server'
    )

    _arguments -C \\
        '--help[Show help (-h)]' \\
        '--version[Show version (-v)]' \\
        '1:command:->command' \\
        '*::arg:->args'

    case \${state} in
        command)
            _describe 'phantom command' commands
            ;;
        args)
            case \${line[1]} in
                create)
                    _arguments \\
                        '--shell[Open an interactive shell in the new worktree after creation (-s)]' \\
                        '--exec[Execute a command in the new worktree after creation (-x)]:command:' \\
                        '--tmux[Open the worktree in a new tmux window (-t)]' \\
                        '--tmux-vertical[Open the worktree in a vertical tmux pane]' \\
                        '--tmux-horizontal[Open the worktree in a horizontal tmux pane]' \\
                        '*--copy-file[Copy specified files from the current worktree]:file:_files' \\
                        '--base[Branch or commit to create the new worktree from (defaults to HEAD)]:branch/commit:' \\
                        '1:name:'
                    ;;
                attach)
                    _arguments \\
                        '--shell[Open an interactive shell in the worktree after attaching (-s)]' \\
                        '--exec[Execute a command in the worktree after attaching (-x)]:command:' \\
                        '1:branch-name:'
                    ;;
                list)
                    _arguments \\
                        '--fzf[Use fzf for interactive selection]' \\
                        '--names[Output only phantom names (for scripts and completion)]'
                    ;;
                where|delete|review|shell)
                    local worktrees
                    worktrees=(\${(f)"$(phantom list --names 2>/dev/null)"})
                    if [[ \${line[1]} == "where" ]]; then
                        _arguments \\
                            '--fzf[Use fzf for interactive selection]' \\
                            '1:worktree:(\${(q)worktrees[@]})'
                    elif [[ \${line[1]} == "review" ]]; then
                        _arguments \\
                            '--fzf[Use fzf for interactive selection]' \\
                            '--base[Base reference for comparison]:reference:' \\
                            '1:worktree:(\${(q)worktrees[@]})'
                    elif [[ \${line[1]} == "shell" ]]; then
                        _arguments \\
                            '--fzf[Use fzf for interactive selection]' \\
                            '--tmux[Open shell in new tmux window (-t)]' \\
                            '--tmux-vertical[Open shell in vertical split pane]' \\
                            '--tmux-horizontal[Open shell in horizontal split pane]' \\
                            '1:worktree:(\${(q)worktrees[@]})'
                    elif [[ \${line[1]} == "delete" ]]; then
                        _arguments \\
                            '--force[Force deletion even if worktree has uncommitted changes (-f)]' \\
                            '--current[Delete the current worktree]' \\
                            '--fzf[Use fzf for interactive selection]' \\
                            '1:worktree:(\${(q)worktrees[@]})'
                    fi
                    ;;
                exec)
                    local worktrees
                    worktrees=(\${(f)"$(phantom list --names 2>/dev/null)"})
                    _arguments \\
                        '--fzf[Use fzf for interactive selection]' \\
                        '--tmux[Execute command in new tmux window (-t)]' \\
                        '--tmux-vertical[Execute command in vertical split pane]' \\
                        '--tmux-horizontal[Execute command in horizontal split pane]' \\
                        '1:worktree:(\${(q)worktrees[@]})' \\
                        '*:command:_command_names'
                    ;;
                completion)
                    _arguments \\
                        '1:shell:(fish zsh bash)'
                    ;;
                github|gh)
                    if [[ \${#line} -eq 1 ]]; then
                        _arguments \\
                            '1:subcommand:(checkout)'
                    elif [[ \${line[2]} == "checkout" ]]; then
                        _arguments \\
                            '--base[Base branch for new issue branches (issues only)]:branch:' \\
                            '1:number:'
                    fi
                    ;;
                mcp)
                    _arguments \\
                        '1:action:(serve)'
                    ;;
            esac
            ;;
    esac
}

# Register the completion function if loading dynamically
if [[ -n \${ZSH_VERSION} ]]; then
    autoload -Uz compinit && compinit -C
    compdef _phantom phantom
fi`;

const BASH_COMPLETION_SCRIPT = `# Bash completion for phantom
# Load with: eval "$(phantom completion bash)"

_phantom_list_worktrees() {
    phantom list --names 2>/dev/null || true
}

_phantom_completion() {
    local cur prev words cword
    _init_completion || return

    local commands="create attach list where delete exec review shell github gh version completion mcp"
    local global_opts="--help --version"

    if [[ \${cword} -eq 1 ]]; then
        # Completing first argument (command)
        COMPREPLY=( \$(compgen -W "\${commands}" -- "\${cur}") )
        return 0
    fi

    local command="\${words[1]}"

    case "\${command}" in
        create)
            case "\${prev}" in
                --exec|-x)
                    # Don't complete anything specific for exec commands
                    return 0
                    ;;
                --copy-file)
                    # Complete files
                    _filedir
                    return 0
                    ;;
                --base)
                    # Don't complete anything specific for base (branch/commit)
                    return 0
                    ;;
                *)
                    local opts="--shell --exec --tmux --tmux-vertical --tmux-horizontal --copy-file --base"
                    COMPREPLY=( \$(compgen -W "\${opts}" -- "\${cur}") )
                    return 0
                    ;;
            esac
            ;;
        attach)
            case "\${prev}" in
                --exec|-x)
                    # Don't complete anything specific for exec commands
                    return 0
                    ;;
                *)
                    if [[ \${cword} -eq 2 ]]; then
                        # First argument: branch name (not completing - user needs to provide)
                        return 0
                    else
                        local opts="--shell --exec"
                        COMPREPLY=( \$(compgen -W "\${opts}" -- "\${cur}") )
                        return 0
                    fi
                    ;;
            esac
            ;;
        list)
            local opts="--fzf --names"
            COMPREPLY=( \$(compgen -W "\${opts}" -- "\${cur}") )
            return 0
            ;;
        where)
            if [[ "\${cur}" == -* ]]; then
                local opts="--fzf"
                COMPREPLY=( \$(compgen -W "\${opts}" -- "\${cur}") )
            else
                local worktrees=\$(_phantom_list_worktrees)
                COMPREPLY=( \$(compgen -W "\${worktrees}" -- "\${cur}") )
            fi
            return 0
            ;;
        delete)
            if [[ "\${cur}" == -* ]]; then
                local opts="--force --current --fzf"
                COMPREPLY=( \$(compgen -W "\${opts}" -- "\${cur}") )
            else
                local worktrees=\$(_phantom_list_worktrees)
                COMPREPLY=( \$(compgen -W "\${worktrees}" -- "\${cur}") )
            fi
            return 0
            ;;
        exec)
            case "\${prev}" in
                --tmux|-t|--tmux-vertical|--tmux-horizontal)
                    # After tmux options, expect worktree name
                    local worktrees=\$(_phantom_list_worktrees)
                    COMPREPLY=( \$(compgen -W "\${worktrees}" -- "\${cur}") )
                    return 0
                    ;;
                *)
                    if [[ "\${cur}" == -* ]]; then
                        local opts="--fzf --tmux --tmux-vertical --tmux-horizontal"
                        COMPREPLY=( \$(compgen -W "\${opts}" -- "\${cur}") )
                    elif [[ \${cword} -eq 2 ]] || [[ " \${words[@]} " =~ " --fzf " && \${cword} -eq 3 ]]; then
                        # First non-option argument should be worktree name
                        local worktrees=\$(_phantom_list_worktrees)
                        COMPREPLY=( \$(compgen -W "\${worktrees}" -- "\${cur}") )
                    else
                        # After worktree name, complete commands
                        compopt -o default
                        COMPREPLY=()
                    fi
                    return 0
                    ;;
            esac
            ;;
        review)
            case "\${prev}" in
                --base)
                    # Don't complete anything specific for base reference
                    return 0
                    ;;
                *)
                    if [[ "\${cur}" == -* ]]; then
                        local opts="--fzf --base"
                        COMPREPLY=( \$(compgen -W "\${opts}" -- "\${cur}") )
                    else
                        local worktrees=\$(_phantom_list_worktrees)
                        COMPREPLY=( \$(compgen -W "\${worktrees}" -- "\${cur}") )
                    fi
                    return 0
                    ;;
            esac
            ;;
        shell)
            case "\${prev}" in
                --tmux|-t|--tmux-vertical|--tmux-horizontal)
                    # After tmux options, expect worktree name
                    local worktrees=\$(_phantom_list_worktrees)
                    COMPREPLY=( \$(compgen -W "\${worktrees}" -- "\${cur}") )
                    return 0
                    ;;
                *)
                    if [[ "\${cur}" == -* ]]; then
                        local opts="--fzf --tmux --tmux-vertical --tmux-horizontal"
                        COMPREPLY=( \$(compgen -W "\${opts}" -- "\${cur}") )
                    else
                        local worktrees=\$(_phantom_list_worktrees)
                        COMPREPLY=( \$(compgen -W "\${worktrees}" -- "\${cur}") )
                    fi
                    return 0
                    ;;
            esac
            ;;
        completion)
            local shells="fish zsh bash"
            COMPREPLY=( \$(compgen -W "\${shells}" -- "\${cur}") )
            return 0
            ;;
        github|gh)
            if [[ \${cword} -eq 2 ]]; then
                # First argument after github/gh should be subcommand
                local subcommands="checkout"
                COMPREPLY=( \$(compgen -W "\${subcommands}" -- "\${cur}") )
                return 0
            elif [[ \${words[2]} == "checkout" ]]; then
                case "\${prev}" in
                    --base)
                        # Don't complete anything specific for base (branch name)
                        return 0
                        ;;
                    *)
                        if [[ \${cword} -eq 3 ]]; then
                            # First argument after checkout should be number
                            return 0
                        else
                            local opts="--base"
                            COMPREPLY=( \$(compgen -W "\${opts}" -- "\${cur}") )
                            return 0
                        fi
                        ;;
                esac
            fi
            return 0
            ;;
        version)
            # No completion for version command
            return 0
            ;;
        mcp)
            local actions="serve"
            COMPREPLY=( \$(compgen -W "\${actions}" -- "\${cur}") )
            return 0
            ;;
        *)
            # Unknown command
            return 0
            ;;
    esac
}

# Register the completion function
complete -F _phantom_completion phantom`;

export function completionHandler(args: string[]): void {
  const shell = args[0];

  if (!shell) {
    output.error("Usage: phantom completion <shell>");
    output.error("Supported shells: fish, zsh, bash");
    exit(1);
  }

  switch (shell.toLowerCase()) {
    case "fish":
      console.log(FISH_COMPLETION_SCRIPT);
      break;
    case "zsh":
      console.log(ZSH_COMPLETION_SCRIPT);
      break;
    case "bash":
      console.log(BASH_COMPLETION_SCRIPT);
      break;
    default:
      output.error(`Unsupported shell: ${shell}`);
      output.error("Supported shells: fish, zsh, bash");
      exit(1);
  }
}
