# SK-TASK-016: CP-16 Local Vertical Slice Pre-Implementation Pack

## Task Control

- Lifecycle state: `verified`
- Closure type: `specified`
- Checkpoint: `CP-16`
- Owner: Game owner
- Current increment: Cross-functional CP-16 preparation is complete; no runtime code has started.
- Next gate: After CP-15 aggregate verification, execute the clean fixture reset with two sessions, browser absence, worker restart, signal coalescing, and a typed late-action branch.

## Identity

- Task ID: SK-TASK-016
- Date: 2026-09-02
- Risk profile: `Assured`
- Reason for profile: Prepare the clean-reset local G2 demonstration and evidence trace from two players through event, Re-entry, page reread, and bounded recall. The boundary affects durable state, identity, settlement, capability, evidence, or hosted claims.

## Objective

Prepare the clean-reset local G2 demonstration and evidence trace from two players through event, Re-entry, page reread, and bounded recall.

## Success and non-goals

- Success: The linked audit and scenario fixture name the authority, predecessor handoff, positive and
  failure cases, open fields, verification level, and executable reopen trigger.
- Non-goals: Manual database edits, hidden demo flags, hosted claims, final visual polish, PvP/siege/migration/breach, external service implementation, or declaring a local trace judge-reproducible.

## Scope and authority

- In scope: [CP-10/18 critical-path audit](../Validation/10-cp10-cp18-preimplementation-audit.md), [CP-16 scenario fixture](../Scenarios/16-cp16-local-vertical-slice-fixtures.md), and the owning documents named below.
- Out of scope: Manual database edits, hidden demo flags, hosted claims, final visual polish, PvP/siege/migration/breach, external service implementation, or declaring a local trace judge-reproducible.
- Allowed actions: Read and write the task-owned preparation documents; run documentation validators; do not edit predecessor runtime or external dependency files.
- Revalidate when: The checkpoint contract, authority, identity, event order, settlement, capability,
  deployment, or claim boundary changes.

## Owning authority

- Owning documents: Engineering/08-development-roadmap-and-checkpoints.md, Engineering/09-mvp-contract-sheet.md, Design/05-hackathon-demo.md, and the complete G2 task packet.
- Roadmap dependency: CP-15.
- Cross-functional handoff: CP-16 is where CP-05 through CP-14 conflicts become visible; CP-17 must not treat local evidence as hosted; CP-18 must not rely on developer context.
- Preparation audits: [CP-10/18 audit](../Validation/10-cp10-cp18-preimplementation-audit.md) and [CP-14–CP-16 preparation audit](../Validation/49-cp14-cp16-preparation-cross-functional-audit.md).

## Evidence status

- Verified: The intended story, causal events, identity rules, signal coalescing, full reconnect snapshot, and typed late-action result are already specified by the G2 contract.
- Inferred: One scripted causal trace plus contrast and failure branches gives judges more evidence than multiple shallow demos.
- Unknown: Final browser recording, exact timing tolerance, external signal readiness, evidence storage/retention policy, and reset command UX beyond the fresh-path rule.

## Demo and runbook packet

This is the operational preparation for the local G2 story. It separates deterministic game stimuli
from browser and external capability observations so a failed adapter or missing two-session surface
cannot be mistaken for a successful demo.

### Preconditions

| Check | Required condition | If unavailable |
|---|---|---|
| Source and runtime | Record the working-tree identity, `SK-MVP-0.2`, and Node.js 24.x | Stop; do not mix runtime versions in one trace |
| Fixture | Use a fresh file-backed SQLite path, `LOCAL_FIXTURE_MODE=1`, the accepted `sleepless-mvp-01` seed, and an explicit loopback port | Create a new temporary path; never edit an existing world manually |
| Sessions | Use two genuinely independent browser contexts with server-issued alpha/beta scope | Record a gated two-session result; do not substitute two tabs sharing one cookie |
| Capability | Record fresh WebMCP discovery and invocation separately from realtime status | Run the human/unsupported branch; never claim Agent success |
| External handoff | Record the exact Receiver/Connector version and environment | Use a labelled local stub only; no live integration claim |

### Replay steps

