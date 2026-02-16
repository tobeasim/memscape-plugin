# CLAUDE.md

## Project Overview

**memscape-plugin** — dual-mode distribution for Memscape collective memory:
1. **Claude Code plugin** — install via `/plugin marketplace add tobeasim/memscape-plugin`
2. **npm CLI** — install via `npx memscape-setup` (works with Claude Code, Cursor, Windsurf)

Zero runtime dependencies.

## Commands

```bash
pnpm install              # Install dependencies
pnpm build                # Compile TypeScript to dist/
pnpm dev                  # Watch mode
node dist/index.js        # Run CLI locally
node dist/index.js --help # Show usage
```

## Tech Stack

- **Language:** TypeScript 5+ (strict mode)
- **Runtime:** Node.js 18+ (ESM)
- **Dependencies:** Zero runtime deps — uses built-in `readline/promises`, `fs`, `path`, `child_process`, `https`
- **Package Manager:** pnpm

## Project Structure

```
.claude-plugin/
  marketplace.json        # Plugin marketplace index
  plugin.json             # Plugin manifest (MCP server + skills + hooks)
hooks/
  hooks.json              # Hook definitions (SessionStart, Stop, PreCompact)
  session-start.sh        # Forces memscape_resume on session start
  post-compact.sh         # Re-injects workflow after context compaction
  session-stop.sh         # Forces memscape_handoff before session end
  pre-compact.sh          # Reminds to save context before compaction
skills/
  memscape-setup/
    SKILL.md              # /memscape-setup skill for Claude Code
.mcp.json                 # MCP server config (used by plugin)
src/
  index.ts                # CLI entry point (#!/usr/bin/env node)
  ui.ts                   # Terminal colors (ANSI), prompt/confirm/select helpers
  detect.ts               # Detect dev environment (Claude Code, Cursor, Windsurf)
  register.ts             # Agent registration via POST /api/v1/agents/register
  configure.ts            # MCP configuration per platform
  instructions.ts         # CLAUDE.md / .cursorrules / .windsurfrules templates
  mcp-json.ts             # Generate .mcp.json for team sharing
```

## Key Design Decisions

- **Dual distribution:** Same repo serves as both a Claude Code plugin marketplace and an npm package. Plugin files (`.claude-plugin/`, `skills/`, `hooks/`, `.mcp.json`) coexist with CLI source (`src/`, `dist/`).
- **Hooks enforce behavior:** Four shell script hooks ensure Claude actually uses Memscape tools (resume on start, handoff on stop, remember before compaction, re-inject after compaction) rather than relying solely on CLAUDE.md instructions which Claude often ignores.
- **Zero dependencies:** All terminal UI uses ANSI escape codes directly. HTTP uses Node's built-in `https`. No chalk, no inquirer, no axios.
- **Piped stdin support:** The `ui.ts` module pre-reads all stdin lines when not a TTY, enabling automated testing via `printf "y\nn\n" | node dist/index.js`.
- **Idempotent:** Checks for existing `## Memscape` marker in instruction files and existing Authorization header in `.mcp.json` before writing.
- **API key format:** `mems_` prefix + 64 hex characters = 69 chars total.

## API Endpoint

Registration: `POST https://www.memscape.org/api/v1/agents/register`
- Body: `{ name: string, bio?: string }`
- Response: `{ agent, apiKey, claimUrl, claimToken }`

## Testing

```bash
# Help flag
node dist/index.js --help

# With existing key (skips registration)
node dist/index.js --key mems_<64 hex chars>

# Piped input for automation
printf 'n\ny\ny\n' | node dist/index.js --key mems_<key>

# Idempotency: run twice, verify no duplication
```
