# Sleepless Kingdom Tasks

**Role:** Active task-lifecycle authority
**Status:** Active
**Last updated:** 2026-09-03

## 1. Responsibility

This directory stores bounded records for approved work. A task record owns its objective, authority
boundary, control metadata, execution notes, verification target, closure result, and residual gates.

A task record does not redefine game behavior, runtime truth, test policy, evidence, or decision
authority. This README is bounded governance and routing only; the task record is the canonical
source for that task's control metadata.

## 2. Identity

Task IDs use `SK-TASK-NNN`, beginning at `001` and increasing monotonically. Never renumber or reuse
an ID. Files are named `SK-TASK-NNN-short-kebab-title.md` and stay at that path when state changes.

Discover records with:

```sh
ls Docs/Tasks/SK-TASK-*.md
```

## 3. Task Control contract

Every non-terminal task contains exactly one block near the top:

```markdown
## Task Control

- Lifecycle state: `pending`
- Closure type: `integrated`
- Checkpoint: `CP-02`
- Owner: Named owner
- Current increment: One short current increment
- Next gate: One verifiable next gate
```

These six fields are the only current control metadata. Detailed evidence, claim limits, and residual
risk stay in the task body or in the owning evidence or decision record.

### Lifecycle state

```text
pending -> in_progress -> verification_pending -> verified
```

Use `blocked` when a named authority, dependency, or evidence gate prevents progress. A `verified`
record is terminal for its registered scope.

### Closure type

Closure type is separate from lifecycle state and describes the intended result:

```text
answered | specified | decided | integrated | contract_verified |
runtime_verified | slice_verified | hosted_verified | rejected | deferred | parent_router
```

Do not create a combined value such as `blocked_integrated`. A task may be `blocked` while its
intended closure type remains `integrated`.

### Checkpoint

Name the owning checkpoint from
[`../Engineering/08-development-roadmap-and-checkpoints.md`](../Engineering/08-development-roadmap-and-checkpoints.md),
or `none` for work that sits outside the roadmap.

## 4. Required task body

Beyond the control block, a task records its bounded problem or objective, the owning authority and
current evidence, non-goals, the affected surfaces, the verification and closure gate, and the reopen
condition. Link to detailed research, decisions, or evidence rather than copying them in.

Start from [`../Templates/task-brief.md`](../Templates/task-brief.md).

## 5. Admission rules

Register a task only when the item is actionable or a verified gap that must stay visible, has one
bounded outcome, has a known affected surface, can state current evidence and uncertainty without
inventing facts, and has one concrete next gate even when that gate is blocked.

Do not register a vague idea without a next gate, a speculative feature whose prerequisite decision
is unmade, a duplicate, or an external action added merely to make the queue look active.

## 6. Current task routing

[`SK-TASK-065`](SK-TASK-065-cp12-canvas-actor-world-visual-surface.md) is verified for the named
deterministic Canvas actor/world presentation under [`SK-EVID-052`](../Evidence/SK-EVID-052-cp12-canvas-actor-world-visual-surface-runtime-verification.md)
and [`Validation/78`](../Validation/78-cp12-canvas-actor-world-visual-surface-runtime-cross-functional-audit.md).
It owns only the local visual baseline and does not alter the server, snapshot, session, WebMCP,
Re-entry, or external handoff boundaries. All registered tasks are now terminal at their named scope.
[`SK-TASK-062`](SK-TASK-062-cp14-game-side-local-stub-delivery-port.md) remains the latest verified CP-14 game-side increment. It proves the local `ReentryDeliveryPort`/`pumpOnce`
mapping against a labelled transport stub and must not claim live Receiver, Connector, Agent, hosted,
or Re-entry delivery. The next CP-14 live-integration increment remains separately admitted only after
Eddy's versioned Receiver/Local Connector handoff.

[`SK-TASK-057`](SK-TASK-057-cp12-server-owned-continuous-intent.md) is terminal at its named local
server-owned continuous-intent runtime scope under [`SK-EVID-043`](../Evidence/SK-EVID-043-cp12-server-owned-continuous-intent-runtime-verification.md)
and [`Validation/71`](../Validation/71-cp12-server-owned-continuous-intent-runtime-cross-functional-audit.md).
[`SK-TASK-053`](SK-TASK-053-cp13-page-tool-contract-preparation.md)
is verified at documentation scope for the owner-accepted four-read package, with the recall transition
kept as a verified server seam and the side-chat Soldier dispatch candidate deferred. The supported
adapter gate is satisfied for the disposable page by SK-TASK-059 and SK-EVID-045. [`SK-TASK-060`](SK-TASK-060-cp13-recall-transition-implementation.md)
is terminal for its named local server-authoritative recall and return-navigation scope under
[`SK-EVID-046`](../Evidence/SK-EVID-046-cp13-recall-transition-runtime-verification.md) and
[`Validation/73`](../Validation/73-cp13-recall-transition-runtime-cross-functional-audit.md). The next
 bounded page-read implementation is tracked under [`SK-TASK-061`](SK-TASK-061-cp13-page-read-tools-and-recall-action-implementation.md) and is runtime-verified for its named local canonical-page read capability under [`SK-EVID-047`](../Evidence/SK-EVID-047-cp13-page-tools-local-runtime-verification.md), [`SK-EVID-049`](../Evidence/SK-EVID-049-cp13-canonical-page-webmcp-runtime-verification.md), and [`Validation/75`](../Validation/75-cp13-page-tools-runtime-cross-functional-audit.md). Agent grants, dynamic recall, and Re-entry remain separate evidence gates. [`SK-TASK-055`](SK-TASK-055-cp12-server-owned-continuous-intent-preparation.md)
