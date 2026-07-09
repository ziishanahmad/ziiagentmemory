#!/usr/bin/env node

function isSdkChildContext(payload: unknown): boolean {
  if (process.env["AGENTMEMORY_SDK_CHILD"] === "1") return true;
  if (!payload || typeof payload !== "object") return false;
  return (payload as { entrypoint?: unknown }).entrypoint === "sdk-ts";
}

const REST_URL = process.env["AGENTMEMORY_URL"] || "http://localhost:3111";
const SECRET = process.env["AGENTMEMORY_SECRET"] || "";

function authHeaders(): Record<string, string> {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (SECRET) h["Authorization"] = `Bearer ${SECRET}`;
  return h;
}

async function main() {
  // #991: Guard for Node < 18 where global fetch is absent.
  if (typeof fetch !== "function") return;

  let input = "";
  for await (const chunk of process.stdin) {
    input += chunk;
  }

  let data: Record<string, unknown>;
  try {
    data = JSON.parse(input);
  } catch {
    return;
  }

  if (isSdkChildContext(data)) return;

  const sessionId = ((data.session_id || data.sessionId) as string) || "unknown";

  // #991: fire-and-forget POSTs with short timeouts so the process
  // exits well inside Claude Code's SessionEnd grace window.
  fetch(`${REST_URL}/agentmemory/session/end`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ sessionId }),
    signal: AbortSignal.timeout(3000),
  }).catch(() => {});

  if (process.env["CONSOLIDATION_ENABLED"] === "true") {
    fetch(`${REST_URL}/agentmemory/crystals/auto`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ olderThanDays: 0 }),
      signal: AbortSignal.timeout(5000),
    }).catch(() => {});

    fetch(`${REST_URL}/agentmemory/consolidate-pipeline`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ tier: "all", force: true }),
      signal: AbortSignal.timeout(5000),
    }).catch(() => {});
  }

  if (process.env["CLAUDE_MEMORY_BRIDGE"] === "true") {
    fetch(`${REST_URL}/agentmemory/claude-bridge/sync`, {
      method: "POST",
      headers: authHeaders(),
      signal: AbortSignal.timeout(3000),
    }).catch(() => {});
  }

  // #991: 500ms hard cap (not unref'd) so the process exits well inside
  // the harness grace window. The old 1500ms + .unref() let in-flight
  // fetch sockets keep the loop alive past the grace → "Hook cancelled".
  setTimeout(() => process.exit(0), 500);
}

main();
