# SK-ISSUE-002: Pre-Implementation Coherence and Re-Entry Window

## Issue Control

- Issue ID: `SK-ISSUE-002`
- State: `resolved`
- Priority: `P0`
- Type: contract contradiction and blocking uncertainty
- Owner: Game owner
- Next gate: Begin CP-04 under `SK-TASK-003`; runtime implementation and hosted proof remain later gates.

## Problem

The pre-implementation audit verified four load-bearing contract gaps, one protected-start ambiguity,
and two vocabulary defects. It also found that a naive per-event Re-entry relay could flood the Cloud
Receiver, Local Connector, and Codex Thread, while a fixed gameplay hold would weaken the real-time
world. Durable code would otherwise have to invent movement rates, sensing radii, a mission state
model, an anti-loop rule, an exact protected-start boundary, event names, snapshot names, or a
notification backpressure policy.

## Evidence

- Verified finding record: [`../../Validation/05-pre-implementation-coherence-audit.md`](../../Validation/05-pre-implementation-coherence-audit.md)
- Current contract: [`../../Engineering/09-mvp-contract-sheet.md`](../../Engineering/09-mvp-contract-sheet.md)
- Accepted Re-entry boundary: [`../../Decisions/ADR-GAME-0006-mvp-contract-and-reentry-boundary.md`](../../Decisions/ADR-GAME-0006-mvp-contract-and-reentry-boundary.md)
- CP-02 result: [`../../Evidence/SK-EVID-001-cp02-capability-and-runtime-probe.md`](../../Evidence/SK-EVID-001-cp02-capability-and-runtime-probe.md)
- G2 coherence closure: [`../../Evidence/SK-EVID-003-g2-coherence-closure-contract-verification.md`](../../Evidence/SK-EVID-003-g2-coherence-closure-contract-verification.md)

## Impact

The local runtime is ready for the next foundation work. Before closure, CP-03 could not lock a
durable implementation task while the remaining rules disagreed or remained undefined. The accepted
delivery policy resolves D1 without pausing the world: a late `force_recall_soldier` may fail, but it
must never be a silent no-op. High-frequency events must also be coalesced before they reach a Codex
Thread.

## Challenge gate

### Decision question

What conservative set of defaults and state/event reconciliations makes the G2 trace deterministic,
keeps `force_recall_soldier` consequential, and prevents a soldier death loop without moving game
authority into the browser?

### Binding constraints

- The server remains authoritative for time, position, mission, cargo, combat, settlement, and
  visibility.
- State mutation, event append, and eligible outbox row remain one transaction.
- Re-entry receives typed events and may perform one bounded, permission-checked page action.
- Authoritative Domain Events are retained; derived Agent Signals may summarize them.
- A bound shelter/Thread has at most one outgoing Agent Signal pending or in flight, and an active
  Thread receives no per-event message.
- No silent fallback, teleport, duplicate identity, duplicate settlement, or unbounded retry loop.
- The first slice remains two-player G2; full-game systems stay out of scope.

### Verified facts

- B1-B4, D1, D2, C1, and C2 are described with cited document evidence in the audit.
- CP-02 is locally verified and does not depend on resolving these findings.
- The current Agent adapter cannot enumerate page tools; that separate limitation is tracked by
  `SK-ISSUE-001`.

### Assumptions and unknowns

- Candidate numeric defaults must still be demonstrated in the seeded G2 runtime trace; this issue
  closes the contract gap and does not claim that runtime trace.
- The page-side registration result is present, while external Agent discovery remains adapter-gated.
- The exact latency distribution of the eventual hosted Re-entry path is unknown.

### Failure modes examined

| Failure | Impact | Prevention or remediation |
|---|---|---|
| Different movement fields are interpreted as one `speed` | Wrong contact timing and economy | Use distinct movement and initiative fields in the contract |
| Missing radii produce invisible or unavoidable encounters | Broken fog, sensing, or deterministic demo | Give every sensing boundary an explicit tile value and comparison rule |
| Mission documents persist incompatible phases | Divergent schemas and dashboard history | Make the contract's two-field lifecycle/phase model authoritative |
| Automatic reissue loops through the same danger | Infinite loss and no meaningful Agent action | One bounded route avoidance, then `WAITING_REVIEW` |
| High-frequency events relay one message each | Codex Thread is flooded and cannot finish its turn | Classify events, coalesce Agent Signals, and gate delivery per Thread |
| Re-entry arrives after death/reissue | The live state no longer permits recall | Return `STALE_REENTRY_CONTEXT`, `ALREADY_AT_SHELTER`, or another typed live-state result |
| Protected-start boundary overlaps a resource node | Fixture behavior differs at exactly 12 tiles | Define inclusive boundary and move seeded nodes outside it |
| Old event/snapshot names split consumers | Broken replay and ambiguous handlers | Reconcile names in one contract revision |

