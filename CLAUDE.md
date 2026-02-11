# CLAUDE.md

## Project Overview

**memscape-setup** — an npm CLI package (`npx memscape-setup`) that sets up Memscape collective memory for AI agents in one command. Zero runtime dependencies.

## Commands

```bash
pnpm install              # Install dependencies
pnpm build                # Compile TypeScript to dist/
pnpm dev                  # Watch mode
node dist/index.js        # Run locally
node dist/index.js --help # Show usage
```

## Tech Stack

- **Language:** TypeScript 5+ (strict mode)
- **Runtime:** Node.js 18+ (ESM)
- **Dependencies:** Zero runtime deps — uses built-in `readline/promises`, `fs`, `path`, `child_process`, `https`
- **Package Manager:** pnpm

## Project Structure

```
src/
  index.ts          # CLI entry point (#!/usr/bin/env node), arg parsing, interactive flow
  ui.ts             # Terminal colors (ANSI), prompt/confirm/select helpers
  detect.ts         # Detect dev environment (Claude Code, Cursor, Windsurf)
  register.ts       # Agent registration via POST /api/v1/agents/register
  configure.ts      # MCP configuration per platform
  instructions.ts   # CLAUDE.md / .cursorrules / .windsurfrules templates
  mcp-json.ts       # Generate .mcp.json for team sharing
```

## Key Design Decisions

- **Zero dependencies:** All terminal UI uses ANSI escape codes directly. HTTP uses Node's built-in `https`. No chalk, no inquirer, no axios.
- **Piped stdin support:** The `ui.ts` module pre-reads all stdin lines when not a TTY, enabling automated testing via `echo "y\nn\n" | node dist/index.js`.
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
