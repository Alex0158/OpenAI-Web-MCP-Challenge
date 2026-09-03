# SK-TASK-017: CP-17 Hosted Always-On Continuity Pre-Implementation Pack

## Task Control

- Lifecycle state: `verified`
- Closure type: `specified`
- Checkpoint: `CP-17`
- Owner: Game owner
- Current increment: Cross-functional CP-17 preparation is complete; no runtime code has started.
- Next gate: After CP-16 local closure and an explicit host decision, deploy the smallest production-like build and prove endpoint, health, persistence, restart catch-up, and command ownership.

## Identity

- Task ID: SK-TASK-017
- Date: 2026-09-02
- Risk profile: `Assured`
- Reason for profile: Prepare the host decision and proof packet for a durable worker, storage, health, realtime channel, canonical page, and same-world restart. The boundary affects durable state, identity, settlement, capability, evidence, or hosted claims.

## Objective

Prepare the host decision and proof packet for a durable worker, storage, health, realtime channel, canonical page, and same-world restart.

## Success and non-goals

- Success: The linked audit and scenario fixture name the authority, predecessor handoff, positive and
  failure cases, open fields, verification level, and executable reopen trigger.
- Non-goals: Selecting a provider by guess, public deployment, secrets in the repository, serverless-only timers, a hosted claim from a deploy log, or changing local authority without evidence.

## Scope and authority

- In scope: [CP-10/18 critical-path audit](../Validation/10-cp10-cp18-preimplementation-audit.md), [CP-17 scenario fixture](../Scenarios/17-cp17-hosted-continuity-fixtures.md), [CP-17/18 preparation audit](../Validation/51-cp17-cp18-preparation-cross-functional-audit.md), and the owning documents named below.
- Out of scope: Selecting a provider by guess, public deployment, secrets in the repository, serverless-only timers, a hosted claim from a deploy log, or changing local authority without evidence.
- Allowed actions: Read and write the task-owned preparation documents; run documentation validators; do not edit predecessor runtime or external dependency files.
- Revalidate when: The checkpoint contract, authority, identity, event order, settlement, capability,
  deployment, or claim boundary changes.

## Owning authority

- Owning documents: Engineering/06-operations-and-hosting.md, ADR-GAME-0011, Engineering/08-development-roadmap-and-checkpoints.md, and the selected host's official runtime contract.
- Roadmap dependency: CP-16 plus a separate host decision.
- Cross-functional handoff: CP-17 consumes CP-16 evidence; CP-13/14 capabilities must be tested at the hosted URL if required; CP-18 consumes only the exact hosted readback.
- Preparation audits: [CP-10/18 audit](../Validation/10-cp10-cp18-preimplementation-audit.md) and [CP-17/18 preparation audit](../Validation/51-cp17-cp18-preparation-cross-functional-audit.md).

## Evidence status

- Verified: Hosted proof requires an always-on worker, durable world state, health/readiness evidence, same world for page and worker, and restart continuity.
- Inferred: Keep one process topology until measured hosted concurrency or storage needs justify a split; a host decision must preserve the game contract.
- Unknown: The selected provider and its exact durable-store, WebSocket, supervision, TLS/custom URL,
  backup, retention, secret-store, and rollback mechanics. The host-neutral acceptance boundary is
  prepared below; no provider is selected by assumption.

## Preparation handoff packet

This packet defines the smallest host-neutral contract that a later CP-17 implementation can map to a
provider. It does not choose a provider, replace the local authority, or convert a deploy log into
hosted evidence. The file-level implementation route is indexed in
[`Engineering/10-cp13-cp18-implementation-seam-map.md`](../Engineering/10-cp13-cp18-implementation-seam-map.md).

### Host acceptance matrix

| Boundary | Required proof at implementation time | Owning source | Stop condition |
|---|---|---|---|
| Process topology | One application entrypoint owns page, worker, health, and storage lifecycle for the MVP | `ADR-GAME-0011`, `src/server/entrypoint.ts` | The host silently splits authority or runs an unbounded second worker |
| Worker continuity | The worker remains scheduled while no browser is connected and resumes after an ordinary process restart | `Docs/Engineering/06-operations-and-hosting.md`, CP-06 | Sleep, scale-to-zero, or serverless timing can pause world authority |
| Durable store | The selected store survives process replacement and preserves `world_snapshot`, events, outbox, and migrations | `PersistenceStore`, CP-05/06 | Storage is ephemeral, shared without single-writer proof, or incompatible with the schema |
| Health and admission | `live`, `ready`, world readiness, and degraded command admission are separately readable | `ADR-GAME-0011`, health contract | A live but degraded process accepts state-changing work or reports false readiness |
| Page and realtime | The canonical page and `/realtime` upgrade resolve the same world and contract version | CP-08/12 wire and projection contracts | A proxy changes scope, drops the upgrade, or invents a client-side snapshot |
| Identity and scope | Server-derived player, shelter, world, and binding scope survives hosted requests and reconnect | `SK-MVP-0.2`, CP-08/12/13 | A client-selected identity or page-only resolver can mutate state |
| Restart and catch-up | A restart reads the same snapshot, clock, event cursor, and delivery records without duplicate effects | CP-05/06/14 contracts | The world regenerates, skips due work, or duplicates settlement/delivery |
| Configuration and secrets | Runtime configuration is explicit, redacted, and stored outside tracked files and evidence | Operations runbook | Credentials, cookies, prompts, or private Agent context enter logs or artifacts |
| Rollback and recovery | A named build can be rolled back with a compatible schema and a recoverable database receipt | Selected host contract | Rollback forks the world, destroys the only recovery source, or is untested |

