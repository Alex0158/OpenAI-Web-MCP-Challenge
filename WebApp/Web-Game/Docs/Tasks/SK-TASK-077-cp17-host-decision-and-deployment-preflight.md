# SK-TASK-077: CP-17 Host Decision and Deployment Preflight

## Task Control

- Lifecycle state: `in_progress`
- Closure type: `decided`
- Checkpoint: `CP-17`
- Owner: Game owner
- Current increment: The production start/build/configuration boundary is reconciled and the accepted Railway resource topology has been provisioned and read back; the hosted runtime and identity gates remain open.
- Next gate: Supply Clerk Production credentials and two fixed subject bindings, upload the exact Game source, and record the actual project/plan, URL, restart, backup, secret, and rollback readback; hosted proof remains open.

## Identity

- Task ID: `SK-TASK-077`
- Date: 2026-09-03
- Risk profile: `Assured`
- Reason for profile: Hosted deployment crosses process authority, durable state, identity/session scope, realtime transport, world-clock continuity, secrets, recovery, and the public evidence boundary.

## Objective

Make the CP-17 hosted continuity checkpoint actionable as an early parallel workstream. Reconcile the
current production-like application boundary, define the decision fields for a host and durable store,
and leave one conservative route from local production rehearsal to a real hosted proof. This task does
not perform a public deployment or silently select a provider.

## Success and non-goals

- Success: The current runtime gaps are explicit, one host decision can be made against observable
  acceptance rows, and the next implementation task can deploy the same authoritative world without a
  second scheduler, fixture-only identity, or unreviewed contract change.
- Non-goals: Credentials in the repository, a serverless timer, a browser heartbeat, a second world
  authority, or a hosted claim from a build log. The owner-authorized Railway resource setup is now
  complete; source deployment and hosted verification remain governed by `SK-TASK-078`.

## Scope and authority

- In scope: `package.json` build/start behavior, `src/server/config.ts`, `src/server/entrypoint.ts`,
  `src/server/world-worker.ts`, `src/server/runtime.ts`, `src/server/health.ts`, the production identity
  and default-world bootstrap gap, host/store decision fields, and the CP-17 rehearsal handoff.
- Out of scope: `reentry-core/`, `mvp/`, Eddy's Receiver/Local Connector implementation, RightSpot,
  further provider mutations beyond the owner-authorized resource preflight recorded in
  [`SK-EVID-063`](../Evidence/SK-EVID-063-cp17-railway-resource-provisioning-preflight.md), public DNS
  or TLS changes, and new gameplay rules.
- Owning sources: [`Engineering/06-operations-and-hosting.md`](../Engineering/06-operations-and-hosting.md),
  [`Engineering/08-development-roadmap-and-checkpoints.md`](../Engineering/08-development-roadmap-and-checkpoints.md),
  [`Engineering/09-mvp-contract-sheet.md`](../Engineering/09-mvp-contract-sheet.md),
  [`Tasks/SK-TASK-017`](SK-TASK-017-cp17-hosted-continuity-preimplementation-pack.md), and
  [`Scenarios/17-cp17-hosted-continuity-fixtures.md`](../Scenarios/17-cp17-hosted-continuity-fixtures.md).
- Related external handoff: [`SK-TASK-076`](SK-TASK-076-cp14-cloud-receiver-v2-game-adaptation.md)
  remains a separate gate. Deployment supplies the canonical URL and hosted identity only after the
  exact Eddy v2 contract is accepted.

## Evidence status

- Verified: `npm run build` passes with the repository's Node 24-compatible runtime (`v24.20.0` was
  used for this readback); the custom start script runs one `tsx src/server/entrypoint.ts` process; the
  target operations packet already defines health, persistence, restart, rollback, and claim limits.
- Verified: `HOST` defaults to `127.0.0.1` locally and `0.0.0.0` in production, `GAME_DB_PATH` defaults to a local SQLite path,
  `AUTONOMOUS_WORLD_MODE` is opt-in, and `LOCAL_FIXTURE_MODE` is disabled in production.
- Verified: [`SK-TASK-078`](SK-TASK-078-cp17-production-identity-and-hosted-admission.md) now supplies a
  production-like Clerk resolver, idempotent default-world bootstrap, and server-derived HTTP/
  page-tool/WebSocket scope without enabling fixture mode.
- Verified: the production-like bootstrap rejects a different non-empty world and loads the same world
  on restart; it never reseeds a non-empty store.
- Verified: the Game tree contains no provider deployment manifest or secret, while the selected Railway
  host and durable hosted-store mapping are now recorded by [`SK-EVID-063`](../Evidence/SK-EVID-063-cp17-railway-resource-provisioning-preflight.md).
- Unknown: the selected provider's actual plan, source/build identity, Clerk instance/session issuance,
  secret bindings, runtime process supervision, Volume backup/restore, WebSocket proxy behavior,
  restart catch-up, and rollback semantics.
- Claim limit: this task supports preparation and decision evidence only. It does not prove a hosted
  endpoint, always-on continuity, production gameplay, WebMCP, Re-entry delivery, or judge reproduction.

