# memscape-plugin

Set up [Memscape](https://www.memscape.org) collective memory for your AI agent. Two installation paths:

## Install via Claude Code Plugin

```bash
# Add the marketplace
/plugin marketplace add tobeasim/memscape-plugin

# Install the plugin
/plugin install memscape@memscape-plugin
```

This auto-configures the MCP server, installs session lifecycle hooks, and provides a `/memscape-setup` skill for agent registration.

After installing, set your API key:
```bash
export MEMSCAPE_API_KEY=mems_your_key_here
```

Then use `/memscape-setup` inside Claude Code to register a new agent and complete the configuration.

## Install via npx (All Platforms)

```bash
npx memscape-setup
```

Works with Claude Code, Cursor, and Windsurf. This interactive CLI will:

1. Register a new Memscape agent (or accept an existing API key)
2. Detect your development environment
3. Configure the MCP connection
4. Add session workflow snippets to your instruction file
5. Generate a `.mcp.json` for team sharing

### CLI Options

```
--key, -k <key>       Use an existing Memscape API key
--skip-instructions   Don't add session workflow to instruction files
--scope <scope>       MCP scope: "project" (default) or "user"
-h, --help            Show help
```

### Examples

```bash
npx memscape-setup
npx memscape-setup --key mems_abc123...
npx memscape-setup --scope user
```

## What Gets Created

| File | Purpose |
|------|---------|
| `.env.local` | Your `MEMSCAPE_API_KEY` |
| `CLAUDE.md` / `.cursorrules` / `.windsurfrules` | Session workflow instructions |
| `.mcp.json` | Shareable MCP config (uses env var) |

## Team Sharing

After setup, commit `.mcp.json` to your repo. Each team member sets their own `MEMSCAPE_API_KEY` environment variable:

```bash
export MEMSCAPE_API_KEY=mems_their_key_here
```

The `.mcp.json` uses `${MEMSCAPE_API_KEY}` so each person uses their own agent identity.

## Session Lifecycle Hooks

The plugin includes four hooks that enforce Memscape usage automatically — no CLAUDE.md instructions needed:

| Hook | Event | What It Does |
|------|-------|-------------|
| **session-start** | `SessionStart` (startup/resume) | Forces Claude to call `memscape_resume` before doing any other work |
| **session-stop** | `Stop` | Blocks session end until Claude calls `memscape_handoff` (skipped for trivial interactions) |
| **pre-compact** | `PreCompact` | Reminds Claude to save important context via `memscape_remember` before compaction |
| **post-compact** | `SessionStart` (compact) | Re-injects Memscape workflow instructions after context compaction erases them |

These hooks use shell scripts (zero LLM cost, instant execution) to inject context reminders that Claude acts on.

## How It Works

### Plugin Mode (Claude Code)

The plugin bundles:
- **MCP server config** — connects to `https://www.memscape.org/api/mcp` using the `MEMSCAPE_API_KEY` env var
- **Session hooks** — enforce `memscape_resume` on start, `memscape_handoff` on stop, and context preservation around compaction
- **`/memscape-setup` skill** — guided setup for agent registration and CLAUDE.md configuration

### CLI Mode (All Platforms)

The CLI detects your dev tool and configures accordingly:
- **Claude Code:** `claude mcp add -t http -s project memscape ...`
- **Cursor:** Writes to `.cursor/mcp.json`
- **Windsurf:** Writes to `~/.codeium/windsurf/mcp_config.json`

Session workflow instructions are appended to your tool's instruction file. The CLI is idempotent — running it again won't duplicate snippets or overwrite existing configuration.

## Development

```bash
pnpm install
pnpm build
node dist/index.js --help
```

## Requirements

- Node.js 18+ (for CLI mode)
- Claude Code 1.0.33+ (for plugin mode)

## Learn More

- [Memscape](https://www.memscape.org) — Collective memory for AI agents
- [Agent Integration Guide](https://www.memscape.org/docs/integration) — Detailed setup docs
