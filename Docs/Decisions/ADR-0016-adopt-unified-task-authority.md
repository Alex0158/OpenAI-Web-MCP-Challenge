# ADR-0016: Adopt a Unified Task Authority

**Status:** Accepted  
**Decision date:** 2026-08-31  
**Decision owners:** Alex and project team  
**Scope:** Non-terminal project work, problem, defect, investigation, and decision lifecycle

## Context

The documentation architecture defines current product truth, mechanism contracts, decisions,
development closure, research, scenarios, challenge governance, and references. It does not define
one durable control surface for work discovered during Temporary chats, Agent discussions, audits,
or debugging.

`Docs/Development/` contains completed Programs, bounded implementation records, verification,
runbooks, and closure history. `Docs/Research/` contains supporting analysis and unresolved
evidence. Neither is a clear lifecycle owner for a newly registered task that may be a defect,
investigation, risk, decision need, documentation change, or implementation item.

The larger Emorapy project separates active issues from implementation tasks. This project does
not currently need that additional split. One unified task layer is easier to operate and still
preserves authority when task type and content routing are explicit.

## Decision

### 1. One task layer

`Docs/Tasks/` is the sole task-lifecycle authority. It includes implementation work, defects,
investigations, risks, decision needs, documentation work, verification gaps, and operational
actions. The project will not create a separate issue register unless a later scale or governance
failure justifies superseding this decision.

### 2. Task authority is narrow

Each task owns only its type, lifecycle, priority, owner, current increment, dependencies, next
gate, bounded objective, and task-level closure. It cannot redefine Core truth, Mechanism
contracts, accepted decisions, implementation behavior, evidence, release state, or external
authority.

### 3. Lifecycle and types

Task lifecycle is:

```text
pending -> in_progress -> verification_pending -> closed
```

`blocked` identifies a named preventing gate. `not_planned` is terminal only with reason, accepted
residual risk, and reopen condition.

One primary type is selected from:

```text
implementation | defect | investigation | risk | decision | documentation | verification | operations
```

Problems and defects remain tasks; type does not create a second governance system.

### 4. Admission and distillation

A Temporary or Agent discussion does not become repository truth by occurring. Register only a
bounded actionable or decision-relevant item with known affected surfaces, current evidence, and a
concrete next gate. Store no transcript or round-by-round narration.

### 5. Relationship to Development

`Docs/Development/` owns accepted Program contracts, implementation and verification records,
runbooks, and closure evidence. `Docs/Tasks/` owns whether registered work is pending, active,
blocked, awaiting verification, closed, or not planned. A task links to a Development record when
the work needs one; neither duplicates the other's detailed content.

### 6. Registration discipline

Register the current actionable gate, not every imaginable downstream step. A future task is
created only when its prerequisites, boundary, and next gate are known. Completed and rejected
task records remain at stable paths for traceability.

## Consequences

### Positive

- Work discovered outside a formal Program has one durable landing point.
- Problems and implementation tasks share one lightweight lifecycle.
- Core and Development no longer need to act as informal backlog surfaces.
- A new Agent can find the current task without reading all Research or closure history.
- Admission rules prevent a generic TODO file from accumulating conversation noise.

### Costs and risks

- The Tasks navigation list and task-owned lifecycle must remain reconciled.
- A task can become a duplicate specification if contributors copy Core, ADR, or evidence content.
- One unified layer may become too broad if the project grows substantially.
- Priority labels can be misused as urgency claims rather than sequencing impact.

## Rejected alternatives

- **Separate Tasks and Issues now:** rejected because the current project scale does not justify two
  lifecycle systems, and the owner selected one unified pending-work surface.
- **Use one root TODO file:** rejected because mixed objectives, owners, evidence, and closure gates
  would create an unbounded mutable summary.
- **Use Development as the task queue:** rejected because it already owns Program, implementation,
  verification, runbook, and closure detail; provisional task lifecycle is a distinct question.
- **Store discussion transcripts:** rejected because conversational history is noisy, difficult to
  verify, and not a project authority.
- **Register every future Core/00 step immediately:** rejected because prerequisites and task
  boundaries are not yet selected.

## Reopen triggers

Reopen if task volume makes one unified layer ambiguous, verified problems require independent
severity or remediation governance, the Tasks index repeatedly drifts from task records, or task
and Development ownership cannot remain distinct without duplication.