### Deployment rehearsal order

The implementation checkpoint should execute this order against a disposable production-like world
before any public or judge claim:

| Step | Operator action | Required readback | Claim limit |
|---:|---|---|---|
| 0 | Record source, contract, runtime, host, build, configuration class, and database identity | Immutable build/source and environment identity without secrets | Preparation until the endpoint is real |
| 1 | Build the exact application artifact once | Build result and dependency/runtime versions | Build only; no hosted continuity claim |
| 2 | Provision a fresh durable store and apply compatible migrations | Store type, schema/contract version, migration result, and backup/restore handle | Store setup only |
| 3 | Start the single entrypoint under host supervision | Process instance, `live`, `ready`, world readiness, and canonical URL | Process/readiness only |
| 4 | Open the page and `/realtime` from an independent browser identity | Same world id, contract version, scoped first frame, truthful capability state | Hosted page/realtime only |
| 5 | Run one valid command and one unauthorized or stale command | Committed result and typed rejection, with unchanged unrelated state | Hosted command ownership only |
| 6 | Close the browser and wait or advance through a due worker transition | World time, event cursor, mission state, and outbox progress continue | Hosted continuity only |
| 7 | Restart the process through the host's ordinary path | Same world, snapshot, cursor, leases, and no duplicate effects | Hosted restart proof if all readbacks pass |
| 8 | Reconnect and request a full replacement snapshot | Scope, sequence, stale/degraded state, and current revisions | Hosted reconnect proof |
| 9 | Exercise the prepared rollback or recovery path | Named build, durable world, recovery receipt, and visible failure if blocked | Rollback proof only when actually exercised |
| 10 | Save a redacted evidence packet and classify every row | Exact source, logs, readbacks, skipped/gated rows, and claim ladder | No hosted/judge upgrade from missing rows |

### Outcome and evidence rules

- A hosted result is `pass`, `gated`, `expected-fail`, `flaky`, or `not-run` with a reason, source,
  fixture, and claim limit. A deploy command or URL alone is not a pass.
- The packet must bind the page, worker, store, world id, contract version, event cursor, and build
  identity to one fixture. It must record process and world time separately from wall-time lease data.
- CP-13 capability and CP-14 external delivery remain independent gates. A hosted page that cannot
  enumerate WebMCP tools or a missing Receiver/Connector handoff remains an explicit limitation.
- A host failure must identify whether the first fault is process, readiness, storage, scope, realtime,
  restart, rollback, or evidence redaction. Do not hide it behind a retry or a second process.

### Preparation closure

- The host decision can now be made against observable acceptance boundaries rather than provider
  marketing claims or a deploy log.
- CP-17 remains `specified`; runtime closure requires an explicit host decision and the full rehearsal
  readback above.
- Any change to the world authority, snapshot/schema, WebSocket scope, WebMCP capability, Re-entry
  handoff, or submission claim reopens this packet before deployment.

## Smallest reversible action

After CP-16 local closure and an explicit host decision, execute the deployment rehearsal above against
the smallest production-like build and prove endpoint, health, persistence, restart catch-up, and
command ownership. Stop if the named predecessor fields or authority seam are missing, or if implementation
would require a second state machine, hidden fallback, new contract version, or unowned external behavior.

## Verification and closure target

- Minimum verification: Documentation level 1–2 now; the implementation checkpoint must use the focused
  vectors in [CP-17 scenario fixture](../Scenarios/17-cp17-hosted-continuity-fixtures.md) and the transitive checks named by
  the roadmap.
- Closure target: `specified` for this preparation task; later runtime closure must match actual evidence.
- Rollback or remediation: Preserve the canonical event/identity/ledger boundary, stop at a typed
  failure, and return to the last verified predecessor seam; do not delete evidence or invent state.
- Reopen trigger: Any change to CP-16 plus a separate host decision, the owning contract, or the cross-functional handoff.
