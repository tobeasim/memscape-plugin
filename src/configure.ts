import { execSync } from "child_process";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import type { Platform } from "./detect.js";

const MCP_URL = "https://www.memscape.org/api/mcp";

export interface ConfigureOptions {
  platform: Platform;
  cwd: string;
  apiKey: string;
  scope?: "project" | "user";
}

export function configureMCP(options: ConfigureOptions): void {
  switch (options.platform) {
    case "claude-code":
      configureClaudeCode(options);
      break;
    case "cursor":
      configureCursor(options);
      break;
    case "windsurf":
      configureWindsurf(options);
      break;
    case "generic":
      // No automatic configuration for generic environments
      break;
  }
}

function configureClaudeCode(options: ConfigureOptions): void {
  const scope = options.scope || "project";

  // Use claude CLI to add MCP server
  // The -e flag tells claude to read the key from an environment variable
  try {
    execSync(
      `claude mcp add -t http -s ${scope} memscape ${MCP_URL} -e MEMSCAPE_API_KEY`,
      {
        cwd: options.cwd,
        stdio: "pipe",
      }
    );
  } catch (err) {
    // If claude CLI is not found, provide manual instructions
    const error = err as NodeJS.ErrnoException;
    if (error.code === "ENOENT" || (error.message && error.message.includes("not found"))) {
      throw new Error(
        "Claude CLI not found. Install it first: https://docs.anthropic.com/en/docs/claude-code\n" +
        "  Then run: claude mcp add -t http -s project memscape " + MCP_URL + " -e MEMSCAPE_API_KEY"
      );
    }
    throw err;
  }
}

function configureCursor(options: ConfigureOptions): void {
  const mcpDir = join(options.cwd, ".cursor");
  const mcpPath = join(mcpDir, "mcp.json");

  if (!existsSync(mcpDir)) {
    mkdirSync(mcpDir, { recursive: true });
  }

  let config: Record<string, unknown> = {};
  if (existsSync(mcpPath)) {
    try {
      config = JSON.parse(readFileSync(mcpPath, "utf-8"));
    } catch {
      // Start fresh if invalid JSON
    }
  }

  const mcpServers = (config.mcpServers || {}) as Record<string, unknown>;
  mcpServers.memscape = {
    url: MCP_URL,
    headers: {
      Authorization: "Bearer ${MEMSCAPE_API_KEY}",
    },
  };
  config.mcpServers = mcpServers;

  writeFileSync(mcpPath, JSON.stringify(config, null, 2) + "\n");
}

function configureWindsurf(options: ConfigureOptions): void {
  const configDir = join(homedir(), ".codeium", "windsurf");
  const configPath = join(configDir, "mcp_config.json");

  if (!existsSync(configDir)) {
    mkdirSync(configDir, { recursive: true });
  }

  let config: Record<string, unknown> = {};
  if (existsSync(configPath)) {
    try {
      config = JSON.parse(readFileSync(configPath, "utf-8"));
    } catch {
      // Start fresh if invalid JSON
    }
  }

  const mcpServers = (config.mcpServers || {}) as Record<string, unknown>;
  mcpServers.memscape = {
    url: MCP_URL,
    headers: {
      Authorization: `Bearer ${options.apiKey}`,
    },
  };
  config.mcpServers = mcpServers;

  writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n");
}
