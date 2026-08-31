# TASK-002: Establish the Engineering Governance Baseline

**Role:** CANONICAL task lifecycle record  
**Registered:** 2026-08-31

## Task Control

- Type: `implementation`
- Lifecycle: `closed`
- Priority: `P0`
- Owner: Alex and the primary Codex session
- Current increment: Complete. Repository contributor guidance is self-contained and the placement
  boundary is locally verified under ENG-002.
- Next gate: Future work applies the tracked guide and Engineering controls; reopen only under the
  existing authority-discovery or instruction-drift conditions.
- Dependencies: Preserve the current application-selection work and keep selected-app standards
  extensible until TASK-001 is decided.

## 1. Problem

The repository has strong Re-entry Core and Git-closure discipline, but it does not yet have one
project-wide engineering authority for selected-application development. The current Core runbook is
intentionally Core-specific, the repository `AGENTS.md` is dominated by collaboration mechanics,
and documented English, link, secret, syntax, test, package, and CI expectations are not enforced by
one durable local and remote baseline.

Without this baseline, application development could duplicate Core workflow text, choose tests
ad hoc, overstate compatibility or closure, or rely on instructions that are not mechanically
checked.

## 2. Authority and evidence

- [Docs/README](../README.md) owns documentation routing and authority.
- [Development/README](../Development/README.md) owns implementation and closure records.
- [REENTRY-CORE-RUNBOOK](../Development/REENTRY-CORE-RUNBOOK.md) remains the Core-specific procedure.
- [ADR-0017](../Decisions/ADR-0017-adopt-project-engineering-governance-baseline.md) owns the durable
  engineering-governance design selected by this task.
- [ENG-001](../Development/ENG-001-project-engineering-governance-baseline.md) owns implementation,
  verification, and closure detail.
- Current code and tests own implemented behavior; current CI and runtime evidence own their
  respective claims.

## 3. Required outcome

The baseline must:

1. create one scoped Engineering authority for project-wide development, testing, and execution;
2. keep `AGENTS.md` as a routing and non-negotiable control surface rather than a long tutorial;
3. preserve the Core-specific runbook and future selected-application ownership boundaries;
4. enforce repository-safe English, Markdown, task/index, secret, and structure checks mechanically;
5. define one lightweight Re-entry Core verification command and a simple always-run CI baseline;
6. avoid speculative deployment, release, framework, application, and multi-package controls; and
7. preserve unrelated candidate-app work exactly outside this task's staged scope.

## 4. Non-goals

This task does not:

- select or implement the Host application;
- refactor Re-entry Core modules solely because of file length;
- introduce runtime dependencies, a formatter rewrite, a coverage quota, or a complex CI classifier;
- define application-specific UI, browser, database, deployment, or release gates before selection;
- change frozen MVP1, reference, experiment, Research, or Scenario content; or
- claim runtime, deployment, judge, or submission closure.

## 5. Verification and closure

Move to `verification_pending` only when the complete governing and mechanical baseline is ready for
review. Close only when:

- all new authorities have unique roles and are indexed from the nearest owning README;
- `AGENTS.md` routes Fast, Standard, and Assured work without duplicating the runbooks;
- validator unit tests, repository validation, secret scanning, Re-entry Core verification, and
  package-surface checks pass;
- CI syntax and action configuration are reviewed against the same commands;
- Node 24 is the explicit closure baseline and any other local runtime is reported separately;
- no owner-held candidate-app file is staged or modified by this task; and
- the implementation and final closure commits are pushed and remote-matched.

## 6. Reopen condition

Reopen if a new session cannot find the correct engineering authority, a documented mandatory gate
is not executable, CI diverges from the local runbook, application development exposes a missing
cross-project control, or the controls create recurring noise without changing decisions or defects.

## 7. Reopened collaborator-guidance increment

The owner identified that the tracked repository guide still described the untracked parent
workspace file as a source of broader defaults. A collaborator cloning only the repository could
therefore miss evidence, immutable-reference, and change-safety rules, while the tracked guide also
duplicated detailed Git and verification procedure already owned by Engineering.

This increment applies ADR-0017 rather than changing it:

1. make the tracked `AGENTS.md` self-contained for every repository collaborator;
2. keep only mandatory routing, protected boundaries, engineering non-negotiables, executable
   closure commands, Git safety, and claim discipline in that guide;
3. place detailed instruction-location policy and Git readback in Engineering;
4. reduce the untracked parent file to a machine-local workspace router; and
5. preserve Core, Mechanism, application, runtime, and release truth with their existing owners.

No new ADR is required because ADR-0017 already accepts a concise routing role for `AGENTS.md`,
rejects putting every rule there, and names failed authority discovery as a reopen trigger.

The final staged repository-governance suite passed: 6 validator tests, 3 sensitive-scanner tests,
complete repository validation, Markdown and index checks, English-only checks, and the
high-confidence sensitive-pattern scan. ENG-002 owns the exact scope and closure evidence.
