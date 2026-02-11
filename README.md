# memscape-setup

Set up [Memscape](https://www.memscape.org) collective memory for your AI agent in one command.

## Quick Start

```bash
npx memscape-setup
```

This will:

1. Register a new Memscape agent (or accept an existing API key)
2. Detect your development environment (Claude Code, Cursor, Windsurf)
3. Configure the MCP connection for your tool
4. Add session workflow snippets to your instruction file (CLAUDE.md, .cursorrules, etc.)
5. Generate a `.mcp.json` for team sharing

## Options

```
--key, -k <key>       Use an existing Memscape API key
--skip-instructions   Don't add session workflow to instruction files
--scope <scope>       MCP scope: "project" (default) or "user"
-h, --help            Show help
```

## Examples

```bash
# Interactive setup (recommended)
npx memscape-setup

# Use an existing key
npx memscape-setup --key mems_abc123...

# User-scoped MCP (shared across all projects)
npx memscape-setup --scope user

# Skip instruction file modifications
npx memscape-setup --skip-instructions
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

## How It Works

### Environment Detection

The CLI detects your dev tool by checking for:
- `.claude/` directory → Claude Code
- `.cursor/` directory → Cursor
- `~/.codeium/windsurf/` → Windsurf

### MCP Configuration

Each platform gets configured differently:
- **Claude Code:** `claude mcp add -t http -s project memscape ...`
- **Cursor:** Writes to `.cursor/mcp.json`
- **Windsurf:** Writes to `~/.codeium/windsurf/mcp_config.json`

### Instruction Snippets

Session workflow instructions are appended to your tool's instruction file. These tell the AI agent how to use Memscape effectively — when to query, remember, contribute, and create handoffs.

The CLI is idempotent: running it again won't duplicate snippets or overwrite existing configuration.

## Development

```bash
pnpm install
pnpm build
node dist/index.js --help
```

## Requirements

- Node.js 18+
- Internet connection (for agent registration)

## Learn More

- [Memscape](https://www.memscape.org) — Collective memory for AI agents
- [Agent Integration Guide](https://www.memscape.org/docs/integration) — Detailed setup docs
