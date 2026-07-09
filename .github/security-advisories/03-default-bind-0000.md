# GHSA Draft: ZiiAgentMemory REST and stream services bound to 0.0.0.0 by default

**Severity:** High · **CVSS 3.1:** 8.1 (`AV:A/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:L`)
**CWE:** [CWE-668 — Exposure of Resource to Wrong Sphere](https://cwe.mitre.org/data/definitions/668.html), [CWE-306 — Missing Authentication for Critical Function](https://cwe.mitre.org/data/definitions/306.html)
**Affected versions:** `< 0.8.2`
**Patched version:** `0.8.2`

## Summary

The default `iii-config.yaml` bound both the REST API (port 3111) and the streams server (port 3112) to `0.0.0.0`, exposing them on every network interface the host could reach. Combined with the fact that `ZIIAGENTMEMORY_SECRET` is **unset by default**, this meant any device on the same local network as a running ZiiAgentMemory instance could read the entire memory store without authentication.

Affected endpoints included:
- `GET /ziiagentmemory/export` — full dump of every captured observation, memory, session, and audit entry
- `GET /ziiagentmemory/sessions` — session list
- `POST /ziiagentmemory/smart-search` — arbitrary search over all captured content
- `POST /ziiagentmemory/observe` — ability to **inject** fake observations
- `POST /ziiagentmemory/remember` — ability to plant arbitrary memories
- All 109 other REST endpoints

## Impact

A developer running ZiiAgentMemory on a laptop in a coffee shop, office, or conference WiFi effectively published their entire memory store — including captured API keys, file contents, prompts, decisions, and project context — to anyone on the same network.

Attackers on the same network could:

1. **Exfiltrate secrets.** `curl http://<victim-ip>:3111/ziiagentmemory/export` downloads everything. Depending on the incompleteness of the secret redaction (see advisory #06), this could include API keys and tokens.
2. **Inject memories.** An attacker could `POST /ziiagentmemory/observe` or `/remember` with fake observations, poisoning the memory store so future sessions retrieve attacker-controlled context.
3. **Pivot to other services.** The mesh sync endpoint (before the auth fix in advisory #04) accepted peer data from any source.

## Patches

Fixed in **0.8.2**:

- `iii-config.yaml` now binds REST, streams to `127.0.0.1`
- Viewer server already bound to `127.0.0.1`
- New `iii-config.docker.yaml` for Docker deployments: containers bind to `0.0.0.0` internally (required for Docker networking) but host port mapping is restricted to `127.0.0.1:port` in `docker-compose.yml`
- README and API section documentation updated to note 127.0.0.1 as the default

## Workarounds

Users on affected versions should manually edit their `iii-config.yaml` and change the REST and streams `host` values to `127.0.0.1`:

```yaml
modules:
  - class: modules::api::RestApiModule
    config:
      host: 127.0.0.1   # was 0.0.0.0
  - class: modules::stream::StreamModule
    config:
      host: 127.0.0.1   # was 0.0.0.0
```

And set `ZIIAGENTMEMORY_SECRET` to a strong random value to protect endpoints even if network exposure is needed.

## References

- Fix PR: [#108](https://github.com/ziishanahmad/ziiagentmemory/pull/108)
- Commit: [`cbaaf4f`](https://github.com/ziishanahmad/ziiagentmemory/commit/cbaaf4f)

## Credit

@eng-pf
