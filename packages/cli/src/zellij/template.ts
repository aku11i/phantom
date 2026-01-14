/**
 * Default Zellij layout template with comprehensive documentation
 * All optional configurations are shown as comments for users to uncomment as needed
 */
export const DEFAULT_LAYOUT_TEMPLATE = `// =============================================================================
// Phantom Zellij Layout Template
// =============================================================================
// This is the default layout for Phantom's Zellij integration.
// Customize this file to match your workflow.
//
// For full Zellij layout documentation, see:
// https://zellij.dev/documentation/layouts
// =============================================================================

layout {
    // -------------------------------------------------------------------------
    // Working Directory
    // -------------------------------------------------------------------------
    // Uncomment to set a default working directory for all panes.
    // When launched via 'phantom launch', this is automatically set to the
    // worktree path.
    //
    // cwd "/path/to/your/project"

    // -------------------------------------------------------------------------
    // Tab Bar and Status Bar
    // -------------------------------------------------------------------------
    // These define the standard Zellij UI elements:
    // - tab_bar: Shows tabs at the top of the terminal
    // - status_bar: Shows keybinding hints at the bottom
    //
    // To HIDE these bars, simply remove or comment out the pane blocks below.
    // The "borderless=true" ensures they blend seamlessly with the terminal.

    // Tab bar at the top - shows session name and tab list
    pane size=1 borderless=true {
        plugin location="tab-bar"
    }

    // -------------------------------------------------------------------------
    // Default Layout: Agent on left, two shell panes stacked on right
    // -------------------------------------------------------------------------
    pane split_direction="vertical" {

        // ---------------------------------------------------------------------
        // AI Agent Pane (Left side, 50%)
        // ---------------------------------------------------------------------
        // The main AI coding assistant pane, focused by default.
        // Modify the command and args to use a different AI tool.
        pane size="50%" focus=true {
            name "agent"
            command "claude"
            // args "--model" "opus"     // Pass arguments to the agent
            // args "--dangerously-skip-permissions"  // Skip permission prompts
        }

        // ---------------------------------------------------------------------
        // Shell Panes (Right side, 50%)
        // ---------------------------------------------------------------------
        // Two stacked shell panes for running commands, tests, etc.
        pane size="50%" split_direction="horizontal" {
            pane {
                name "shell"
                // command "zsh"         // Override default shell
                // args "-l"             // Shell arguments
            }
            pane {
                name "shell2"
                // command "zsh"
            }
        }
    }

    // Status bar at the bottom - shows keybinding hints and mode indicator
    pane size=2 borderless=true {
        plugin location="status-bar"
    }

    // -------------------------------------------------------------------------
    // Alternative Layouts
    // -------------------------------------------------------------------------
    // To use an alternative layout, comment out the default layout above
    // (the pane split_direction="vertical" block) and uncomment one below.
    // Keep the tab_bar and status_bar panes to retain the UI elements.

    // =========================================================================
    // LAYOUT OPTION 2: Three-column layout
    // =========================================================================
    // Useful for larger screens with file explorer, agent, and terminals.
    //
    // pane split_direction="vertical" {
    //     pane size="20%" {
    //         name "files"
    //         command "yazi"          // or "ranger", "lf", etc.
    //     }
    //     pane size="50%" focus=true {
    //         name "agent"
    //         command "claude"
    //     }
    //     pane size="30%" split_direction="horizontal" {
    //         pane {
    //             name "shell"
    //         }
    //         pane {
    //             name "tests"
    //             command "npm"
    //             args "run" "test:watch"
    //         }
    //     }
    // }

    // =========================================================================
    // LAYOUT OPTION 3: Stacked layout (agent on top, shells below)
    // =========================================================================
    // Better for ultrawide monitors.
    //
    // pane split_direction="horizontal" {
    //     pane size="60%" focus=true {
    //         name "agent"
    //         command "claude"
    //     }
    //     pane size="40%" split_direction="vertical" {
    //         pane size="33%" {
    //             name "shell"
    //         }
    //         pane size="33%" {
    //             name "server"
    //             command "npm"
    //             args "run" "dev"
    //         }
    //         pane size="34%" {
    //             name "tests"
    //             command "npm"
    //             args "run" "test:watch"
    //         }
    //     }
    // }

    // =========================================================================
    // LAYOUT OPTION 4: Minimal (agent only)
    // =========================================================================
    // Single pane with just the AI agent. Use Zellij keybindings to spawn
    // additional panes as needed.
    //
    // pane focus=true {
    //     name "agent"
    //     command "claude"
    // }

    // -------------------------------------------------------------------------
    // UI Elements Reference
    // -------------------------------------------------------------------------
    // Tab Bar (top):
    //   pane size=1 borderless=true { plugin location="tab-bar" }
    //   - Shows: session name, tab list, current mode
    //   - size=1 means 1 row height
    //
    // Status Bar (bottom):
    //   pane size=2 borderless=true { plugin location="status-bar" }
    //   - Shows: keybinding hints for current mode
    //   - size=2 means 2 rows height (fits the hint text)
    //
    // Compact Status Bar (1 line):
    //   pane size=1 borderless=true { plugin location="compact-bar" }
    //   - Combined tab bar + status in a single line
    //
    // To hide UI elements: Remove or comment out the plugin panes

    // -------------------------------------------------------------------------
    // Pane Properties Reference
    // -------------------------------------------------------------------------
    // size="50%"           - Pane size as percentage
    // size=1               - Pane size as fixed rows/columns
    // focus=true           - Start with this pane focused
    // name "pane-name"     - Name shown in Zellij tab bar
    // command "cmd"        - Command to run in pane
    // args "arg1" "arg2"   - Arguments for the command
    // cwd "/path"          - Working directory for this pane
    // split_direction      - "vertical" (left/right) or "horizontal" (top/bottom)
    // borderless=true      - Hide pane borders
    // start_suspended=true - Start pane suspended (press Enter to run)

    // -------------------------------------------------------------------------
    // Zellij Keybindings (defaults)
    // -------------------------------------------------------------------------
    // Ctrl+p n   - New pane
    // Ctrl+p d   - Close pane
    // Ctrl+p h/j/k/l - Navigate panes (or arrow keys)
    // Alt+arrows - Navigate panes directly (may need terminal config on Mac)
    // Ctrl+t n   - New tab
    // Ctrl+t h/l - Switch tabs left/right
    // Ctrl+n     - Resize mode
    // Ctrl+h     - Move mode
    // Ctrl+s     - Search mode
    // Ctrl+o     - Session manager
    // Ctrl+q     - Quit Zellij
}
`;
