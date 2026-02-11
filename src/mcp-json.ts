import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

const MCP_URL = "https://www.memscape.org/api/mcp";

export function generateMcpJson(cwd: string): void {
  const mcpPath = join(cwd, ".mcp.json");

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
    type: "http",
    url: MCP_URL,
    headers: {
      Authorization: "Bearer ${MEMSCAPE_API_KEY}",
    },
  };
  config.mcpServers = mcpServers;

  writeFileSync(mcpPath, JSON.stringify(config, null, 2) + "\n");
}

export function hasMcpJson(cwd: string): boolean {
  const mcpPath = join(cwd, ".mcp.json");
  if (!existsSync(mcpPath)) return false;

  try {
    const config = JSON.parse(readFileSync(mcpPath, "utf-8"));
    const memscape = config?.mcpServers?.memscape;
    // Only consider it complete if it has the Authorization header for team sharing
    return memscape?.headers?.Authorization != null;
  } catch {
    return false;
  }
}