| Step | Actor and stimulus | Authoritative result | Required visible/evidence readback |
|---|---|---|---|
| 0. Reset | Test operator starts the entrypoint with a new database path | One worker/store and one seeded world are ready | Health, contract version, world id, source/runtime identity |
| 1. Join | Player A and Player B open independent contexts | Server derives alpha/beta player and shelter scope | Bootstrap payload, first full snapshot, private-state absence |
| 2. Dispatch | Player A assigns one GATHERER to the seeded Rock route | One role-locked mission attempt and route are committed | Mission id/attempt, route, tool, revision, Player B unchanged |
| 3. Leave | Close Player A's page; keep the worker ready | Browser absence does not stop world time or due work | Last accepted world time and closed/stale human status |
| 4. Resolve | Advance the worker through arrival, extraction, contact, and deterministic loss | `CargoLostToMonster`, cargo deletion, same-soldier respawn, bounded reissue/review, and one eligible signal are durable | Event order/cursors, mission history, cargo/coin result, signal slot |
| 5. Deliver | Run CP-14 through a live handoff only when its contract is verified; otherwise use the local stub | One coalesced signal is accepted, retried, or typed-rejected without changing game state | Signal id, cursor/count digest, delivery status, no per-event wake |
| 6. Return | Reopen the canonical page and reread shelter, snapshot, missions, and history | The Agent sees current revisions before any action | Fresh page read, capability result, visible human fallback if unsupported |
| 7. Act | Invoke `force_recall_soldier` only when positive CP-13 capability and the current grant exist | Server commits `MissionRecalled` or returns a typed stale/late result | Command idempotency, expected revisions, effect/event id, player-facing result |
| 8. Restart | Stop and restart the same local process against the same file-backed fixture | Snapshot/replay recovers the world and delivery records without duplicate effects | Recovery status, event cursor, mission identity, outbox status |
| 9. Burst | Add routine movement/combat events around the eligible loss | History keeps routine events while one signal slot coalesces eligible context | Eligible count/types, cursor range, deferred cursor, Thread backpressure |
| 10. Close | Save the redacted trace and classify every branch | No unowned runtime or hosted claim remains | Evidence packet, skipped/gated rows, residual risks, reopen trigger |

### Timing and branch rules

- Use authoritative `world_time` and explicit worker advances for deterministic transitions. Wall time is
  recorded only for process/lease evidence; unrecorded sleeps cannot decide a game outcome.
- A late recall is a valid branch. It must return `STALE_REENTRY_CONTEXT`, `STALE_REVISION`,
  `ALREADY_AT_SHELTER`, or another contract-defined typed result rather than silently doing nothing.
- If WebMCP is unavailable, the human page remains usable and the trace is a negative capability branch.
- If two independent browser contexts are unavailable, stop the level-5 claim while retaining the
  process and contract evidence.
- If the external contract is missing or mismatched, stop live delivery and preserve the local-stub
  result as contract-only evidence.

### Evidence packet

The final packet should contain a timestamped causal trace, event ids and world cursors, scoped
snapshot readbacks, signal/delivery identities, command result, restart/reconnect readback, screenshots
or recording where permitted, and a redaction check. It must state exact source/runtime/fixture
identity, what was not run, the highest ladder level reached, and the claims that remain open.

## Smallest reversible action

After CP-15 aggregate verification, execute the clean fixture reset with two sessions, browser absence, worker restart, signal coalescing, and a typed late-action branch. Stop if the named predecessor fields or authority seam are missing, or if implementation
would require a second state machine, hidden fallback, new contract version, or unowned external behavior.

## Verification and closure target

- Minimum verification: Documentation level 1–2 now; the implementation checkpoint must use the focused
  vectors in [CP-16 scenario fixture](../Scenarios/16-cp16-local-vertical-slice-fixtures.md) and the transitive checks named by
  the roadmap.
- Closure target: `specified` for this preparation task; later runtime closure must match actual evidence.
- Rollback or remediation: Preserve the canonical event/identity/ledger boundary, stop at a typed
  failure, and return to the last verified predecessor seam; do not delete evidence or invent state.
- Reopen trigger: Any change to CP-15, the owning contract, or the cross-functional handoff.
