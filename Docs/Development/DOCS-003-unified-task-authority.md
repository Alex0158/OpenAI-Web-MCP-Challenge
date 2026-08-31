# DOCS-003: Unified Task Authority

**Status:** `in_progress`  
**Opened:** 2026-08-31  
**Owner:** Primary Codex session under user authorization  
**Closure target:** `locally_verified` documentation-only delivery

## Objective

Add one rigorous, lightweight task-lifecycle authority for pending work, problems, defects,
investigations, risks, decisions, documentation, verification, and operations without duplicating
Core truth or Development execution history.

## Baseline

- repository: `/Users/alex/OpenAI-WebMCP/WebMCP_Challenge`;
- branch: `codex/re-entry-core-foundation`;
- starting commit: `8b07ce64be4bf96d9eb90cd9671b138f11c314b6`;
- local and remote task branches matched at the start;
- no `Docs/Tasks/` task authority or non-terminal task register existed;
- `Docs/Development/` described itself as both development workflow and active-work index; and
- preserved owner work includes the Research 23 addition to `Docs/README.md`, changes to
  `Docs/Scenarios/README.md`, and untracked Research 23 and Scenarios 02 through 04.

## Accepted design

ADR-0016 selects one unified `Docs/Tasks/` layer. Task type distinguishes implementation, defect,
investigation, risk, decision, documentation, verification, and operations. Lifecycle remains one
shared control contract. There is no separate issue directory.

The layer records only triaged durable work. It does not store transcripts, generic ideas,
implementation narration, raw logs, or duplicate product truth.

## Bounded changes

1. Add the Tasks authority and control contract.
2. Register only the current actionable application-selection task.
3. Record ADR-0016 and update the Decision register.
4. Clarify that Core owns the flagship Big Picture, Tasks owns lifecycle, and Development owns
   Program, implementation, verification, runbook, and closure detail.
5. Reconcile repository, Docs, Core, Mechanism, Decision, and Development routing.
6. Preserve candidate-app work, frozen MVP material, runtime source, Research history, and
   immutable references.

## Verification plan

1. every changed project-authored file is English;
2. active local Markdown links resolve, including preserved candidate work;
3. the task schema has one lifecycle and explicit type, owner, evidence, dependency, and next gate;
4. Tasks and Development have no competing lifecycle authority;
5. Core remains the flagship product and project truth;
6. only one currently actionable task is registered;
7. no runtime, frozen MVP, candidate-app, Research, Scenario, or Reference file is staged;
8. Re-entry Core and frozen MVP1 behavior remain unchanged;
9. staged and working-tree diff checks pass; and
10. the documentation delivery is committed, pushed, and remote-matched.

## Reopen conditions

Reopen if task intake becomes a transcript dump, one task owns multiple unrelated outcomes, task
type creates hidden authority differences, current lifecycle cannot be found from one task record,
or selected-app development proves a separate issue system is necessary.

## Closure record

### Implementation and local verification

- Added one unified Tasks authority and one task-control contract covering eight work types, one
  lifecycle, three priorities, explicit ownership, dependencies, and next-gate control.
- Registered only `TASK-001`, the current P0 application-selection decision gate. Later Core/00
  steps remain unregistered until their prerequisites and boundaries are known.
- Reconciled the repository, Docs, Core, Mechanism, Decision, and Development routers without
  changing product or runtime behavior.
- A structural task validator passes for the one registered task, including exact required fields,
  allowed values, required sections, filename shape, and non-terminal navigation membership.
- All 137 active Markdown files, including preserved uncommitted candidate work, pass local-link
  validation. The two byte-preserved Legacy-Ideation snapshot exclusions remain unchanged from
  DOCS-002.
- Changed project-authored files contain no Han-script prose, and no second task-lifecycle owner was
  found.
- Re-entry Core passes 79 of 79 tests, and direct conformance returns `passed` with distinct roles
  and Receiver-only SQLite ownership.
- The frozen MVP1 suite passes 118 of 118 tests unchanged.
- The staged scope contains ten documentation and index files. It excludes runtime source, frozen
  MVP files, Research, Scenarios, References, Experiments, and preserved owner work.

Commit, remote delivery, and final status remain pending.
