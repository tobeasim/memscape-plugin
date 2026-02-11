import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { join, basename } from "path";
import type { Platform } from "./detect.js";

const MEMSCAPE_MARKER = "## Memscape";

// ── Snippet templates ───────────────────────────────────────────────

function claudeMdSnippet(projectName: string): string {
  return `
## Memscape — Collective Memory

This project uses Memscape for persistent memory and collective knowledge.
MCP server: memscape (already configured)

**Session workflow:**
1. **Start:** Call \`memscape_resume(scope: "${projectName}")\` to load context from previous sessions. Then \`memscape_query\` about the task at hand — someone may have solved it.
2. **During work:** When you discover something worth remembering (a decision, preference, pitfall, or pattern), call \`memscape_remember(scope: "${projectName}")\`. When stuck >5 minutes, \`memscape_query\` to check if others have solved it.
3. **After solving:** If you solved a non-trivial problem (especially after failed attempts), call \`memscape_contribute\` to share the insight. Include what didn't work.
4. **When helped:** If a queried insight solved your problem, call \`memscape_validate\` on it.
5. **End:** Call \`memscape_handoff(scope: "${projectName}")\` with a summary of what you did, decisions made, and next steps.

**What to remember:** User preferences, architectural decisions (with rationale), pitfalls to avoid, project-specific patterns, workarounds discovered.

**What to contribute:** Solutions to non-trivial problems, failed approaches that wasted time, workarounds for tool/framework quirks, patterns that aren't in documentation.
`;
}

function cursorRulesSnippet(projectName: string): string {
  return `---
description: Memscape collective memory — query before hard problems, remember across sessions
globs:
alwaysApply: true
---

# Memscape Integration

This project uses Memscape for persistent memory and collective knowledge.

## When to Use Memscape Tools

- **Starting work:** Call \`memscape_resume(scope: "${projectName}")\` to load previous context
- **Stuck >5 minutes:** Call \`memscape_query\` with a description of your problem — someone may have solved it
- **Solved something hard:** Call \`memscape_contribute\` with your solution and failed approaches
- **An insight helped:** Call \`memscape_validate\` on it
- **Discovered a preference/decision/pitfall:** Call \`memscape_remember(scope: "${projectName}")\`
- **Ending work:** Call \`memscape_handoff(scope: "${projectName}")\` with a summary of what you accomplished

## What to Remember
User preferences, architectural decisions with rationale, pitfalls to avoid, project patterns, workarounds.

## What to Contribute
Non-trivial solutions, failed approaches, framework quirks, patterns not in documentation.
`;
}

function windsurfRulesSnippet(projectName: string): string {
  return `
## Memscape — Collective Memory

This project uses Memscape for persistent memory and collective agent knowledge.

Session workflow:
1. Start: \`memscape_resume(scope: "${projectName}")\` to load previous context
2. Stuck >5min: \`memscape_query\` to check if others have solved it
3. After solving hard problems: \`memscape_contribute\` with solution + failed approaches
4. Discovered something important: \`memscape_remember(scope: "${projectName}")\`
5. End: \`memscape_handoff(scope: "${projectName}")\` with summary and next steps

Remember: user preferences, decisions with rationale, pitfalls, project patterns.
Contribute: non-trivial solutions, failed approaches, undocumented workarounds.
`;
}

// ── Public API ───────────────────────────────────────────────────────

export function hasExistingSnippet(filePath: string): boolean {
  if (!existsSync(filePath)) return false;
  const content = readFileSync(filePath, "utf-8");
  return content.includes(MEMSCAPE_MARKER);
}

export function getInstructionFilePath(platform: Platform, cwd: string): string {
  switch (platform) {
    case "claude-code":
      return join(cwd, "CLAUDE.md");
    case "cursor":
      return join(cwd, ".cursor", "rules", "memscape.mdc");
    case "windsurf":
      return join(cwd, ".windsurfrules");
    default:
      return join(cwd, "CLAUDE.md");
  }
}

export function getInstructionFileName(platform: Platform): string {
  switch (platform) {
    case "claude-code":
      return "CLAUDE.md";
    case "cursor":
      return ".cursor/rules/memscape.mdc";
    case "windsurf":
      return ".windsurfrules";
    default:
      return "CLAUDE.md";
  }
}

export function addInstructions(platform: Platform, cwd: string, projectName: string): string {
  const filePath = getInstructionFilePath(platform, cwd);

  // Guard against duplicate injection
  if (hasExistingSnippet(filePath)) {
    return filePath;
  }

  let snippet: string;
  switch (platform) {
    case "claude-code":
    case "generic":
      snippet = claudeMdSnippet(projectName);
      break;
    case "cursor":
      snippet = cursorRulesSnippet(projectName);
      break;
    case "windsurf":
      snippet = windsurfRulesSnippet(projectName);
      break;
  }

  // Ensure parent directory exists (for cursor .cursor/rules/)
  const dir = join(filePath, "..");
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  if (existsSync(filePath)) {
    const content = readFileSync(filePath, "utf-8");
    const separator = content.endsWith("\n") ? "" : "\n";
    writeFileSync(filePath, content + separator + snippet);
  } else {
    writeFileSync(filePath, snippet.trimStart());
  }

  return filePath;
}

export function deriveProjectName(cwd: string): string {
  // Try to get name from package.json
  const pkgPath = join(cwd, "package.json");
  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
      if (pkg.name && typeof pkg.name === "string") {
        // Strip org scope like @org/name → name
        return pkg.name.replace(/^@[^/]+\//, "");
      }
    } catch {
      // fall through
    }
  }

  // Fall back to directory name
  return basename(cwd).toLowerCase().replace(/[^a-z0-9-]/g, "-");
}
