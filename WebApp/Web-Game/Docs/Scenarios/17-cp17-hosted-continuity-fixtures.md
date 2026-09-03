# CP-17 Hosted Always-On Continuity Fixtures

**Status:** Preparation fixture; runtime verification remains open  
**Checkpoint:** CP-17  
**Contract:** [MVP contract sheet](../Engineering/09-mvp-contract-sheet.md)  
**Audits:** [CP-10/18 critical-path audit](../Validation/10-cp10-cp18-preimplementation-audit.md), [CP-17/18 preparation audit](../Validation/51-cp17-cp18-preparation-cross-functional-audit.md)  
**Task:** [SK-TASK-017](../Tasks/SK-TASK-017-cp17-hosted-continuity-preimplementation-pack.md)  
**Purpose:** Prepare the host decision and proof packet for a durable worker, storage, health, realtime channel, canonical page, and same-world restart.

These vectors are preparation inputs and observable outcomes. They do not create a new rule, schema,
event, command, transport, host, or external service contract. A fake clock, network, browser, or
external stub is a test instrument only.

## Fixture and authority boundary

- Contract version: SK-MVP-0.2 unless the owning task explicitly records a later accepted version.
- Dependency: CP-16 plus a separate host decision.
- Owning authority: Engineering/06-operations-and-hosting.md, ADR-GAME-0011, Engineering/08-development-roadmap-and-checkpoints.md, and the selected host's official runtime contract.
- Cross-functional handoff: CP-17 consumes CP-16 evidence; CP-13/14 capabilities must be tested at the hosted URL if required; CP-18 consumes only the exact hosted readback.
- Scope: Host comparison, safe environment inventory, process supervision, durable storage, health/readiness, canonical URL, realtime support, restart recovery, rollback, and redacted operational evidence.
- Non-goals: Selecting a provider by guess, public deployment, secrets in the repository, serverless-only timers, a hosted claim from a deploy log, or changing local authority without evidence.

## Evidence classification

- Verified inputs: Hosted proof requires an always-on worker, durable world state, health/readiness evidence, same world for page and worker, and restart continuity.
- Preparation inference: Keep one process topology until measured hosted concurrency or storage needs justify a split; a host decision must preserve the game contract.
- Open fields: selected host/provider and its exact durable-store, supervision/sleep, TLS/stable-URL,
  backup/retention, and rollback mechanics. The host-neutral proof boundary is fixed below; provider
  details remain open until an explicit decision.

## Vectors

### H17-01 — Host smoke

**Given:** The selected host has the production-like build and configured environment.  
**When:** The service starts.  
**Then:** The actual endpoint, process instance, health, and world readiness are read back without secrets.

### H17-02 — Same world binding

**Given:** The page and worker are served from the hosted deployment.  
**When:** A player joins and reads state.  
**Then:** The world id, contract version, and event cursor are consistent across page, command, and worker.

### H17-03 — Durable restart

**Given:** The worker has committed world, snapshot, event, and outbox state.  
**When:** The process is restarted by the host.  
**Then:** The same world recovers, catches up once, and does not regenerate or duplicate effects.

### H17-04 — Health distinction

**Given:** The process is live while world recovery is pending or degraded.  
**When:** Health endpoints are queried.  
**Then:** Process liveness, readiness, world readiness, and command admission remain distinguishable.

### H17-05 — Realtime channel

**Given:** The hosted browser opens the /realtime upgrade.  
**When:** Snapshots or visible failure are delivered.  
**Then:** The capability result is truthful and does not create a second authority or silent fallback.

### H17-06 — Command ownership

**Given:** A hosted client submits a valid and an unauthorized/stale command.  
**When:** The gateway handles them.  
**Then:** Only the bound shelter can mutate state and typed failures expose the actual outcome.

### H17-07 — Environment and logs

**Given:** The process starts with configured secrets and operational values.  
**When:** Health and logs are collected.  
**Then:** No secret, cookie, prompt, or raw Agent context appears in output or artifacts.

### H17-08 — Rollback/recovery

**Given:** A deployment or storage fault requires rollback.  
**When:** The operator follows the prepared path.  
**Then:** The durable world remains one authority and the failure is visible rather than silently forked.

## Host-neutral acceptance matrix

Use this matrix to compare a candidate host. A candidate passes only when the named behavior is read
back from the running deployment; documentation, pricing, or a successful build does not satisfy a row.

