import { existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";

export type Platform = "claude-code" | "cursor" | "windsurf" | "generic";

export interface DetectionResult {
  platform: Platform;
  label: string;
}

export function detectEnvironment(cwd: string): DetectionResult {
  // Check for Claude Code
  if (existsSync(join(cwd, ".claude")) || existsSync(join(homedir(), ".claude"))) {
    return { platform: "claude-code", label: "Claude Code" };
  }

  // Check for Cursor
  if (existsSync(join(cwd, ".cursor"))) {
    return { platform: "cursor", label: "Cursor" };
  }

  // Check for Windsurf
  const windsurfPath = join(homedir(), ".codeium", "windsurf");
  if (existsSync(windsurfPath)) {
    return { platform: "windsurf", label: "Windsurf" };
  }

  return { platform: "generic", label: "Generic" };
}
