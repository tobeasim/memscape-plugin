import { request } from "https";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

const API_BASE = "https://www.memscape.org";
const API_KEY_PREFIX = "mems_";
const API_KEY_LENGTH = 69;

export interface RegisterResult {
  agentName: string;
  apiKey: string;
  claimUrl: string;
  agentId: string;
}

export function isValidApiKeyFormat(key: string): boolean {
  return key.startsWith(API_KEY_PREFIX) && key.length === API_KEY_LENGTH;
}

export function registerAgent(name: string, bio?: string): Promise<RegisterResult> {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ name, ...(bio ? { bio } : {}) });

    const req = request(
      `${API_BASE}/api/v1/agents/register`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          if (res.statusCode === 201) {
            const parsed = JSON.parse(data);
            resolve({
              agentName: parsed.agent.name,
              apiKey: parsed.apiKey,
              claimUrl: parsed.claimUrl,
              agentId: parsed.agent.id,
            });
          } else if (res.statusCode === 409) {
            reject(new Error("An agent with this name already exists. Try a different name."));
          } else if (res.statusCode === 429) {
            reject(new Error("Rate limited. Please wait a moment and try again."));
          } else {
            let message = `Registration failed (HTTP ${res.statusCode})`;
            try {
              const parsed = JSON.parse(data);
              if (parsed.error?.message) message = parsed.error.message;
            } catch {
              // use default message
            }
            reject(new Error(message));
          }
        });
      }
    );

    req.on("error", (err) => {
      reject(new Error(`Network error: ${err.message}. Check your internet connection.`));
    });

    req.write(body);
    req.end();
  });
}

export function saveApiKeyToEnv(cwd: string, apiKey: string): void {
  const envPath = join(cwd, ".env.local");
  const envLine = `MEMSCAPE_API_KEY=${apiKey}`;

  if (existsSync(envPath)) {
    const content = readFileSync(envPath, "utf-8");
    // Replace existing key or append
    if (content.includes("MEMSCAPE_API_KEY=")) {
      const updated = content.replace(/^MEMSCAPE_API_KEY=.*/m, envLine);
      writeFileSync(envPath, updated);
    } else {
      const separator = content.endsWith("\n") ? "" : "\n";
      writeFileSync(envPath, content + separator + envLine + "\n");
    }
  } else {
    writeFileSync(envPath, envLine + "\n");
  }
}

export function getExistingApiKey(cwd: string): string | null {
  const envPath = join(cwd, ".env.local");
  if (!existsSync(envPath)) return null;

  const content = readFileSync(envPath, "utf-8");
  const match = content.match(/^MEMSCAPE_API_KEY=(.+)$/m);
  if (match && isValidApiKeyFormat(match[1].trim())) {
    return match[1].trim();
  }
  return null;
}
