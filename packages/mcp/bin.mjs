#!/usr/bin/env node
import("ziiagentmemory/dist/standalone.mjs").catch((err) => {
  console.error(
    "[ziiagentmemory] Failed to load standalone entrypoint from ziiagentmemory.",
  );
  console.error(
    "[ziiagentmemory] Try installing manually: npm i -g ziiagentmemory",
  );
  console.error(err instanceof Error ? err.stack || err.message : String(err));
  process.exit(1);
});
