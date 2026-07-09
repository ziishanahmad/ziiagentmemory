# ziiagentmemory

Standalone MCP server for [ZiiAgentMemory](https://github.com/ziishanahmad/ziiagentmemory).

This is a thin shim package that re-exposes the standalone MCP entrypoint from
[`ziiagentmemory`](https://www.npmjs.com/package/ziiagentmemory),
so MCP client configs that say `npx ziiagentmemory` work out of the box
without installing the full package first.

## Usage

```bash
npx -y ziiagentmemory
```

Or wire it into your MCP client (Claude Desktop, OpenClaw, Cursor, Codex, etc.):

```json
{
  "mcpServers": {
    "ZiiAgentMemory": {
      "command": "npx",
      "args": ["-y", "ziiagentmemory"]
    }
  }
}
```

This package depends on `ziiagentmemory` and forwards to its
`dist/standalone.mjs` entrypoint. If you already have `ziiagentmemory`
installed, you can call the same entrypoint directly:

```bash
npx ziiagentmemory mcp
```

Both commands do the same thing.

## Why does this package exist?

The original plan in [issue #120](https://github.com/ziishanahmad/ziiagentmemory/issues/120)
was to publish `ZiiAgentMemory-mcp` as an unscoped package, but npm's name-similarity
policy blocks that name because of an unrelated package called `agent-memory-mcp`.
Publishing under the `@ZiiAgentMemory` scope sidesteps the conflict and keeps the
"dedicated standalone package" UX — `npx ziiagentmemory` is one character
longer than `npx ZiiAgentMemory-mcp` and works on the live registry.

## License

Apache-2.0
