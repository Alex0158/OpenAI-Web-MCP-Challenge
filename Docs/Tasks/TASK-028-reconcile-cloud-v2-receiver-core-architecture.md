# TASK-028: Reconcile Cloud v2 Receiver Core Architecture

**Role:** CANONICAL task lifecycle record  
**Registered:** 2026-09-03

## Task Control

- Type: `decision`
- Lifecycle: `pending`
- Priority: `P1`
- Owner: Principal architecture owner and Cloud Receiver v2 owner.
- Current increment: Decide whether active v2 must compose the Re-entry Core package or may be an independently
  implemented conforming Receiver, then define the enforcement model.
- Next gate: An accepted ADR either restores one shared Receiver implementation or amends the
  topology with mandatory cross-implementation conformance and ownership rules.
- Dependencies: ADR-0006, ADR-0033 through ADR-0039, AUDIT-V2-004 in Core/09, and TASK-012.

## 1. Problem and objective

ADR-0006 says the Receiver authority model is not implemented twice and Cloud/local shells wrap the
same Receiver Core. Active v2 independently implements Consent, Grant, Event, lease, and
acknowledgement services and has no Core package dependency. ADR-0033 preserves Core authority but
does not explicitly amend the one-implementation rule.

The objective is to remove this architecture ambiguity without retroactively legitimizing code by
documentation alone.

## 2. Authority and evidence

- ADR-0006 and Core/03 own the one-Receiver topology.
- ADR-0033 selects the v2 base and keeps Core/accepted ADRs authoritative.
- Current package manifests, imports, services, schemas, and test matrices prove the two code paths.
- AUDIT-V2-004 records the current conflict; neither implementation is automatically declared wrong.

## 3. Scope

Compare composition/adaptation and independent-conformance options across authority, transactions,
error mapping, schema evolution, deployment, release ownership, and test cost. Select one, record
consequences, and reconcile Core/01, Core/03, Mechanisms 01–03, package boundaries, and verification.

## 4. Non-goals

- moving or rewriting production code before the architecture decision;
- weakening strict v0.1 contracts to make implementations appear aligned;
- treating duplicated tests as proof of equivalent algorithms; or
- migrating data without a selected implementation and rollback plan.

## 5. Verification and closure

Close only after the accepted architecture has one explicit source of normative state-transition
semantics, executable conformance across every retained implementation, and release checks that
prevent one-sided contract drift. Record any required data migration separately and verify it.

## 6. Reopen condition

Reopen if another Receiver implementation appears, the package/composition boundary changes, or a
shared vector passes while state, time, replay, or error semantics still differ.
