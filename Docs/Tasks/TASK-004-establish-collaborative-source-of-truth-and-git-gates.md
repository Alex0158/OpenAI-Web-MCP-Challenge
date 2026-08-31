# TASK-004: Establish Collaborative Source-of-Truth and Git Gates

**Role:** CANONICAL task lifecycle record  
**Registered:** 2026-08-31

## Task Control

- Type: `decision`
- Lifecycle: `closed`
- Priority: `P1`
- Owner: Alex, Eddie, and project team
- Current increment: Complete. The accepted decision, repository guidance, Runbook procedure, and
  closure evidence now define one bounded collaboration control.
- Next gate: Future work applies ADR-0018 and the Primary Development Runbook; reopen only under the
  recorded conflict, drift, ownership, or branch-model conditions.
- Dependencies: Existing Core, Mechanism, ADR, Task, Development, and Git authority surfaces.

## 1. Problem

Two contributors are developing on separate computers while the project transitions from the
application-neutral Core into application-layer work. Existing guidance routes contributors and
requires a Git closure, but it does not explicitly protect accepted architecture from an
underspecified human request, define when a proposal remains non-authoritative, or establish a
practical fetch, integrate, commit, and push cadence for handoffs.

## 2. Objective and authority

This task establishes one compact repository-wide control and its detailed Runbook procedure. It
does not become a second product or task authority.

- [ADR-0018](../Decisions/ADR-0018-adopt-collaborative-source-of-truth-and-change-gates.md) owns
  the accepted collaboration and change-gate decision.
- [`AGENTS.md`](../../AGENTS.md) owns clone-visible routing and non-negotiables.
- The [Primary Development Runbook](../Engineering/03-primary-development-runbook.md) owns the
  repeatable intake, conflict, writeback, and Git procedure.
- [ENG-003](../Development/ENG-003-collaborative-source-of-truth-and-git-gates.md) owns this
  increment's implementation and verification record.

## 3. Scope and controls

The control applies to every contributor and Agent working in this repository, including work
performed from separate computers. It covers task intake, accepted-authority comparison,
canonical-document reconciliation, bounded increments, handoff, and shared-branch delivery. The
Primary Development Runbook remains the operational procedure; this task records only the bounded
outcome and its closure gate.

## 4. Non-goals

This task does not:

- change Re-entry Core, Host, Receiver, Connector, WebMCP, application, runtime, deployment, or
  submission behavior;
- require a commit for every save or impose a numeric commit, branch, or file quota;
- make every code change require a Core edit when its accepted intent and contract are unchanged;
- replace the unified Tasks layer with a separate issue tracker; or
- authorize force-push, shared-history rewrite, destructive cleanup, external publication, or
  production deployment.

## 5. Verification and closure

Move to `verification_pending` after the guidance and Runbook procedure are implemented. Close only
when:

1. ADR-0018 is accepted and indexed;
2. `AGENTS.md` states the human-request conflict gate, canonical writeback checkpoint, and
   collaborator synchronization boundary without duplicating the full procedure;
3. the Primary Development Runbook defines no-conflict, proposal, and material-conflict handling,
   plus fetch, deliberate integration, prompt coherent-commit, push, and remote-readback steps;
4. the Engineering, Decisions, Tasks, and Development indexes are reconciled;
5. repository validators, sensitive-pattern checks, links, English-only checks, and complete owned
   diff review pass; and
6. the result is committed and pushed to `main` with local and remote identities equal.

## 6. Reopen condition

Reopen if a collaborator can still change accepted authority without an explicit decision gate,
canonical docs drift after a contract change, remote ownership remains ambiguous, the procedure
creates repeated false conflicts, or the project adopts a different branch/integration model.

## 7. Closure evidence

- ADR-0018 is accepted and indexed; `AGENTS.md` remains the clone-visible rule surface while the
  parent workspace guide remains a local router with a maintenance reminder only.
- The Primary Development Runbook defines the no-conflict, non-authoritative proposal, and material-
  conflict paths, plus canonical writeback and deliberate fetch, integration, commit, push, and
  remote-readback gates.
- Six repository-validator tests, three sensitive-scanner tests, repository validation, and the
  high-confidence sensitive-pattern scan passed.
- English-only changed-file scanning and staged whitespace checks passed; the complete owned diff
  contains only governance documentation and index changes, with no Core, Mechanism, application,
  runtime, or submission behavior change.
