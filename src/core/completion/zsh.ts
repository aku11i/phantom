export function generateZshCompletion(): string {
  return `#compdef phantom
# Zsh completion script for phantom

_phantom() {
  local context state state_descr line
  typeset -A opt_args

  _arguments -C \\
    '1:command:_phantom_commands' \\
    '*::arg:->args'

  case $state in
    args)
      case $line[1] in
        create)
          _arguments \\
            '(-b --branch)'{-b,--branch}'[Create from specific branch]:branch:_git_branches' \\
            '(-o --open)'{-o,--open}'[Open the worktree after creation]' \\
            '--no-copy[Do not copy files after creation]' \\
            '(-h --help)'{-h,--help}'[Show help]' \\
            '1:name:_phantom_name_suggestion'
          ;;
        delete)
          _arguments \\
            '(-f --force)'{-f,--force}'[Force deletion]' \\
            '(-h --help)'{-h,--help}'[Show help]' \\
            '*:phantom:_phantom_names'
          ;;
        exec)
          _arguments \\
            '(-h --help)'{-h,--help}'[Show help]' \\
            '1:phantom:_phantom_names' \\
            '*:command:_command_names -e'
          ;;
        shell)
          _arguments \\
            '(-h --help)'{-h,--help}'[Show help]' \\
            '1:phantom:_phantom_names'
          ;;
        list)
          _arguments \\
            '--fzf[Use fzf for interactive selection]' \\
            '--format[Output format]:format:(default simple names json)' \\
            '(-h --help)'{-h,--help}'[Show help]'
          ;;
        where)
          _arguments \\
            '(-h --help)'{-h,--help}'[Show help]' \\
            '1:phantom:_phantom_names'
          ;;
        attach)
          _arguments \\
            '(-h --help)'{-h,--help}'[Show help]' \\
            '1:path:_directories'
          ;;
        completion)
          _arguments \\
            '(-h --help)'{-h,--help}'[Show help]' \\
            '1:shell:(bash zsh fish)'
          ;;
        version)
          _arguments \\
            '(-h --help)'{-h,--help}'[Show help]'
          ;;
        help)
          _arguments \\
            '1:command:_phantom_commands'
          ;;
      esac
      ;;
  esac
}

_phantom_commands() {
  local commands=(
    'create:Create a new phantom worktree'
    'delete:Delete phantom worktrees'
    'exec:Execute command in phantom worktree'
    'list:List all phantom worktrees'
    'shell:Open shell in phantom worktree'
    'version:Show version information'
    'where:Show phantom worktree path'
    'attach:Attach an existing worktree as phantom'
    'completion:Generate shell completion script'
    'help:Show help for a command'
  )
  _describe 'command' commands
}

_phantom_names() {
  local phantoms
  phantoms=(\${(f)"$(phantom list --format=names 2>/dev/null)"})
  _describe 'phantom' phantoms
}

_phantom_name_suggestion() {
  _message 'phantom name'
}

_phantom "$@"`;
}
