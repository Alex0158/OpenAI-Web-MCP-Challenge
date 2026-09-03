# TASK-035: Bind the Existing Agent Task During Enrollment

**Role:** CANONICAL task lifecycle record  
**Registered:** 2026-09-03

## Task Control

- Type: `implementation`
- Lifecycle: `blocked`
- Priority: `P0`
- Owner: Local Connector/Agent Adapter owner, with Receiver and Host SDK owners.
- Current increment: CLOUD-026 completed the installed-runtime check and one bounded queue
  diagnostic: input persisted, but no same-task wake was observed at the 142-second readback.
  A private binding/notification contract is drafted, not accepted or implemented.
- Next gate: Establish supported access to the owning Desktop runtime, or obtain an explicit owner
  decision for a separately labelled local experimental bridge. Review that route before another
  live probe or implementation. The binding contract must then name trusted task selection,
  ownership/Grant verification, private persistence, restart, wrong-task, and unsupported-runtime
  tests; a manually targeted transport probe does not close enrollment.
- Dependencies: ADR-0014 and ADR-0046 for the first binding/driver specification. TASK-029's receipt
  contract and TASK-033's standing controls are integration inputs; TASK-034 consumes the specified
  binding for subsequent runtime verification, not a prerequisite to starting this specification.

## 1. Problem and current evidence

The Receiver currently enrolls an approved Host subject and selects a Connector/delivery target.
That is not a Codex task registration. Core exposes a private binding lookup, not a production
registration writer. The old local queue adapter accepts a manually configured task and builds an
in-memory mapping on first activation; it rejects standing v0.2. The CLI instead selects fresh
`codex exec`. None of these constitutes persistent, trusted enrollment of the initiating task.

The outcome is one real selected-workflow consumer that maps approved authority to the exact
existing task, survives Connector restart, and fails visibly rather than substituting a session.

## 2. Authority

ADR-0046 owns the restored product target; ADR-0014 owns private binding custody. Mechanism 04
owns activation, while TASK-029 separately owns notification settlement and protocol transition.

## 3. Challenge and boundaries

This is `Assured`: task ownership, private locator custody, persistence, and cross-layer identity
are affected. The conservative option is to retain previews while keeping selected-product claims
blocked. The selected next increment specifies and verifies the narrow binding path; a generic
multi-Agent registry or cloud-owned raw task database is out of scope.

The contract must cover trusted selection/capture, enrollment cancellation and partial failure,
duplicate approval, wrong account/Grant/Adapter, missing or retired task, local-store permissions,
restart, explicit rebinding, credential renewal, and revocation before dispatch. Do not equate
device pairing with task ownership or expose a raw locator through the Host/Receiver/prompt.

## 4. Non-goals

No new Game event/action, production migration, package publication, deployment, new branch,
fresh-task fallback, or reconstruction of the user's strategy in a different task.

## 5. Verification and closure

Prove trusted binding creation and exact lookup with one real consumer, restart recovery, and
zero driver calls for missing/wrong/retired bindings. Show that two eligible notifications resolve
the same selected task, with no fallback and no raw locator in shareable artifacts. Coordinate
notification identity/unknown outcomes with TASK-029 and actual wake/page proof with TASK-034;
unit tests alone do not close those runtime gates.

## 6. Reopen condition

A supported runtime/custody conflict reopens the route decision; it does not silently change
ADR-0046.

## 7. Current evidence increment

[CLOUD-026](../Development/CLOUD-026-bound-task-driver-feasibility.md) records installed-version
differences, queue versus tool-output semantics, and the bounded existing-task diagnostic. It does
not select a product driver or replace the reviewed enrollment, privacy, and receipt gates above.
