import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { resolveProject } from "../src/hooks/_project.js";

describe("resolveProject — hook project basename resolver", () => {
  const originalEnv = process.env.ZIIAGENTMEMORY_PROJECT_NAME;

  beforeEach(() => {
    delete process.env.ZIIAGENTMEMORY_PROJECT_NAME;
  });

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.ZIIAGENTMEMORY_PROJECT_NAME;
    } else {
      process.env.ZIIAGENTMEMORY_PROJECT_NAME = originalEnv;
    }
  });

  it("ZIIAGENTMEMORY_PROJECT_NAME env wins over everything", () => {
    process.env.ZIIAGENTMEMORY_PROJECT_NAME = "my-override";
    expect(resolveProject("/var/log")).toBe("my-override");
    expect(resolveProject(process.cwd())).toBe("my-override");
  });

  it("trims whitespace on env override", () => {
    process.env.ZIIAGENTMEMORY_PROJECT_NAME = "  spaced  ";
    expect(resolveProject("/var/log")).toBe("spaced");
  });

  it("ignores empty env override", () => {
    process.env.ZIIAGENTMEMORY_PROJECT_NAME = "   ";
    const repoBasename = "ZiiAgentMemory";
    expect(resolveProject(process.cwd())).toBe(repoBasename);
  });

  it("returns git toplevel basename when cwd is inside a repo", () => {
    const top = resolveProject(process.cwd());
    expect(top).toBe("ZiiAgentMemory");
  });

  it("returns git toplevel basename from a nested subdir", () => {
    const nested = join(process.cwd(), "src", "hooks");
    expect(resolveProject(nested)).toBe("ZiiAgentMemory");
  });

  it("falls back to basename(cwd) when not in a git repo", () => {
    const dir = mkdtempSync(join(tmpdir(), "amem-noproj-"));
    try {
      expect(resolveProject(dir)).toBe(dir.split("/").pop());
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("defaults to process.cwd() when no cwd argument given", () => {
    expect(resolveProject()).toBe("ZiiAgentMemory");
  });

  it("defaults to process.cwd() when cwd argument is empty", () => {
    expect(resolveProject("")).toBe("ZiiAgentMemory");
    expect(resolveProject("   ")).toBe("ZiiAgentMemory");
  });
});
