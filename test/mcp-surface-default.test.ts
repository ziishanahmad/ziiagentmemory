import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import {
  getAllTools,
  getVisibleTools,
} from "../src/mcp/tools-registry.js";

// plugin manifests and README advertise 51 MCP tools. The old
// default was ZIIAGENTMEMORY_TOOLS=core which silently capped the surface
// at 8 essentials with no indication the other 43 existed. Default
// flipped to "all"; the lean set is still accessible via
// ZIIAGENTMEMORY_TOOLS=core.
describe("MCP tool surface default (#553)", () => {
  const ORIG = process.env["ZIIAGENTMEMORY_TOOLS"];
  beforeEach(() => {
    delete process.env["ZIIAGENTMEMORY_TOOLS"];
  });
  afterEach(() => {
    if (ORIG === undefined) delete process.env["ZIIAGENTMEMORY_TOOLS"];
    else process.env["ZIIAGENTMEMORY_TOOLS"] = ORIG;
  });

  it("default returns the full 51-tool surface, matching plugin advertising", () => {
    const visible = getVisibleTools();
    const all = getAllTools();
    expect(visible.length).toBe(all.length);
    expect(visible.length).toBeGreaterThanOrEqual(48);
  });

  it("ZIIAGENTMEMORY_TOOLS=all returns the same full set", () => {
    process.env["ZIIAGENTMEMORY_TOOLS"] = "all";
    expect(getVisibleTools().length).toBe(getAllTools().length);
  });

  it("ZIIAGENTMEMORY_TOOLS=core returns the 8 essential tools", () => {
    process.env["ZIIAGENTMEMORY_TOOLS"] = "core";
    const names = new Set(getVisibleTools().map((t) => t.name));
    expect(names.size).toBe(8);
    for (const t of [
      "memory_save",
      "memory_recall",
      "memory_consolidate",
      "memory_smart_search",
      "memory_sessions",
      "memory_diagnose",
      "memory_lesson_save",
      "memory_reflect",
    ]) {
      expect(names.has(t)).toBe(true);
    }
  });

  it("plugin .mcp.json provides default env interpolation so CC parse never fails (#510)", () => {
    const raw = readFileSync("plugin/.mcp.json", "utf-8");
    const cfg = JSON.parse(raw) as {
      mcpServers: { ZiiAgentMemory: { env: Record<string, string> } };
    };
    const env = cfg.mcpServers.ZiiAgentMemory.env;
    // Per Claude Code MCP docs: ${VAR} without a default fails config
    // parse when VAR is unset, silently dropping the server. ${VAR:-x}
    // form is what unblocks fresh installs that haven't exported
    // ZIIAGENTMEMORY_URL.
    expect(env["ZIIAGENTMEMORY_URL"]).toMatch(/\$\{ZIIAGENTMEMORY_URL:-/);
    expect(env["ZIIAGENTMEMORY_SECRET"]).toMatch(/\$\{ZIIAGENTMEMORY_SECRET:-/);
    expect(env["ZIIAGENTMEMORY_TOOLS"]).toMatch(/\$\{ZIIAGENTMEMORY_TOOLS:-all\}/);
  });
});
