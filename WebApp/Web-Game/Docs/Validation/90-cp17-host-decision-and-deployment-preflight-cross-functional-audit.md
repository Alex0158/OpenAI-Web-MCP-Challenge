# CP-17 Host Decision and Deployment Preflight Cross-Functional Audit

**Status:** PRE-IMPLEMENTATION AUDIT COMPLETE; host decision and hosted runtime remain open  
**Date:** 2026-09-03  
**Checkpoint:** CP-17  
**Task:** [`SK-TASK-077`](../Tasks/SK-TASK-077-cp17-host-decision-and-deployment-preflight.md)  
**Predecessor preparation:** [`SK-TASK-017`](../Tasks/SK-TASK-017-cp17-hosted-continuity-preimplementation-pack.md) and [`Validation/51`](51-cp17-cp18-preparation-cross-functional-audit.md)  
**Contract:** [`SK-MVP-0.2`](../Engineering/09-mvp-contract-sheet.md)

## Question and verdict

Should deployment be pulled forward as a controlled parallel workstream, and is the current Game tree
ready for a hosted implementation without changing authority or inventing evidence?

**Verdict:** Yes, CP-17 preflight should start before the Eddy external handoff is complete. The current
tree is suitable for a decision and rehearsal task, but not for a hosted gameplay claim. Production
bootstrap, production identity/command scope, provider/storage selection, and hosted evidence are still
open. Deploying the current fixture path would misrepresent the product boundary.

## Evidence reviewed

- `package.json`: Node `>=24 <25`, Next build, and the single `tsx src/server/entrypoint.ts` start path.
- `src/server/config.ts`: required `PORT`, loopback default `HOST`, local SQLite default, opt-in
  autonomous mode, and fixture flag parsing.
- `src/server/entrypoint.ts`: production disables the fixture resolver; command and page-tool routes
  return typed fixture/WebMCP unavailable responses without it; realtime needs an injected server-owned
  resolver.
- `src/server/world-worker.ts`: autonomous startup requires an existing world and reports
  `WORLD_NOT_FOUND` for an empty store.
- `src/server/runtime.ts` and `src/server/health.ts`: one process health response exposes `live` and
  `ready`, while the only concrete route is `GET /api/health`.
- [`Engineering/06-operations-and-hosting.md`](../Engineering/06-operations-and-hosting.md): target
  always-on, durable storage, health, restart, redaction, and proof rules.
- [`SK-TASK-017`](../Tasks/SK-TASK-017-cp17-hosted-continuity-preimplementation-pack.md) and
  [`Scenario 17`](../Scenarios/17-cp17-hosted-continuity-fixtures.md): accepted host-neutral matrix
  and rehearsal order.
- Repository file inventory: no provider/deployment manifest, selected host, hosted store mapping,
  production identity configuration, or rollback receipt in the Game tree.
- Local build readback: `npm run build` passed with Node `v24.20.0`; this is artifact evidence only and
  does not prove a hosted process.

## Findings by decision impact

| Severity | Finding | Cross-functional effect | Disposition |
|---|---|---|---|
| Blocker | Production autonomous startup cannot create a world from an empty store, and fixture mode is disabled in production | A fresh durable host cannot become ready without an explicit bootstrap; page commands and page tools have no production resolver | Add an idempotent one-time bootstrap and production identity task before hosted gameplay; never reseed on restart |
| Blocker | No host/provider, durable store, supervision, URL/TLS, backup, or rollback is selected | CP-17 cannot produce a real endpoint or recovery receipt | Run the host decision fields in `SK-TASK-077`, then record an ADR before provider mutation |
| High | Current `HOST` default is loopback and `GAME_DB_PATH` is a local filesystem path | A copied start command may bind privately or lose the world on process replacement | Set explicit host/storage configuration in the selected deployment; keep secrets outside tracked files |
| High | Production commands and page tools are fixture-gated; production realtime requires a server-owned resolver | A build can serve a page and health response while still being unplayable | Implement the production session/command/realtime scope seam as a separate assured increment |
| High | The current health route is `/api/health` with process-level `live`/`ready` fields; `/healthz` and `/readyz` are not yet concrete routes | A provider probe can report the wrong state or accept commands during world recovery | Map the host to the existing contract or add an explicitly accepted adapter; do not invent readiness |
| High | The default shell reports Node `v26.5.0`, outside the package engine; Node `v24.20.0` is available and passed the build | Node 26 results are not reproducible release evidence | Pin Node 24 in local and hosted build/runtime environments |
| High | WebSocket proxy and independent hosted identities are not verified | A successful page load cannot prove two-player realtime or same-world scope | Test `/realtime`, distinct server-derived sessions, reconnect, and proxy idle/upgrade behavior |
| Medium | Migration, backup/restore, schema compatibility, and rollback have no provider-specific receipt | A restart or rollback could fork or destroy the only world | Require disposable-world rehearsal and redacted recovery receipt before claim upgrade |
| Medium | Eddy's exact v2 Receiver/Connector handoff remains separate | A hosted URL alone cannot prove Agent wake or ACK/effect authority | Bind `canonical_url` and server-side binding only after `SK-TASK-076` handoff acceptance |

## Authority and sequence check

The proposed ordering is coherent:

```text
CP-16 local causal closure
  -> CP-17 host decision and production preflight (parallel preparation)
  -> bootstrap + production identity implementation
  -> selected-host deployment rehearsal
  -> hosted continuity evidence
  -> Eddy URL/binding handoff and hosted dynamic recall
  -> CP-18 clean-identity judge rehearsal
```

The world worker remains the sole authority for world time, missions, cargo, combat, settlement,
visibility, and event eligibility. The host supervises the process but never advances game state. The
browser, WebMCP, Receiver, and Connector remain adapters. A separate database service is acceptable
only if the worker remains the single writer/authority under an explicit contract.

## Alternatives challenged

- Deploying the current local fixture is fast but fails identity, command, and production-world proof.
- Waiting for Eddy before host preflight preserves sequencing but leaves the canonical URL and session
  environment unknown when the external adapter becomes available.
- A serverless-only deployment is easy to publish but cannot guarantee continuous world time.
- Splitting page and worker immediately may improve scaling later but creates a second failure and scope
  boundary before the one-process path has evidence.

The conservative path is therefore an early, host-neutral preflight followed by one explicit host
decision and a production-like bootstrap/identity increment.

## Minimum verification and stop conditions

Before any public deployment, the named CP-17 vectors must prove: a fresh provisioned world reaches
ready; the worker advances with no browser; page/command/realtime share the same server-derived scope;
valid and stale/unauthorized commands have typed outcomes; process restart preserves world, cursor,
leases, and outbox exactly once; reconnect receives a replacement snapshot; rollback preserves world
identity; and logs contain no secrets or private Agent context.

Stop and preserve the first failure if the host sleeps, storage is ephemeral, bootstrap is non-idempotent,
the proxy drops WebSocket upgrades, a live-but-degraded process accepts commands, identity is client
selected, or rollback lacks a recovery source. Do not hide the failure with fixture mode, a browser
heartbeat, a second scheduler, polling substitution, or a regenerated world.

## Claim limits and reopen triggers

This audit supports `SK-TASK-077` decision/preflight work only. It does not support `hosted_verified`,
WebMCP dynamic action, live Receiver/Connector delivery, independent-browser judge reproduction, or
submission readiness. Reopen if bootstrap, identity, health, realtime, storage, process topology, Eddy's
binding, or the contract version changes.
