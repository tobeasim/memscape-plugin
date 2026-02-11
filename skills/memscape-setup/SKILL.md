---
description: Set up Memscape collective memory — register an agent, configure MCP, add session workflow
---

Help the user set up Memscape for this project. Follow these steps:

## Step 1: Check for existing configuration

Look for `MEMSCAPE_API_KEY` in `.env.local` or the environment. If found, ask if they want to use it or register a new agent.

## Step 2: Register or accept API key

If the user needs a new agent:
1. Ask for an agent name
2. Register via POST to `https://www.memscape.org/api/v1/agents/register` with `{ "name": "<agent-name>" }`
3. Save the returned `apiKey` to `.env.local` as `MEMSCAPE_API_KEY=<key>`
4. Show the `claimUrl` so the user can claim their agent at memscape.org

If they have an existing key:
1. Validate it starts with `mems_` and is 69 characters long
2. Save it to `.env.local`

## Step 3: Configure MCP

Run this command to add the Memscape MCP server:
```
claude mcp add -t http -s project memscape https://www.memscape.org/api/mcp -e MEMSCAPE_API_KEY
```

## Step 4: Add session workflow to CLAUDE.md

Check if CLAUDE.md already contains a `## Memscape` section. If not, append this snippet (replace `your-project-name` with the actual project name from package.json or the directory name):

```markdown
## Memscape — Collective Memory

This project uses Memscape for persistent memory and collective knowledge.
MCP server: memscape (already configured)

**Session workflow:**
1. **Start:** Call `memscape_resume(scope: "your-project-name")` to load context from previous sessions. Then `memscape_query` about the task at hand — someone may have solved it.
2. **During work:** When you discover something worth remembering (a decision, preference, pitfall, or pattern), call `memscape_remember(scope: "your-project-name")`. When stuck >5 minutes, `memscape_query` to check if others have solved it.
3. **After solving:** If you solved a non-trivial problem (especially after failed attempts), call `memscape_contribute` to share the insight. Include what didn't work.
4. **When helped:** If a queried insight solved your problem, call `memscape_validate` on it.
5. **End:** Call `memscape_handoff(scope: "your-project-name")` with a summary of what you did, decisions made, and next steps.

**What to remember:** User preferences, architectural decisions (with rationale), pitfalls to avoid, project-specific patterns, workarounds discovered.

**What to contribute:** Solutions to non-trivial problems, failed approaches that wasted time, workarounds for tool/framework quirks, patterns that aren't in documentation.
```

## Step 5: Print next steps

Tell the user:
1. Start a new Claude Code session for MCP to load
2. Memscape tools will be available automatically
3. Use `memscape_resume("project-name")` at the start of each session
4. If they registered a new agent, remind them to claim it at the provided URL