### Options

| Option | Player value | Risk | Cost | Reversibility | Evidence need |
|---|---|---|---|---|---|
| Real-time coalesced delivery | Keep immediate respawn/reissue, retain every Domain Event, aggregate Agent Signals, and reject late actions explicitly | Requires a delivery-policy revision and burst/backpressure tests; no gameplay hold | Low | High before durable code | Event burst, busy Thread, duplicate delivery, and late command cases |
| Minimal | Keep accepted action and add explicit numeric defaults, one bounded anti-loop replan, and a short post-death re-entry hold | Requires a contract revision and a measured hold window | Low | High before durable code | Seeded G2 timing trace and negative command cases |
| Conservative | Replace post-death recall with a consequential retarget/reroute action | Changes the accepted Re-entry action and its narrative | Medium | Medium | New ADR decision and end-to-end Agent action trace |
| Expanded | Add a full review/resume workflow with richer retry policy | More expressive recovery and more UI/state surface | High | Low | New state, commands, persistence, and human-boundary tests |

### Decision

- Selected option: `Real-time coalesced delivery`
- Owner decision: Accepted on 2026-09-02. The game does not open a fixed Re-entry Window or wait for
  an Agent. Domain Events remain authoritative and durable; a derived Agent Signal is classified,
  coalesced, and delivered through one pending/in-flight gate per bound shelter and Thread. A late
  command is evaluated against the live revision and returns a typed result.
- Reason and trade-off: This preserves the real-time game and the Agent read-decide-act demonstration
  while preventing high-frequency event storms. Some late Agent actions will lose the race by design;
  the dashboard must show that outcome. A short transport debounce may be added only as measured
  configuration and cannot delay gameplay.
- Rejected alternatives: Per-event relay, dropping Domain Events, backend-only rate limiting, and a
  fixed gameplay Re-entry Window.
- Non-goals: No full-game retry system, PvP combat policy, siege recovery, or hosted latency promise.
- Required contract changes: `SK-MVP-0.2`, `ADR-GAME-0009`, affected mechanism/chain/scenario and
  engineering documents, and an explicit current-state failure code for a late recall. The action
  and human boundary in `ADR-GAME-0006` remain unchanged.

## Resolution

The owner-approved `SK-MVP-0.2` closure is recorded in
[`../../Decisions/ADR-GAME-0010-g2-geometry-state-and-vocabulary-closure.md`](../../Decisions/ADR-GAME-0010-g2-geometry-state-and-vocabulary-closure.md).
It fixes movement rates, all sensing/contact radii, the separate lifecycle/mission/encounter state
model, the one-budget danger-cell reissue rule, the fixed 120-second protected-start boundary and
14–20-tile node band, canonical event names and granularity, and the `world_snapshot` versus
`client_snapshot` terms. A static cross-reference and documentation validator pass is recorded in
`SK-EVID-003`.

The issue is resolved for planning coherence. It does not claim CP-04+ runtime behavior, hosted
latency, or external Agent adapter discovery. Reopen on a runtime contradiction, a new contract
version, or a new state/event/persistence authority conflict.

## Verification and recovery

- Closure verification: documentation validator, static cross-reference checks, and contract-level
  consistency assertions are recorded in `SK-EVID-003`. Runtime event-burst/coalescing, active-Thread
  backpressure, duplicate signal delivery, seeded timing, duplicate/stale command, and end-to-end
  Re-entry traces remain CP-04 through CP-16 evidence obligations.
- Recovery path: retain `SK-MVP-0.1` and its evidence, record the superseding decision, and update
  only the affected owning documents; no durable code exists to roll back.
- Reopen or supersession trigger: a selected option fails the seeded timing trace, the CP-13/CP-14
  adapter becomes available with contradictory behavior, or a new contract version changes the same
  assumptions.
