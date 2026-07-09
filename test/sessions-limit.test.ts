import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

// GET /agentmemory/sessions and GET /agentmemory/replay/sessions must
// accept a `limit` query param so the viewer and CLI can page through
// large session tables without forcing the engine to ship every
// record on every request (#1022).
//
// These are source-level assertions because the HTTP endpoint is
// defined inside a single big registerFunction call and we don't want
// to spin up the iii engine just to test a query param. A future
// integration test under test/integration.test.ts can verify the
// end-to-end shape.
describe("sessions endpoint limit query param (#1022)", () => {
  const api = readFileSync("src/triggers/api.ts", "utf-8");

  it("api::sessions reads the limit query param", () => {
    expect(api).toMatch(
      /sdk\.registerFunction\(\s*"api::sessions"[\s\S]*?query_params\?\.\["limit"\]/,
    );
  });

  it("api::sessions slices the response by limit", () => {
    expect(api).toMatch(
      /sdk\.registerFunction\(\s*"api::sessions"[\s\S]*?withSummary\.slice\(0,\s*parsedLimit\)/,
    );
  });

  it("api::sessions falls back to full list when limit is missing or invalid", () => {
    // The fix must not regress the no-limit behaviour: an absent or
    // non-numeric ?limit must return the full filtered list, never an
    // empty result.
    expect(api).toMatch(
      /sdk\.registerFunction\(\s*"api::sessions"[\s\S]*?parsedLimit\s*>\s*0/,
    );
  });

  it("api::replay::sessions also honours limit (companion fix)", () => {
    expect(api).toMatch(
      /sdk\.registerFunction\(\s*"api::replay::sessions"[\s\S]*?query_params\?\.\["limit"\]/,
    );
    expect(api).toMatch(
      /sdk\.registerFunction\(\s*"api::replay::sessions"[\s\S]*?sessions\.slice\(0,\s*parsedLimit\)/,
    );
  });
});
