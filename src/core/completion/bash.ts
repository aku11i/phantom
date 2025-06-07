export function generateBashCompletion(): string {
  return `#!/usr/bin/env bash
# Bash completion script for phantom

_phantom() {
  local cur prev words cword
  _init_completion || return

  local commands="create delete exec list shell version where attach completion help"

  # Handle command completion
  if [[ $cword -eq 1 ]]; then
    COMPREPLY=($(compgen -W "$commands" -- "$cur"))
    return
  fi

  local cmd="\${words[1]}"

  # Handle subcommand options and arguments
  case "$cmd" in
    create)
      if [[ "$cur" == -* ]]; then
        COMPREPLY=($(compgen -W "-b --branch -o --open --no-copy --help -h" -- "$cur"))
      fi
      ;;
    delete)
      if [[ "$cur" == -* ]]; then
        COMPREPLY=($(compgen -W "-f --force --help -h" -- "$cur"))
      else
        # Get phantom names for completion
        local phantoms=$(phantom list --format=names 2>/dev/null)
        COMPREPLY=($(compgen -W "$phantoms" -- "$cur"))
      fi
      ;;
    exec|shell)
      if [[ "$cur" == -* ]]; then
        COMPREPLY=($(compgen -W "--help -h" -- "$cur"))
      elif [[ $cword -eq 2 ]]; then
        # Get phantom names for completion
        local phantoms=$(phantom list --format=names 2>/dev/null)
        COMPREPLY=($(compgen -W "$phantoms" -- "$cur"))
      fi
      ;;
    list)
      if [[ "$cur" == -* ]]; then
        COMPREPLY=($(compgen -W "--fzf --format --help -h" -- "$cur"))
      elif [[ "$prev" == "--format" ]]; then
        COMPREPLY=($(compgen -W "default simple names json" -- "$cur"))
      fi
      ;;
    where)
      if [[ "$cur" == -* ]]; then
        COMPREPLY=($(compgen -W "--help -h" -- "$cur"))
      else
        # Get phantom names for completion
        local phantoms=$(phantom list --format=names 2>/dev/null)
        COMPREPLY=($(compgen -W "$phantoms" -- "$cur"))
      fi
      ;;
    attach)
      if [[ "$cur" == -* ]]; then
        COMPREPLY=($(compgen -W "--help -h" -- "$cur"))
      fi
      ;;
    completion)
      if [[ $cword -eq 2 ]]; then
        COMPREPLY=($(compgen -W "bash zsh fish" -- "$cur"))
      elif [[ "$cur" == -* ]]; then
        COMPREPLY=($(compgen -W "--help -h" -- "$cur"))
      fi
      ;;
    version)
      if [[ "$cur" == -* ]]; then
        COMPREPLY=($(compgen -W "--help -h" -- "$cur"))
      fi
      ;;
    help)
      if [[ $cword -eq 2 ]]; then
        COMPREPLY=($(compgen -W "$commands" -- "$cur"))
      fi
      ;;
  esac
}

complete -F _phantom phantom`;
}
