import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Regression tests for #678:
//   - isSlotsEnabled / isReflectEnabled must read from ~/.ziiagentmemory/.env
//     (not only process.env), so users who set ZIIAGENTMEMORY_SLOTS in the
//     dotfile see the flag take effect.
//   - HTTP triggers must return 503 with enableHow when the flag is off,
//     not 500.

describe("isSlotsEnabled — reads merged env (#678)", () => {
  let home: string;
  let ORIG_HOME: string | undefined;
  let ORIG_FLAG: string | undefined;

  beforeEach(() => {
    home = mkdtempSync(join(tmpdir(), "am-slots-flag-"));
    mkdirSync(join(home, ".ziiagentmemory"), { recursive: true });
    ORIG_HOME = process.env["HOME"];
    ORIG_FLAG = process.env["ZIIAGENTMEMORY_SLOTS"];
    process.env["HOME"] = home;
    delete process.env["ZIIAGENTMEMORY_SLOTS"];
    vi.resetModules();
  });

  afterEach(() => {
    if (ORIG_HOME !== undefined) process.env["HOME"] = ORIG_HOME;
    if (ORIG_FLAG !== undefined) process.env["ZIIAGENTMEMORY_SLOTS"] = ORIG_FLAG;
    else delete process.env["ZIIAGENTMEMORY_SLOTS"];
    rmSync(home, { recursive: true, force: true });
  });

  it("returns false when neither process.env nor .env sets the flag", async () => {
    const { isSlotsEnabled } = await import("../src/functions/slots.js");
    expect(isSlotsEnabled()).toBe(false);
  });

  it("returns true when ZIIAGENTMEMORY_SLOTS=true lives only in ~/.ziiagentmemory/.env", async () => {
    writeFileSync(
      join(home, ".ziiagentmemory", ".env"),
      "ZIIAGENTMEMORY_SLOTS=true\n",
    );
    const { isSlotsEnabled } = await import("../src/functions/slots.js");
    expect(isSlotsEnabled()).toBe(true);
  });

  it("returns true when process.env wins over .env (existing behaviour preserved)", async () => {
    writeFileSync(
      join(home, ".ziiagentmemory", ".env"),
      "ZIIAGENTMEMORY_SLOTS=false\n",
    );
    process.env["ZIIAGENTMEMORY_SLOTS"] = "true";
    const { isSlotsEnabled } = await import("../src/functions/slots.js");
    expect(isSlotsEnabled()).toBe(true);
  });
});

describe("isReflectEnabled — reads merged env (#678)", () => {
  let home: string;
  let ORIG_HOME: string | undefined;
  let ORIG_FLAG: string | undefined;

  beforeEach(() => {
    home = mkdtempSync(join(tmpdir(), "am-reflect-flag-"));
    mkdirSync(join(home, ".ziiagentmemory"), { recursive: true });
    ORIG_HOME = process.env["HOME"];
    ORIG_FLAG = process.env["ZIIAGENTMEMORY_REFLECT"];
    process.env["HOME"] = home;
    delete process.env["ZIIAGENTMEMORY_REFLECT"];
    vi.resetModules();
  });

  afterEach(() => {
    if (ORIG_HOME !== undefined) process.env["HOME"] = ORIG_HOME;
    if (ORIG_FLAG !== undefined) process.env["ZIIAGENTMEMORY_REFLECT"] = ORIG_FLAG;
    else delete process.env["ZIIAGENTMEMORY_REFLECT"];
    rmSync(home, { recursive: true, force: true });
  });

  it("returns true when ZIIAGENTMEMORY_REFLECT=true is only in ~/.ziiagentmemory/.env", async () => {
    writeFileSync(
      join(home, ".ziiagentmemory", ".env"),
      "ZIIAGENTMEMORY_REFLECT=true\n",
    );
    const { isReflectEnabled } = await import("../src/functions/slots.js");
    expect(isReflectEnabled()).toBe(true);
  });
});