is terminal at its accepted decision scope under [`ADR-GAME-0036`](../Decisions/ADR-GAME-0036-cp12-server-owned-continuous-intent.md).
[`SK-TASK-056`](SK-TASK-056-cp13-capability-differential-diagnostic.md) is terminal for its answered
analysis scope; SK-TASK-059 and SK-EVID-045 provide the later runtime capability result. `SK-TASK-052` is terminal at its level-2 worker-owned contract-test scope, and
[`SK-TASK-054`](SK-TASK-054-cp12-held-movement-and-touch-input.md) is terminal for the named local
snapshot-gated held-input presentation scope.
[`SK-TASK-059`](SK-TASK-059-cp13-site-tools-capability-experiment.md) is terminal and runtime-verified
for the positive Site Tools discovery and read-only invocation outcome, which resolved
`SK-ISSUE-001`. CP-13 page implementation is verified in `SK-TASK-061` for the named canonical-page
read capability under `SK-EVID-049`; dynamic recall and Agent/Re-entry delivery remain gated, and CP-14
is additionally gated by the external Receiver/Connector handoff. Do not treat any preparation or local server record as live
Receiver, Connector, WebMCP, or Re-entry evidence.

`SK-TASK-049` is terminal for the named CP-15 local aggregate, and `SK-TASK-050` is terminal for the
named CP-16 pre-Agent local causal slice; both remain discoverable by filename.

`SK-TASK-041` is terminal for its named negative WebMCP capability outcome, later explained by model
eligibility and superseded on the capability question by `SK-TASK-059` and `SK-EVID-045`. `SK-TASK-042` is terminal for the named two-tab browser limitation,
`SK-TASK-043` for local manual reconnect, `SK-TASK-044` for discrete keyboard movement,
`SK-TASK-045` for the ordinary-UI GATHERER dispatch boundary, `SK-TASK-046` for the local
boundary-safe gameplay coordinator, and `SK-TASK-047` for the named local explicit-autonomous
driver. The independent two-session gate remains open. `SK-TASK-048` is terminal at its isolated
contract-support scope; it does not change the active gameplay authority or hosted scheduler gate.
`SK-TASK-051` is terminal at its named local automatic realtime publication scope under
[`SK-EVID-040`](../Evidence/SK-EVID-040-cp12-autonomous-realtime-snapshot-publication-runtime-verification.md)
and [`Validation/63`](../Validation/63-cp12-autonomous-realtime-snapshot-publication-runtime-cross-functional-audit.md).
`SK-TASK-052` is terminal at its named CP-14 contract-test scope under
[`SK-EVID-041`](../Evidence/SK-EVID-041-cp14-signal-policy-conformance-contract-verification.md);
its external delivery gate remains open in the roadmap. `SK-TASK-054` is terminal at its named local
held-input scope under [`SK-EVID-042`](../Evidence/SK-EVID-042-cp12-held-movement-runtime-verification.md)
and [`Validation/66`](../Validation/66-cp12-held-movement-runtime-cross-functional-audit.md). Task057
does not change Task054's evidence boundary or close the hosted/default movement gates. Task057's
runtime result is local-only and does not close independent browser, canonical game-page WebMCP,
Re-entry, or hosted gates.

Discover all task records with:

```sh
ls Docs/Tasks/SK-TASK-*.md
```

The task record controls its own lifecycle. This section is navigation and must contain every
non-terminal task exactly once; terminal records remain discoverable by filename and are not deleted
or moved merely because their state changed.

## 7. Maintenance rules

1. Keep one stable ID and one bounded objective. Do not move the file when state changes.
2. Treat the `Task Control` block as the only current state, owner, increment, and gate source.
3. Never add a per-task progress table, round narration, or status summary to this README.
4. Do not register an ordinary planned task in [`../Issues/`](../Issues/README.md). Register there
   only when evidence establishes a defect, contradiction, or blocking uncertainty.
5. Do not delete a task record. A superseded task closes as `rejected` or `deferred` and is preserved.
6. Updating a task never grants commit, push, deployment, or destructive authority.
7. Keep every record English-only.
