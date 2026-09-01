# RightSpot — Retired RIGHTSPOT-002 Execution-Wave Draft

**Role:** Retained historical draft; not an authority or active-work register  
**Status:** Retired and non-authoritative  
**Retired:** 2026-09-01, Europe/London  
**Canonical replacement:** [`RIGHTSPOT-002`](../Tasks/RIGHTSPOT-002-build-mvp-application-shell.md) and [`RightSpot Development Roadmap`](RIGHTSPOT-DEVELOPMENT-ROADMAP.md)

This file is retained only to avoid silently deleting an untracked project artifact. Do not use its
historical content below for current status, task routing, or dispatch. Current delegated Work
Orders belong inside the owning Task File; the Big Roadmap belongs in `RIGHTSPOT-DEVELOPMENT-ROADMAP`.

The content below is a historical draft of the earlier, incorrectly separated execution-wave
record. It is preserved for traceability only and has no current status, lifecycle, or dispatch
authority.

## 1. Current evidence and decision

- RightSpot has product, business-rule, Backbone, API, validation, and implementation-stack
  documents, but no application package, runtime code, tests, or deployment configuration.
- `RIGHTSPOT-002` is the single pending RightSpot parent task. `RIGHTSPOT-001` is closed.
- The accepted baseline is Next.js App Router, React, TypeScript, Node.js 24, and SQLite. Cloud
  Receiver, WebMCP, Redis, WebRTC media/signaling, and external services remain out of scope.
- Concrete session storage, transport/serialization, persistence layout, audit storage, and
  accessibility/responsive baseline are still implementation decisions. The main thread owns
  those decisions; a supporting task may identify evidence or gaps but may not decide them.
- RightSpot files are currently untracked in the repository worktree. There is no proven transfer
  protocol for parallel code work, and no shared code contract has yet been implemented.

Therefore, the full `RIGHTSPOT-002` objective must not be sent to one Builder. At this stage, the
only suitable concurrent supporting work is read-only review. Code implementation remains gated
until the main thread closes the concrete implementation boundary and establishes exact ownership.

## 2. Current parallel-safe work orders

The following are candidate Work Orders, not dispatched tasks. They have no mutable project paths,
may inspect the same source baseline concurrently, and must return findings without editing files.

### RS-WO-002A — Trace the human Happy Path to current contracts

**Parent task:** `RIGHTSPOT-002`  
**Role:** Reviewer  
**Dispatch state:** Planned, not dispatched  
**Objective:** Produce a concise traceability review from each accepted human Happy Path step to
the owning requirement, domain operation/state transition, role projection, and validation
evidence. Identify only real ambiguity, contradiction, or missing acceptance detail.

**Read before action:**

- repository `AGENTS.md` and Engineering controls;
- RightSpot `RUNBOOK.md`;
- `Docs/00-current-status.md`;
- `Docs/01-product-definition.md` and `Docs/02-requirements.md`;
- `Docs/03-system-design.md`, `Docs/04-domain-and-data-model.md`, and
  `Docs/05-api-and-integration-contracts.md`; and
- ADR-RS-0001 through ADR-RS-0003.

**Mutable scope:** None. Read-only review; do not create or edit project files, code, tests, or
canonical decisions.

**Acceptance criteria:**

- every primary flow step is mapped to an existing contract or marked as a specific gap;
- role, state, authority, and tenant/agent privacy boundaries are called out where relevant;
- no new feature, integration, or commercial requirement is introduced; and
- the result separates verified consistency, ambiguity, and proposed main-thread decisions.

**Stop conditions:** Stop and return a conflict if the review would require changing accepted
product scope, domain authority, role permissions, or an ADR.

**Completion report:** Return the traceability findings, exact document references, unresolved
questions, and whether a canonical document update is required. Do not claim implementation or
verification.

### RS-WO-002B — Derive the focused verification matrix

**Parent task:** `RIGHTSPOT-002`  
**Role:** Reviewer  
**Dispatch state:** Planned, not dispatched  
**Objective:** Convert the accepted business rules into the smallest focused verification matrix
for the first implementation: domain transitions, role isolation, reset, stale versions, expiry,
slot lifecycle, idempotency, repeated actions, and the ordinary browser Happy Path.

**Read before action:**

- repository `AGENTS.md` and Engineering controls;
- RightSpot `RUNBOOK.md`;
- `Docs/00-current-status.md`;
- `Docs/02-requirements.md`, `Docs/04-domain-and-data-model.md`, and
  `Docs/05-api-and-integration-contracts.md`; and
- `Docs/06-validation-and-evidence.md` plus ADR-RS-0001 and ADR-RS-0002.

**Mutable scope:** None. Read-only review; do not implement code, tests, fixtures, or runtime
commands.

**Acceptance criteria:**

- each required guard has a focused check and a named evidence level;
- domain checks are separated from application integration and browser checks;
- the matrix includes at least one negative check for role/private-data isolation and stale writes;
- deferred Cloud Receiver, WebMCP, Redis, and WebRTC behavior is not smuggled into MVP checks; and
- the result identifies the minimum verification needed before `RIGHTSPOT-002` can close.

**Stop conditions:** Stop and report if a requested check requires a new product behavior,
external service, unsupported fallback, or a change to accepted authority.

**Completion report:** Return the matrix, evidence level, likely command/browser-check shape,
skipped coverage with reasons, and any contradiction that must return to the main thread.

## 3. Main-thread gate after this wave

After reviewing both results, the main thread must:

1. Resolve the concrete local implementation choices that are still open, without adding Cloud
   Receiver, WebMCP, Redis, or WebRTC dependencies.
2. Reconcile any genuine document gap in the owning RightSpot document or ADR. A reviewer result
   is not canonical authority by itself.
3. Write one next Builder Work Order with one falsifiable outcome, exact allowed paths, baseline,
   non-goals, and verification. The likely next boundary is a runnable local foundation, not the
   entire MVP.
4. Choose serialized shared-tree execution or an explicitly isolated worktree with a documented
   source snapshot and output-transfer policy. Do not run parallel code writers until that boundary
   is proven.
5. Dispatch an independent Verifier only after the Builder reaches
   `READY_FOR_VERIFICATION`; the parent task remains open until main-thread reconciliation and
   closure evidence are complete.

No downstream tenant UI, agent UI, integration, deployment, or submission Work Orders are
registered in this wave. They will be created only when their prerequisite contract and file
ownership are stable.

## 4. Accounting and claim boundary

- Registered RightSpot parent tasks remain two total: one closed and one pending.
- These candidate Work Orders are execution slices under `RIGHTSPOT-002`, not additional parent
  tasks and not evidence that work has started.
- No child implementation task is active, no runtime exists, and no verification claim is made.
- The main thread owns dispatch, status promotion, canonical writeback, integration, Git closure,
  and the decision to advance beyond this wave.
