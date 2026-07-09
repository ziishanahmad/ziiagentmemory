<p align="center">
  <img src="../../assets/banner.png" alt="ZiiAgentMemory" width="640" />
</p>

<h1 align="center">
  &nbsp;ZiiAgentMemory for pi
</h1>

<p align="center">
  <strong>Your pi sessions remember everything. No more re-explaining.</strong><br/>
  <sub>Persistent cross-session memory via <a href="https://github.com/ziishanahmad/ziiagentmemory">ZiiAgentMemory</a> — shared with Claude Code, Codex CLI, Gemini CLI, Hermes, OpenClaw, and more.</sub>
</p>

---

## Quick setup

Start the ziiagentmemory server in a separate terminal:

```bash
npx ziiagentmemory
```

Copy this folder into pi's global extensions directory:

```bash
mkdir -p ~/.pi/agent/extensions/ziiagentmemory
cp integrations/pi/index.ts ~/.pi/agent/extensions/ziiagentmemory/index.ts
```

Then enable it in `~/.pi/agent/settings.json` if you prefer explicit loading:

```json
{
  "extensions": ["~/.pi/agent/extensions/ziiagentmemory"]
}
```

If you place it under `~/.pi/agent/extensions/ziiagentmemory/`, pi will also auto-discover it and `/reload` can hot-reload it.

## What it adds

- `memory_health` — confirm the shared memory server is reachable
- `memory_search` — search prior decisions, bugs, workflows, and preferences
- `memory_save` — write durable facts back to long-term memory
- `/ZiiAgentMemory-status` — check health from inside pi
- `before_agent_start` recall — injects relevant memories into the prompt
- `agent_end` capture — saves completed conversation turns back to ZiiAgentMemory

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `ZIIAGENTMEMORY_URL` | `http://localhost:3111` | ziiagentmemory server URL |
| `ZIIAGENTMEMORY_SECRET` | (none) | Bearer token for protected instances |
| `ZIIAGENTMEMORY_REQUIRE_HTTPS` | (off) | When set to `1`, refuse to send a bearer token over plaintext HTTP to a non-loopback host. Sends the token only when `ZIIAGENTMEMORY_URL` is `https://...` or points at `localhost`/`127.0.0.1`/`::1`. With this off, the plugin warns once but still sends. |

## Smoke test

Run pi and ask it to use the `memory_health` tool, or call the command directly:

```text
/ZiiAgentMemory-status
```

You should see `ZiiAgentMemory healthy` and a footer status like `🧠 ZiiAgentMemory`.

## Notes

- This extension uses pi's extension API, not MCP, so it can hook directly into the agent lifecycle.
- One local ziiagentmemory server can be shared across pi, pi2, Hermes, OpenClaw, Claude Code, Codex CLI, and Gemini CLI.

## See also

- [ZiiAgentMemory main README](../../README.md)
- [Hermes integration](../hermes/README.md)
- [OpenClaw integration](../openclaw/README.md)
