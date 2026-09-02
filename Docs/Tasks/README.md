# Project Tasks

**Role:** CANONICAL task-lifecycle authority  
**Status:** Active  
**Last updated:** 2026-08-31

## 1. Responsibility

This directory owns the lifecycle of every registered non-terminal project task. A task may be an
implementation item, defect, investigation, risk, decision need, documentation change, verification
gap, or operational action. Problems and defects do not use a separate issue system.

A task record answers:

- what bounded outcome remains;
- why it is registered now;
- who owns the current increment;
- which authority and evidence surfaces it affects;
- what blocks or constrains it; and
- which observable gate changes its state.

Task records do not redefine product behavior, mechanism contracts, accepted decisions,
implementation truth, runtime evidence, deployment state, or submission status. Those remain with
their owning Core, Mechanism, Decision, Development, code, test, runtime, or release surfaces.

## 2. Admission rules

Register a task only when all of these are true:

1. the item is actionable, decision-relevant, or a verified gap that must remain visible;
2. it has one bounded outcome rather than a collection of loosely related ideas;
3. its affected authority or implementation surface is known;
4. current evidence and uncertainty can be stated without inventing facts; and
5. it has one concrete next gate, even when that gate is blocked.

Temporary chats, Agent discussions, audits, and debugging sessions may originate a task. Do not
store their transcript. Distill only the durable problem, evidence, boundary, and next gate.

Do not register:

- a vague idea without an affected surface or next gate;
- a speculative future feature whose prerequisite decision has not been made;
- a duplicate of an existing task;
- implementation history already owned by a Development record; or
- an external action merely to make the queue look active.

## 3. Task control contract

Every task contains one `Task Control` block near the top:

```markdown
## Task Control

- Type: `decision`
- Lifecycle: `pending`
- Priority: `P0`
- Owner: Project team
- Current increment: Produce one accepted application-selection ADR.
- Next gate: The ADR is accepted and the owning Core documents are reconciled.
- Dependencies: None.
```

Beyond this control block, each task records its bounded problem or objective, owning authority and
current evidence, non-goals, verification and closure gate, and reopen condition. Link to detailed
Research, Development, or runtime evidence instead of copying it into the task.

### Type

Use one primary type:

```text
implementation | defect | investigation | risk | decision | documentation | verification | operations
```

The type classifies the work; it does not change its authority or lifecycle.

### Lifecycle

Use only:

```text
pending -> in_progress -> verification_pending -> closed
```

Use `blocked` when a named dependency, authority, or evidence gate prevents the next increment.
Use `not_planned` only with an accepted reason, residual risk, and reopen condition. `closed` and
`not_planned` are terminal for the registered scope; reopening creates an explicit new state change
in the same stable task record.

### Priority

- `P0`: blocks the current highest-leverage project gate or a critical safety/authority boundary;
- `P1`: required for the next coherent product or runtime milestone;
- `P2`: valuable but does not block the current milestone.

Priority represents sequencing impact, not urgency language from a discussion.

## 4. Routing and ownership

When work progresses, update the narrowest owner:

| Information | Owner |
|---|---|
| Task lifecycle, owner, current increment, dependency, next gate | Task record |
| Current product status or intended behavior | `Docs/Core/` |
| Stable module contract | `Docs/Mechanisms/` |
| Durable accepted choice | `Docs/Decisions/` |
| Program, implementation, verification, runbook, or closure detail | `Docs/Development/` |
| Supporting analysis, experiment, or unresolved evidence | `Docs/Research/` or `Experiments/` |
| Implemented behavior | Current code and tests |
| Deployment, release, or submission truth | Current runtime and external readback |

The task links to these owners; it does not copy their full content. Updating a task never grants
permission to commit, push, deploy, publish, spend money, change credentials, contact a third party,
or perform a destructive action.

## 5. Current non-terminal tasks

- [TASK-001 — Select the Host application](TASK-001-select-host-application.md)
- [TASK-003 — Productionize and deploy Cloud Receiver](TASK-003-productionize-and-deploy-cloud-receiver.md)

- [TASK-022](TASK-022-prepare-sdk-v2-full-chain-integration.md) — Prepare and gate the SDK-to-Cloud
  Receiver full-chain contract through Host-effect-backed acknowledgement.

Discover all task records with:

```sh
rg --files Docs/Tasks -g 'TASK-*.md'
```

The task record controls its own lifecycle. This section is navigation and must contain every
non-terminal task exactly once; terminal records remain discoverable by filename and are not
deleted or moved merely because their state changed.

## 6. Maintenance rules

1. Keep one stable task ID and one bounded outcome.
2. Update lifecycle only when the stated gate or new evidence supports the change.
3. Keep round-by-round narration, raw logs, and transcripts outside task records.
4. Link to evidence and authorities instead of copying them.
5. Preserve failed, blocked, closed, and not-planned outcomes with their reason and reopen trigger.
6. Do not create placeholder tasks for every later step in Core/00; register the next actionable
   unit when its prerequisites and boundary are known.
7. Keep all project artifacts in English.
