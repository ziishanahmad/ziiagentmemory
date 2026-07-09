import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  copyFileSync,
  renameSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { homedir } from "node:os";
import * as p from "@clack/prompts";

// Env values use ${VAR:-default} expansion so the wired MCP entry
// inherits ZIIAGENTMEMORY_URL / ZIIAGENTMEMORY_SECRET / ZIIAGENTMEMORY_TOOLS
// from the user's shell, but never fails parse when the var is unset
// (#510). Earlier `${VAR}` form caused Claude Code to silently drop the
// server when no shell-level export existed — per the Claude Code MCP
// docs, "If a required environment variable is not set and has no
// default value, Claude Code will fail to parse the config."
//
// Defaults match the documented runtime: localhost:3111 (no auth, all
// tools). One wired entry now serves local AND remote (Kubernetes /
// reverse-proxied) deployments without doctor-warning duplicates (#375)
// AND fresh installs that haven't exported envs (#510).
export const ZIIAGENTMEMORY_MCP_BLOCK = {
  command: "npx",
  args: ["-y", "ziiagentmemory"],
  env: {
    ZIIAGENTMEMORY_URL: "${ZIIAGENTMEMORY_URL:-http://localhost:3111}",
    ZIIAGENTMEMORY_SECRET: "${ZIIAGENTMEMORY_SECRET:-}",
    ZIIAGENTMEMORY_TOOLS: "${ZIIAGENTMEMORY_TOOLS:-all}",
  },
};

const COPILOT_MCP_COMMAND =
  process.platform === "win32"
    ? {
        command: process.env["ComSpec"] || process.env["COMSPEC"] || "cmd.exe",
        args: ["/d", "/s", "/c", "npx", "-y", "ziiagentmemory"],
      }
    : {
        command: "npx",
        args: ["-y", "ziiagentmemory"],
      };

export const ZIIAGENTMEMORY_COPILOT_MCP_BLOCK = {
  type: "local" as const,
  ...COPILOT_MCP_COMMAND,
  env: {
    ZIIAGENTMEMORY_URL: "${ZIIAGENTMEMORY_URL:-http://localhost:3111}",
    ZIIAGENTMEMORY_SECRET: "${ZIIAGENTMEMORY_SECRET:-}",
    ZIIAGENTMEMORY_TOOLS: "${ZIIAGENTMEMORY_TOOLS:-all}",
  },
  tools: ["*"],
};

export function backupsDir(): string {
  return join(homedir(), ".ziiagentmemory", "backups");
}

export function ensureBackupsDir(): string {
  const dir = backupsDir();
  mkdirSync(dir, { recursive: true });
  return dir;
}

export function timestampSlug(): string {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

export function backupFile(
  sourcePath: string,
  agent: string,
  ext = "json",
): string {
  ensureBackupsDir();
  const stamp = timestampSlug();
  const target = join(backupsDir(), `${agent}-${stamp}.${ext}`);
  copyFileSync(sourcePath, target);
  return target;
}

export function readJsonSafe<T = unknown>(path: string): T | null {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf-8")) as T;
  } catch {
    return null;
  }
}

export function writeJsonAtomic(path: string, value: unknown): void {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = `${path}.tmp-${process.pid}-${Date.now()}`;
  writeFileSync(tmp, `${JSON.stringify(value, null, 2)}\n`, "utf-8");
  renameSync(tmp, path);
}

export function logInstalled(label: string, target: string): void {
  p.log.success(`${label} → wired into ${target}`);
}

export function logAlreadyWired(label: string, target: string): void {
  p.log.info(`${label} already wired in ${target} (use --force to re-install)`);
}

export function logBackup(target: string): void {
  p.log.info(`Backup: ${target}`);
}
