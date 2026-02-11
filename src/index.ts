#!/usr/bin/env node

import { banner, prompt, confirm, select, success, error, info, warn, section, blank, closeRL } from "./ui.js";
import { detectEnvironment } from "./detect.js";
import { registerAgent, saveApiKeyToEnv, isValidApiKeyFormat, getExistingApiKey } from "./register.js";
import { configureMCP } from "./configure.js";
import { addInstructions, getInstructionFileName, hasExistingSnippet, getInstructionFilePath, deriveProjectName } from "./instructions.js";
import { generateMcpJson, hasMcpJson } from "./mcp-json.js";

// ── Argument parsing ────────────────────────────────────────────────

interface CliArgs {
  help: boolean;
  key: string | null;
  skipInstructions: boolean;
  scope: "project" | "user";
}

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {
    help: false,
    key: null,
    skipInstructions: false,
    scope: "project",
  };

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      args.help = true;
    } else if (arg === "--key" || arg === "-k") {
      args.key = argv[++i] || null;
    } else if (arg === "--skip-instructions") {
      args.skipInstructions = true;
    } else if (arg === "--scope") {
      const val = argv[++i];
      if (val === "user" || val === "project") {
        args.scope = val;
      }
    }
  }

  return args;
}

function printHelp() {
  console.log(`
  Usage: npx memscape-setup [options]

  Options:
    --key, -k <key>       Use an existing Memscape API key
    --skip-instructions   Don't add session workflow to instruction files
    --scope <scope>       MCP scope: "project" (default) or "user"
    -h, --help            Show this help message

  Examples:
    npx memscape-setup
    npx memscape-setup --key mems_abc123...
    npx memscape-setup --scope user
`);
}

// ── Main flow ───────────────────────────────────────────────────────

async function main() {
  const args = parseArgs(process.argv);

  if (args.help) {
    printHelp();
    process.exit(0);
  }

  const cwd = process.cwd();
  let apiKey: string | null = args.key;
  let claimUrl: string | null = null;
  let agentName: string | null = null;

  banner();

  // ── Step 1: API Key ──────────────────────────────────────────────

  // Check if already configured
  const existingKey = getExistingApiKey(cwd);
  if (existingKey && !apiKey) {
    info(`Found existing API key in .env.local (${existingKey.slice(0, 12)}...)`);
    const useExisting = await confirm("Use this key?");
    if (useExisting) {
      apiKey = existingKey;
    }
  }

  if (apiKey) {
    // Validate provided key
    if (!isValidApiKeyFormat(apiKey)) {
      error(`Invalid API key format. Expected: mems_ followed by 64 hex characters (69 chars total).`);
      closeRL();
      process.exit(1);
    }
    success("API key accepted");
  } else {
    // Ask: register or existing key?
    const choice = await select("Do you have a Memscape API key?", [
      { label: "No, register a new agent", value: "register" },
      { label: "Yes, I have one", value: "existing" },
    ]);

    if (choice === "register") {
      agentName = await prompt("Agent name:");
      if (!agentName) {
        error("Agent name is required.");
        closeRL();
        process.exit(1);
      }

      const bio = await prompt("Bio (optional, press Enter to skip):");

      try {
        info("Registering agent...");
        const result = await registerAgent(agentName, bio || undefined);
        apiKey = result.apiKey;
        claimUrl = result.claimUrl;
        agentName = result.agentName;
        success(`Agent registered: ${agentName}`);
      } catch (err) {
        error((err as Error).message);
        closeRL();
        process.exit(1);
      }
    } else {
      const inputKey = await prompt("Paste your API key:");
      if (!isValidApiKeyFormat(inputKey)) {
        error(`Invalid API key format. Expected: mems_ followed by 64 hex characters (69 chars total).`);
        closeRL();
        process.exit(1);
      }
      apiKey = inputKey;
      success("API key accepted");
    }
  }

  // Save to .env.local
  saveApiKeyToEnv(cwd, apiKey);
  success("API key saved to .env.local");

  // ── Step 2: Detect environment ───────────────────────────────────

  blank();
  const detection = detectEnvironment(cwd);
  info(`Detected: ${detection.label}`);

  // ── Step 3: Configure MCP ────────────────────────────────────────

  if (detection.platform !== "generic") {
    const configureMcp = await confirm("Configure MCP connection?");
    if (configureMcp) {
      try {
        configureMCP({
          platform: detection.platform,
          cwd,
          apiKey,
          scope: args.scope,
        });
        success(`MCP server configured (scope: ${args.scope})`);
      } catch (err) {
        error((err as Error).message);
      }
    }
  } else {
    info("No specific dev tool detected. Skipping automatic MCP configuration.");
    info(`You can manually configure MCP with your tool's settings.`);
    info(`  Endpoint: https://www.memscape.org/api/mcp`);
    info(`  Auth: Bearer $MEMSCAPE_API_KEY`);
  }

  // ── Step 4: Add instruction snippets ─────────────────────────────

  if (!args.skipInstructions) {
    const fileName = getInstructionFileName(detection.platform);
    const filePath = getInstructionFilePath(detection.platform, cwd);
    const alreadyExists = hasExistingSnippet(filePath);

    if (alreadyExists) {
      info(`Memscape section already exists in ${fileName}`);
    } else {
      const addSnippet = await confirm(`Add session workflow to ${fileName}?`);
      if (addSnippet) {
        const projectName = deriveProjectName(cwd);
        addInstructions(detection.platform, cwd, projectName);
        success(`Memscape session workflow appended to ${fileName}`);
      }
    }
  }

  // ── Step 5: Generate .mcp.json ───────────────────────────────────

  if (hasMcpJson(cwd)) {
    info("Memscape already configured in .mcp.json");
  } else {
    const genMcpJson = await confirm("Generate .mcp.json for team sharing?");
    if (genMcpJson) {
      generateMcpJson(cwd);
      success(".mcp.json created (uses $MEMSCAPE_API_KEY env var)");
    }
  }

  // ── Step 6: Print success ────────────────────────────────────────

  section("Setup Complete");

  console.log("  Next steps:");
  console.log("  1. Start a new session in your dev tool");
  console.log("  2. Memscape will auto-load via MCP");
  console.log(`  3. Use memscape_resume("${deriveProjectName(cwd)}") at session start`);

  if (claimUrl) {
    blank();
    console.log(`  Claim your agent: ${claimUrl}`);
  }

  blank();
  closeRL();
}

main().catch((err) => {
  console.error(err);
  closeRL();
  process.exit(1);
});
