import { createInterface } from "readline/promises";
import { stdin, stdout } from "process";

// ANSI color codes
const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";
const RED = "\x1b[31m";
const MAGENTA = "\x1b[35m";

export const colors = {
  bold: (s: string) => `${BOLD}${s}${RESET}`,
  dim: (s: string) => `${DIM}${s}${RESET}`,
  green: (s: string) => `${GREEN}${s}${RESET}`,
  yellow: (s: string) => `${YELLOW}${s}${RESET}`,
  cyan: (s: string) => `${CYAN}${s}${RESET}`,
  red: (s: string) => `${RED}${s}${RESET}`,
  magenta: (s: string) => `${MAGENTA}${s}${RESET}`,
  success: (s: string) => `${GREEN}${BOLD}✓${RESET} ${s}`,
  error: (s: string) => `${RED}${BOLD}✗${RESET} ${s}`,
  info: (s: string) => `${CYAN}ℹ${RESET} ${s}`,
  warn: (s: string) => `${YELLOW}⚠${RESET} ${s}`,
};

// When stdin is piped, pre-read all lines into a queue
// because readline/promises doesn't handle multiple question() calls with piped input
let pipedLines: string[] | null = null;
let pipedReady: Promise<void> | null = null;

function initPipedInput() {
  if (pipedReady) return pipedReady;
  if (stdin.isTTY) return Promise.resolve();

  pipedReady = new Promise<void>((resolve) => {
    let buffer = "";
    stdin.setEncoding("utf-8");
    stdin.on("data", (chunk) => {
      buffer += chunk;
    });
    stdin.on("end", () => {
      pipedLines = buffer.split("\n");
      resolve();
    });
    stdin.resume();
  });
  return pipedReady;
}

let rl: ReturnType<typeof createInterface> | null = null;

function getRL() {
  if (!rl) {
    rl = createInterface({ input: stdin, output: stdout });
  }
  return rl;
}

export function closeRL() {
  if (rl) {
    rl.close();
    rl = null;
  }
}

async function readLine(questionText: string): Promise<string> {
  // For piped input, use pre-read queue
  if (!stdin.isTTY) {
    await initPipedInput();
    if (pipedLines && pipedLines.length > 0) {
      const line = pipedLines.shift()!;
      // Still print the prompt + answer for visibility
      process.stdout.write(questionText + line + "\n");
      return line;
    }
    // No more piped input, return empty
    process.stdout.write(questionText + "\n");
    return "";
  }

  // Interactive mode: use readline
  return getRL().question(questionText);
}

export async function prompt(question: string): Promise<string> {
  const answer = await readLine(`  ${CYAN}?${RESET} ${question} `);
  return answer.trim();
}

export async function confirm(question: string, defaultYes = true): Promise<boolean> {
  const hint = defaultYes ? "(Y/n)" : "(y/N)";
  const answer = await prompt(`${question} ${colors.dim(hint)}`);
  if (answer === "") return defaultYes;
  return answer.toLowerCase().startsWith("y");
}

export interface SelectOption {
  label: string;
  value: string;
}

export async function select(question: string, options: SelectOption[]): Promise<string> {
  console.log(`\n  ${CYAN}?${RESET} ${question}`);
  options.forEach((opt, i) => {
    console.log(`    ${colors.dim(`${i + 1}.`)} ${opt.label}`);
  });
  const answer = await prompt(`Enter choice ${colors.dim(`(1-${options.length})`)}`);
  const idx = parseInt(answer, 10) - 1;
  if (idx >= 0 && idx < options.length) {
    return options[idx].value;
  }
  // Default to first option
  return options[0].value;
}

export function banner() {
  console.log();
  console.log(`  ${BOLD}${MAGENTA}Memscape Setup${RESET}`);
  console.log(`  ${DIM}${"─".repeat(20)}${RESET}`);
  console.log();
}

export function section(title: string) {
  console.log();
  console.log(`  ${DIM}── ${title} ──${RESET}`);
  console.log();
}

export function success(message: string) {
  console.log(`  ${colors.success(message)}`);
}

export function error(message: string) {
  console.log(`  ${colors.error(message)}`);
}

export function info(message: string) {
  console.log(`  ${colors.info(message)}`);
}

export function warn(message: string) {
  console.log(`  ${colors.warn(message)}`);
}

export function blank() {
  console.log();
}
