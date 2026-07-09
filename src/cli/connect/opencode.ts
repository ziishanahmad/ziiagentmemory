import { existsSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import * as p from "@clack/prompts";
import type { ConnectAdapter, ConnectOptions, ConnectResult } from "./types.js";
import {
  backupFile,
  logAlreadyWired,
  logBackup,
  logInstalled,
  readJsonSafe,
  writeJsonAtomic,
} from "./util.js";

// OpenCode does not use the standard `mcpServers` block. Its config is a
// top-level `mcp` key whose entries carry `type`, `command` as an array,
// and `enabled` (docs: README "OpenCode (MCP only)"). So it needs its own
// adapter rather than createJsonMcpAdapter.

const CONFIG_PATH = join(homedir(), ".config", "opencode", "opencode.json");
const DETECT_DIR = join(homedir(), ".config", "opencode");

// No `environment` block: OpenCode does not expand shell-style
// `${VAR:-default}` values, and writing them literally would override the
// user's real shell ZIIAGENTMEMORY_URL with an unexpanded string. The stdio
// child inherits the shell environment (an exported ZIIAGENTMEMORY_URL /
// ZIIAGENTMEMORY_SECRET still reaches the server), and the ziiagentmemory
// shim defaults unset vars (URL -> localhost:3111, no secret, all tools).
const OPENCODE_ENTRY = {
  type: "local",
  command: ["npx", "-y", "ziiagentmemory"],
  enabled: true,
};

type OpencodeConfig = Record<string, unknown>;
type McpEntry = Record<string, unknown>;

function entryMatches(entry: unknown): boolean {
  if (!entry || typeof entry !== "object") return false;
  const command = (entry as McpEntry)["command"];
  return Array.isArray(command) && command.includes("ziiagentmemory");
}

export const adapter: ConnectAdapter = {
  name: "opencode",
  displayName: "OpenCode",
  category: "mcp",
  docs: "https://github.com/rohitg00/ZiiAgentMemory#other-agents",
  protocolNote:
    "Using MCP via ~/.config/opencode/opencode.json (top-level `mcp` key). For full auto-capture, also install the bundled plugin in plugin/opencode/.",

  detect(): boolean {
    return existsSync(DETECT_DIR);
  },

  async install(opts: ConnectOptions): Promise<ConnectResult> {
    const existing = readJsonSafe<OpencodeConfig>(CONFIG_PATH);
    const next: OpencodeConfig = existing ? { ...existing } : {};
    const existingMcp = next["mcp"];
    const mcp: Record<string, McpEntry> =
      existingMcp &&
      typeof existingMcp === "object" &&
      !Array.isArray(existingMcp)
        ? { ...(existingMcp as Record<string, McpEntry>) }
        : {};

    const alreadyHas = entryMatches(mcp["ZiiAgentMemory"]);
    if (alreadyHas && !opts.force) {
      logAlreadyWired(this.displayName, CONFIG_PATH);
      return { kind: "already-wired", mutatedPath: CONFIG_PATH };
    }

    if (opts.dryRun) {
      p.log.info(
        `[dry-run] Would ${alreadyHas ? "overwrite" : "add"} mcp.ZiiAgentMemory in ${CONFIG_PATH}`,
      );
      return { kind: "installed", mutatedPath: CONFIG_PATH };
    }

    let backupPath: string | undefined;
    if (existsSync(CONFIG_PATH)) {
      backupPath = backupFile(CONFIG_PATH, this.name);
      logBackup(backupPath);
    } else {
      mkdirSync(dirname(CONFIG_PATH), { recursive: true });
    }

    mcp["ZiiAgentMemory"] = { ...OPENCODE_ENTRY };
    next["mcp"] = mcp;
    writeJsonAtomic(CONFIG_PATH, next);

    const verify = readJsonSafe<OpencodeConfig>(CONFIG_PATH);
    const verifyMcp = verify?.["mcp"] as Record<string, McpEntry> | undefined;
    if (!entryMatches(verifyMcp?.["ZiiAgentMemory"])) {
      p.log.error(
        `Verification failed: ${CONFIG_PATH} did not contain mcp.ZiiAgentMemory after write.`,
      );
      return { kind: "skipped", reason: "verification-failed" };
    }

    logInstalled(this.displayName, CONFIG_PATH);
    return {
      kind: "installed",
      mutatedPath: CONFIG_PATH,
      ...(backupPath !== undefined && { backupPath }),
    };
  },
};
