# DOCS-006: Bound-Task Product Restoration

**Role:** DEVELOPMENT decision-reconciliation record  
**Status:** Task-scoped documentation locally verified; full-repository sensitive scan not clean; implementation open  
**Date:** 2026-09-03  
**Decision:** [ADR-0046](../Decisions/ADR-0046-restore-bound-task-notification-continuation.md)

## Bounded outcome and authority

Record the owner's explicit approval to restore the original existing-task design and to use
Sleepless Kingdom to demonstrate Re-entry Core, not a fresh-session job runner. This `Assured`
documentation increment distinguishes accepted intent, unchanged compatibility contracts, and
missing implementation. It changes no executable behavior, protocol schema, database, package,
credential, Game file, deployment, or branch.

The start readback found shared `main` advancing from `a1250a8` to `68a306e` during concurrent
conformance work, with 20 local commits ahead of `origin/main`. Owner-held Game/RightSpot changes,
conformance source/tests, and the nested `saas-boilerplate/` repository remain outside this edit
scope. Exact owned documentation paths alone are eligible for staging; existing commits are not
implicitly validated for remote delivery by this record.

## Reconciliation dispositions

| Surface | Disposition |
|---|---|
| Product definition, requirements, architecture, trust, demo, positioning, and business flow | `updated`: bound-task notification target, no effect-gated product completion |
| Core/00 and Core/05 | `updated`: accepted target separated from unchanged executable evidence |
| Mechanisms 01-05 | `updated`: enrollment/binding, notification responsibility, autonomous re-entry |
| ADR-0026, ADR-0043, ADR-0045 and decision index | `updated`: explicit selected-product supersession, retained compatibility semantics |
| Existing v0.1/v0.2 code, tests, routes, and stored rows | `historical` for target proof, retained normative compatibility; no edits or relabelled test results |
| Fresh-session CLI and manual queue mapping | `implementation_gap`: TASK-035; preview remains labelled, not removed |
| Notification handoff/settlement | `implementation_gap`: TASK-029 is explicitly retargeted, not marked fixed |
| Supported same-task wake and Browser/WebMCP | `unverified`: TASK-034 is retargeted; CLOUD-024 remains historical fresh-process evidence |
| Standing product adoption | `implementation_gap`: TASK-033; exact lifetime/public controls stay separately gated |
| Game scoped authority and deployment work | `open`: no owner-held Game edits; TASK-033 carries the required Game-owner reconciliation gate |

## Verification and claim boundary

Executed checks:

- `python3 scripts/test_validators.py`: 6/6 passed.
- `python3 scripts/test_sensitive_scan.py`: 3/3 passed.
- `python3 scripts/validate_repository.py --root .`: passed after fixing the new Task's required
  section headings; exact owned files were indexed so new documents were included.
- `git diff --cached --check`: passed; owned diff and indexed paths reviewed.
- The existing scanner patterns plus a CJK scan over all 29 authored paths: zero findings.
- `python3 scripts/scan_sensitive_patterns.py --root .`: **failed**, reporting 21 existing
  Game-document matches across seven unchanged files. Read-only suffix classification confirmed
  the detections refer to SQLite/PNG artifact basenames, not newly introduced credential values.
  No scanner rule, Game document, or unrelated artifact was changed to clear this baseline.
- Independent read-only reviews caught residual effect-gated current-product acceptance wording;
  the operative README, Core, Task closure, and audit next-action clauses were corrected, while
  historical compatibility evidence remained intact.

No real Agent, notification, Receiver request, Browser navigation, or Game command was executed.
Core/runtime aggregates were not rerun: this increment changes product targets and documentation,
not executable sources or retained profile semantics; concurrent conformance edits are owner-held.
This supports task-scoped documentation verification, not a whole-repository security pass or
implemented notification continuity.

The preceding read-only audit's 13 passing fake-process Adapter tests explain current behavior;
they are not new-target implementation evidence. Existing Core conformance remains evidence for
its exact unchanged profiles, not notification-only product acceptance.

## Git and collaboration boundary

The shared branch advanced to `d9d441f` during this work, with 22 pre-existing local commits ahead
of the fetched remote. That concurrent commit also included this increment's newly added DOCS-006
index row from the shared Development index; preserve it rather than rewrite shared history.
Only this task's reviewed documentation changes are eligible for the local closure commit. Remote
delivery is held: this increment does not validate or publish the other local commits, and the
full-repository sensitive scan remains non-green. Game/RightSpot work and concurrent conformance
source/test edits remain untouched and excluded from this increment.

## Residual and next gate

TASK-035 must first settle the trusted binding/driver contract. TASK-029 must specify and verify
notification receipt identity, unknown outcomes, slot release, and explicit protocol compatibility.
Do not convert `accepted` into an old effect ACK or continue making fresh-child Browser attachment
the prerequisite for the selected product. The Game proof must include both lawful action and
deliberate no-command continuation in the same task under one Consent.