| Row | Candidate question | Evidence required | Rejection condition |
|---|---|---|---|
| M17-01 | Can one supervised Node entrypoint keep the worker alive without a browser? | Process instance, elapsed interval, world-time/event-cursor advance | Sleep, scale-to-zero, or serverless timer pauses the world |
| M17-02 | Does storage survive process replacement and preserve the schema? | Store class, migration result, snapshot/event/outbox readback before and after restart | Ephemeral store, incompatible migration, or regenerated world |
| M17-03 | Are process liveness, readiness, world readiness, and degraded admission distinct? | `/api/health` responses during start, ready, recovery, and failure | A live but degraded process accepts commands or reports ready |
| M17-04 | Do page, command, and `/realtime` use one server-derived scope? | World id, player/shelter/binding scope, contract version, first frame | Client-selected identity, scope drift, or proxy-created snapshot |
| M17-05 | Does ordinary restart recover due work and leases exactly once? | Recovery receipt, event cursor, mission/delivery status, duplicate check | Skipped due work, duplicate settlement, or stale lease acknowledgement |
| M17-06 | Can the operator roll back without forking the world? | Named build, backup/restore handle, post-rollback world identity | No recovery source, incompatible schema, or hidden data loss |
| M17-07 | Are configuration and logs safe to share? | Redacted environment inventory and log scan | Secret, cookie, prompt, or private Agent context present |

## Operational rehearsal runbook

Run this sequence only after CP-16 local closure and an explicit host decision. Use a disposable
production-like world and preserve the first failure.

| Step | Action | Acceptance readback |
|---:|---|---|
| 0 | Record source, contract, runtime, host, build, store, and configuration class | Exact identities with no secret values |
| 1 | Build the artifact once and record dependency/runtime versions | Reproducible build result |
| 2 | Provision fresh durable storage and apply migrations | Store type, schema/contract version, migration and backup handle |
| 3 | Start one supervised entrypoint | Process instance, `live`, `ready`, world readiness, canonical URL |
| 4 | Open two permitted sessions and `/realtime` | Same world, distinct scopes, first-frame sequence and truthful capability state |
| 5 | Issue one valid and one unauthorized/stale command | One committed result and one typed rejection; no unrelated mutation |
| 6 | Close the page and observe due worker work | World time, event cursor, mission and outbox progress continue |
| 7 | Restart through the host's ordinary mechanism | Same world/snapshot/cursor, no duplicate event, settlement, or delivery |
| 8 | Reconnect and request a full replacement | Current revisions, scope-safe frame, visible stale/degraded status when applicable |
| 9 | Exercise rollback/recovery | Named build and durable world remain recoverable, or the exact failure is recorded |
| 10 | Save evidence and classify every matrix row | Redacted trace, skipped/gated rows, highest ladder level, reopen trigger |

## Failure branches

- **Ephemeral or reset storage:** stop hosted proof; preserve the deploy and health evidence as a
  failed storage row and do not regenerate the world to make the run look successful.
- **Worker sleeps or disappears:** classify continuity as failed; do not add a browser heartbeat or
  second scheduler without an owning decision.
- **Readiness mismatch:** keep process liveness and world readiness separate; reject commands while
  degraded and capture the typed response.
- **Realtime proxy mismatch:** stop the row if upgrade, sequence, or scope changes; do not replace it
  with polling and claim equivalent realtime proof.
- **Restart drift:** preserve the first differing world id, cursor, revision, or delivery status and
  reopen the owning contract before another deployment attempt.
- **Secret in evidence:** invalidate the artifact, redact/rotate through the approved operations path,
  and rerun the evidence check without changing game behavior.

## Hosted evidence record

The CP-17 record must include source/build/contract/runtime identity, selected host and store, process
instance, health/readiness responses, canonical URL, world and session bindings, event cursors and
world-time readbacks, restart/rollback receipts, exact commands, skipped or gated rows, and the
highest verification-ladder claim. It must state whether CP-13 capability and CP-14 external delivery
were genuinely exercised or remain gated.

## Shared assertions

- The owning server/worker authority remains the only state-changing authority.
- Revisions, idempotency, world identity, and causal event identity prevent duplicate effects.
- A projection, test stub, screenshot, or delivery envelope cannot replace durable game state.
- Cross-module handoffs use the owning mechanism's state and event boundary; no consumer invents a
  second role, mission, ledger, clock, route, or external delivery path.
- Positive, negative, boundary, retry, restart, browser-absent, and unsupported-capability outcomes
  remain distinguishable in evidence.
- A run repeated with the same fixture, seed, event order, and command versions produces the same
  authoritative result, unless an explicitly open production policy is being measured.

## Open implementation fields

- selected host/provider and exact runtime contract;
- durable store, migration, backup, and retention mechanism;
- process supervision, sleep behavior, and restart policy;
- TLS, stable URL, proxy timeout, and `/realtime` upgrade behavior;
- rollback/recovery command path and artifact retention;

These fields may be filled only inside the checkpoint authority, with rationale and verification.
A value that changes an accepted contract, human consequence, external handoff, or settlement boundary
requires an explicit decision before implementation.

## Non-goals

This fixture is a planning aid. It does not prove runtime, slice, hosted, or judge reproduction and
does not authorize code outside its checkpoint.