## Cross-functional decision fields

| Field | Required decision or readback | Why it is binding |
|---|---|---|
| Process authority | One supervised Node 24 entrypoint owns page, worker, health, and command gateway for the MVP | Prevents a second clock or split-brain world |
| Worker continuity | Worker advances without a browser and restarts from durable world time | Preserves the continuous-world thesis |
| Store | Accepted MVP: SQLite on one Railway persistent Volume with one writer, snapshots, events, outbox, and backup handle; PostgreSQL remains deferred | Prevents world regeneration and duplicate effects |
| Bootstrap | One idempotent, one-time world seed/provisioning path before readiness; restart must never reseed | Closes the current empty-store `WORLD_NOT_FOUND` gap safely |
| Identity and scope | Production resolver binds player, shelter, world, realtime connection, and future Agent binding from server-side identity | Fixture cookies cannot be the hosted authority |
| Health and admission | Liveness, readiness/world readiness, and degraded command rejection are separately readable | A live but unusable worker must not accept mutations |
| Realtime | `/realtime` upgrade survives the proxy with the same scoped `client_snapshot` contract | Polling cannot silently replace the accepted realtime claim |
| URL and TLS | One stable HTTPS canonical page URL, no redirect ambiguity, and a source/build identity | Required by browser, WebMCP, Eddy, and judge handoff |
| Operations | Redacted logs, metrics or equivalent readback, restart policy, backup/restore, and rollback with schema compatibility | Makes failure recoverable and evidence shareable |

## Chosen preparation route

1. Keep `SK-TASK-017` as the host-neutral acceptance matrix and use this task for the currently missing
   decision and implementation-entry gate.
2. Compare candidate hosts only against the fields above and their official runtime contracts. Do not
   choose from a deploy button, pricing page, or marketing claim alone.
3. Before any provider write, prove a local production-like artifact with Node 24, a disposable
   file-backed world that was explicitly provisioned once, `HOST=0.0.0.0`, `NODE_ENV=production`, and
   `AUTONOMOUS_WORLD_MODE=1`. Record any missing bootstrap, identity, or command route as a bounded
   implementation task rather than enabling fixture mode.
4. Use the accepted [`ADR-GAME-0037`](../Decisions/ADR-GAME-0037-cp17-railway-single-service-sqlite-volume.md)
   topology and execute the existing CP-17 rehearsal. The
  hosted page and worker must remain one world and one authority; a separate database or process
  wrapper requires a new decision.
5. Bind the hosted canonical URL and server-side identity to Eddy's accepted v2 handoff only after the
   Game deployment passes its own health, persistence, restart, and scope gates.

## Alternatives rejected for this increment

- **Deploy the current fixture mode:** rejected because it exposes disposable identities and returns
  no production command authority; it would create a false hosted-game claim.
- **Use a serverless function plus browser heartbeat:** rejected because the browser cannot own world
  time and a sleeping function can pause missions and settlement.
- **Split page and worker immediately:** rejected until a measured need exists; it adds routing,
  identity, and failure modes before the one-process contract has hosted evidence.
- **Wait until all Eddy integration is finished:** rejected as sequencing; host preflight can proceed in
  parallel, but exact external binding remains gated on Eddy's handoff.

## Smallest reversible action

The candidate host fact sheet and local production-like rehearsal are complete enough to provision the
accepted resources. Keep secrets outside the repository, preserve the first hosted failure, and stop
before claiming deployment if Clerk admission, bootstrap, WebSocket support, durable storage, or
rollback cannot be verified.

## Verification and closure target

- Minimum now: static source/config audit, Node 24 production build, documentation validation, and a
  recorded decision matrix with every unknown named.
- Later CP-17 implementation: run the vectors in [`Scenario 17`](../Scenarios/17-cp17-hosted-continuity-fixtures.md)
  and the rehearsal in [`SK-TASK-017`](SK-TASK-017-cp17-hosted-continuity-preimplementation-pack.md),
  including endpoint, health, same-world scope, command rejection, browser absence, restart catch-up,
  reconnect, rollback, and redacted evidence.
- Closure target: `decided` after an explicit host/topology ADR; hosted closure remains `hosted_verified`
  only when ladder-level 7 evidence exists.
- Recovery: preserve the last local contract, disposable store, and first hosted failure; do not reseed,
  fork, or silently downgrade the world to fixture mode.
- Reopen when: the provider changes process/storage semantics, production identity or bootstrap is added,
  the entrypoint splits, the WebSocket or health contract changes, Eddy changes the canonical URL/binding
  contract, or rollback cannot preserve world identity.

## Execution note

The initial audit found no external deployment configuration or selected host. The local production build
passed under Node 24.20.0; the generated `next-env.d.ts` reference was restored to its tracked form after
the build. On 2026-09-03 the owner-authorized Railway project, service, Volume, domain, and non-secret
configuration were provisioned and read back; no Game source deployment, credential, or runtime authority
has been changed. See [`SK-EVID-063`](../Evidence/SK-EVID-063-cp17-railway-resource-provisioning-preflight.md).
