# TASK-012: Reconcile Business Flows with Current Implementation

**Role:** CANONICAL task lifecycle record  
**Registered:** 2026-09-02

## Task Control

- Type: `documentation`
- Lifecycle: `verification_pending`
- Priority: `P1`
- Owner: Primary Codex session under project-team authorization
- Current increment: The cross-layer account, portal, pairing, consent, delivery, and Codex
  continuation baseline is reconciled and locally verified across tracked and untracked documents.
- Next gate: Owner review and exact-source Git closure for this documentation increment; the open
  product decisions, defects, and release gaps continue only in their bounded TASK-024 and
  TASK-026 through TASK-032 records.
- Dependencies: [ADR-0018](../Decisions/ADR-0018-adopt-collaborative-source-of-truth-and-change-gates.md),
  [Core/09](../Core/09-business-flows-and-ux.md), and the Primary Development Runbook.

## 1. Problem

The project has continued to add account portals, pairing, consent, Host SDK, Connector, persistence,
and deployment work, but the complete flow has not been reconciled as one closed loop after every
increment. As a result, accepted decisions, Core status, development records, README instructions,
current code, and tests can describe different paths at the same time.

This is not one isolated documentation typo. It is a source-of-truth execution gap that can make a
developer, user, or coding agent follow an obsolete route and can make local tests appear stronger
than the hosted or cross-surface evidence supports.

## 2. Objective and authority

Create a repeatable reconciliation baseline and use it to bring the current business-flow record
back into agreement with the repository's actual implementation and evidence.

- [ADR-0018](../Decisions/ADR-0018-adopt-collaborative-source-of-truth-and-change-gates.md) owns the
  durable canonical-writeback decision.
- The [Primary Development Runbook](../Engineering/03-primary-development-runbook.md) owns the
  operational reconciliation gate.
- [Core/09](../Core/09-business-flows-and-ux.md) owns the cross-layer sequence, redirect, UX,
  credential-boundary, and audit map.
- Core, Mechanisms, Decisions, Development, code, tests, runtime evidence, and indexes retain their
  existing ownership; this task does not become a second source of truth.

## 3. Scope

1. Compare the target flow with current browser routes, API handlers, account/session behavior,
   pairing, consent, event delivery, Connector activation, and current evidence.
2. Classify each mismatch as aligned, updated, historical, open, unverified, or an implementation
   gap.
3. Update the narrowest owning document and index when the current intent, status, claim, or route
   changes.
4. Register a separate bounded task or decision when a finding requires code or a product choice;
   do not silently fix a material behavior while doing documentation reconciliation.
5. Record exact verification and remaining risk in the Development record.

## 4. Non-goals

- changing Receiver, Host SDK, Connector, WebMCP, consent, identity, persistence, or deployment
  behavior as part of the baseline;
- selecting the final Host application or Agent runtime;
- making local preview evidence into a hosted, production, Browser, or cross-machine claim;
- deleting historical records, compatibility endpoints, legacy renderers, or collaborator work;
- creating a second task register, mechanism contract, or product requirements document; or
- closing the task merely because the flow document exists.

## 5. Verification and closure

### 5.1 Current evidence

The current register and complete code/flow/contract/document matrix are in
[Core/09 Section 11](../Core/09-business-flows-and-ux.md#11-current-reconciliation-findings) and
[Section 12](../Core/09-business-flows-and-ux.md#12-code--flow--contract--document-coverage-matrix).
The read-only baseline covered both Git repositories, Core, Host SDK, active and retired Receiver
implementations, Local Connector, schemas/migrations, route and state contracts, tests, deployment
definitions, current Development evidence, Git history, and Memory leads revalidated against current
source.

Current dispositions:

| Finding | Disposition and owner |
|---|---|
| AUDIT-V2-001 pairing abuse fence | **P0 CONFLICTED / decision required** — TASK-026 |
| AUDIT-V2-002 Consent/Grant expiry | **P1 CONFLICTED / decision required** — TASK-027 |
| AUDIT-V2-003 default effect acknowledgement | **P1 VERIFIED OPEN** — TASK-029 |
| AUDIT-V2-004 Receiver implementation conformance | **P1 architecture decided / verification pending** — ADR-0044 / TASK-028 |
| AUDIT-V2-005 active flow/route mapping | **documentation updated** — TASK-012 / DOCS-004 |
| AUDIT-V2-006 SDK consent example | **documentation updated** — TASK-012 / DOCS-004 |
| AUDIT-V2-007 release/deployed full chain | **verification pending** — TASK-022 through TASK-024 |
| AUDIT-V2-008 cross-site logout | **P2 VERIFIED OPEN** — TASK-030 |
| AUDIT-V2-009 governance index/link drift | **documentation updated** — TASK-012 / DOCS-004 |
| AUDIT-V2-010 session-unaware guide actions | **P2 VERIFIED OPEN** — TASK-024 |
| AUDIT-V2-011 unpublished simple-facade install | **P1 VERIFIED / docs updated, release open** — TASK-031 |
| AUDIT-V2-012 incompatible, non-reproducible Connector release | **P1 VERIFIED / CONFLICTED, release open** — TASK-032 |

The earlier v1 AUDIT-01 through AUDIT-07 history is preserved with explicit retired/resolved
dispositions in Core/09. No runtime behavior was changed by this reconciliation.

### 5.2 Closure gates

Move to `verification_pending` only when every audit row has:

1. one disposition from the Runbook reconciliation gate;
2. a named owning document, code surface, decision, or bounded follow-up task;
3. current user-facing instructions that do not present a historical path as normal;
4. current status and evidence claims that match what was actually verified; and
5. focused checks for any behavior changed during reconciliation.

Also run the applicable repository documentation, link, English-only, and sensitive-pattern
checks. Close only when no P1 finding is unowned or silently left contradictory, and the Development
record states the exact remaining non-production risks.

## 6. Reopen condition

Reopen if a later increment changes a cross-layer flow without a disposition, an active guide again
describes a historical path as normal, current status overstates evidence, or collaborators cannot
identify the owner and next gate for a contradiction.
