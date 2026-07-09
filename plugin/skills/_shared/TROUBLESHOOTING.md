# Troubleshooting ZiiAgentMemory skills

Shared recovery steps for all user-invocable ZiiAgentMemory skills. Each skill's
Troubleshooting section points here instead of duplicating the block.

## "MCP tool not available"

If a `memory_*` MCP tool does not appear, the stdio MCP shim never started.
Walk these in order:

1. Run `/plugin list` in the host and confirm `ziiagentmemory` shows as enabled.
2. Restart the host. The plugin's `.mcp.json` is only read on startup, so a
   freshly installed or re-enabled plugin will not register tools mid-session.
3. Check `/mcp` and confirm the `ziiagentmemory` server shows a live connection.

## REST fallback

When the MCP tools stay unavailable but the daemon is running, call the REST
API directly:

1. Set `ZIIAGENTMEMORY_URL` to the daemon base URL (default `http://localhost:3111`).
2. Add `Authorization: Bearer $ZIIAGENTMEMORY_SECRET` ONLY when `ZIIAGENTMEMORY_SECRET`
   is set. The default localhost daemon is open and rejects a stray header.

Endpoint map by skill:

| Skill           | REST call                                                        |
| --------------- | --------------------------------------------------------------- |
| remember        | `POST /ziiagentmemory/remember`                                     |
| recall          | `POST /ziiagentmemory/smart-search`                                 |
| recap           | `GET /ziiagentmemory/sessions` + `POST /ziiagentmemory/smart-search`   |
| handoff         | `GET /ziiagentmemory/sessions` + `POST /ziiagentmemory/smart-search`   |
| session-history | `GET /ziiagentmemory/sessions`                                      |
| commit-context  | `GET /ziiagentmemory/session/by-commit?sha=<sha>`                   |
| commit-history  | `GET /ziiagentmemory/commits` (URL-encode every query param)       |

The daemon reads `.mcp.json` on startup only, so any port or auth change needs a
restart before either transport sees it.
