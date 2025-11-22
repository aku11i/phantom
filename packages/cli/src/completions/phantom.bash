# Bash completion for phantom
# Load with: eval "$(phantom completion bash)"

_phantom_list_worktrees() {
    phantom list --names 2>/dev/null || true
}

_phantom_completion() {
    local cur prev words cword
    _init_completion || return

    local commands="create attach list where delete exec review shell github gh version completion mcp"
    local global_opts="--help --version"

    if [[ ${cword} -eq 1 ]]; then
        # Completing first argument (command)
        COMPREPLY=( $(compgen -W "${commands}" -- "${cur}") )
        return 0
    fi

    local command="${words[1]}"

    case "${command}" in
        create)
            case "${prev}" in
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
                    COMPREPLY=( $(compgen -W "${opts}" -- "${cur}") )
                    return 0
                    ;;
            esac
            ;;
        attach)
            case "${prev}" in
                --exec|-x)
                    # Don't complete anything specific for exec commands
                    return 0
                    ;;
                *)
                    if [[ ${cword} -eq 2 ]]; then
                        # First argument: branch name (not completing - user needs to provide)
                        return 0
                    else
                        local opts="--shell --exec"
                        COMPREPLY=( $(compgen -W "${opts}" -- "${cur}") )
                        return 0
                    fi
                    ;;
            esac
            ;;
        list)
            local opts="--fzf --names"
            COMPREPLY=( $(compgen -W "${opts}" -- "${cur}") )
            return 0
            ;;
        where)
            if [[ "${cur}" == -* ]]; then
                local opts="--fzf"
                COMPREPLY=( $(compgen -W "${opts}" -- "${cur}") )
            else
                local worktrees=$(_phantom_list_worktrees)
                COMPREPLY=( $(compgen -W "${worktrees}" -- "${cur}") )
            fi
            return 0
            ;;
        delete)
            if [[ "${cur}" == -* ]]; then
                local opts="--force --current --fzf"
                COMPREPLY=( $(compgen -W "${opts}" -- "${cur}") )
            else
                local worktrees=$(_phantom_list_worktrees)
                COMPREPLY=( $(compgen -W "${worktrees}" -- "${cur}") )
            fi
            return 0
            ;;
        exec)
            case "${prev}" in
                --tmux|-t|--tmux-vertical|--tmux-horizontal)
                    # After tmux options, expect worktree name
                    local worktrees=$(_phantom_list_worktrees)
                    COMPREPLY=( $(compgen -W "${worktrees}" -- "${cur}") )
                    return 0
                    ;;
                *)
                    if [[ "${cur}" == -* ]]; then
                        local opts="--fzf --tmux --tmux-vertical --tmux-horizontal"
                        COMPREPLY=( $(compgen -W "${opts}" -- "${cur}") )
                    elif [[ ${cword} -eq 2 ]] || [[ " ${words[@]} " =~ " --fzf " && ${cword} -eq 3 ]]; then
                        # First non-option argument should be worktree name
                        local worktrees=$(_phantom_list_worktrees)
                        COMPREPLY=( $(compgen -W "${worktrees}" -- "${cur}") )
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
            case "${prev}" in
                --base)
                    # Don't complete anything specific for base reference
                    return 0
                    ;;
                *)
                    if [[ "${cur}" == -* ]]; then
                        local opts="--fzf --base"
                        COMPREPLY=( $(compgen -W "${opts}" -- "${cur}") )
                    else
                        local worktrees=$(_phantom_list_worktrees)
                        COMPREPLY=( $(compgen -W "${worktrees}" -- "${cur}") )
                    fi
                    return 0
                    ;;
            esac
            ;;
        shell)
            case "${prev}" in
                --tmux|-t|--tmux-vertical|--tmux-horizontal)
                    # After tmux options, expect worktree name
                    local worktrees=$(_phantom_list_worktrees)
                    COMPREPLY=( $(compgen -W "${worktrees}" -- "${cur}") )
                    return 0
                    ;;
                *)
                    if [[ "${cur}" == -* ]]; then
                        local opts="--fzf --tmux --tmux-vertical --tmux-horizontal"
                        COMPREPLY=( $(compgen -W "${opts}" -- "${cur}") )
                    else
                        local worktrees=$(_phantom_list_worktrees)
                        COMPREPLY=( $(compgen -W "${worktrees}" -- "${cur}") )
                    fi
                    return 0
                    ;;
            esac
            ;;
        completion)
            local shells="fish zsh bash"
            COMPREPLY=( $(compgen -W "${shells}" -- "${cur}") )
            return 0
            ;;
        github|gh)
            if [[ ${cword} -eq 2 ]]; then
                # First argument after github/gh should be subcommand
                local subcommands="checkout"
                COMPREPLY=( $(compgen -W "${subcommands}" -- "${cur}") )
                return 0
            elif [[ ${words[2]} == "checkout" ]]; then
                case "${prev}" in
                    --base)
                        # Don't complete anything specific for base (branch name)
                        return 0
                        ;;
                    *)
                        if [[ ${cword} -eq 3 ]]; then
                            # First argument after checkout should be number
                            return 0
                        else
                            local opts="--base"
                            COMPREPLY=( $(compgen -W "${opts}" -- "${cur}") )
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
            COMPREPLY=( $(compgen -W "${actions}" -- "${cur}") )
            return 0
            ;;
        *)
            # Unknown command
            return 0
            ;;
    esac
}

# Register the completion function
if [[ "${BASH_VERSINFO[0]}" -eq 4 && "${BASH_VERSINFO[1]}" -ge 4 || "${BASH_VERSINFO[0]}" -gt 4 ]]; then
    complete -F _phantom_completion -o nosort -o bashdefault -o default phantom
else
    complete -F _phantom_completion -o bashdefault -o default phantom
fi
