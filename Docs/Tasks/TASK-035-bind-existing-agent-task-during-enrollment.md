# TASK-035: Bind the Existing Agent Task During Enrollment

**Role:** CANONICAL task lifecycle record  
**Registered:** 2026-09-03

## Task Control

- Type: `implementation`
- Lifecycle: `blocked`
- Priority: `P0`
- Owner: Local Connector/Agent Adapter owner, with Receiver and Host SDK owners.
- Current increment: ADR-0047's isolated experimental client is implemented; CLOUD-027 records
  current-build native peer rejection before catalog/task readback. No new B1 input was submitted.
  Preserve CLOUD-026's queue result and retained input; do not weaken App peer authorization.
- Next gate: Establish a legitimate App-recognized admission route for an external Connector into
  the owning existing-task runtime before reopening the live probe. No supported production Adapter
  is selected. The binding contract must then name trusted task selection,
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
blocked. The immediate next gate resolves legitimate owning-runtime admission after CLOUD-027's
peer rejection. Narrow binding/receipt specification may proceed in parallel, but cannot unblock
native access. A generic multi-Agent registry or cloud-owned raw task database is out of scope.

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

The owner subsequently approved [ADR-0047](../Decisions/ADR-0047-authorize-local-desktop-bridge-probe.md).
[CLOUD-027](../Development/CLOUD-027-experimental-desktop-bridge-probe.md) owns the separate native
Desktop experiment and the live `missing-code-signing-identity` rejection. Frozen MVP 1 remains
read-only, build-specific same-task success evidence, not current external-client admission proof.
