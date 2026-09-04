# TASK-035: Bind the Existing Agent Task During Enrollment

**Role:** CANONICAL task lifecycle record  
**Registered:** 2026-09-03

## Task Control

- Type: `implementation`
- Lifecycle: `in_progress`
- Priority: `P0`
- Owner: Local Connector/Agent Adapter owner, with Receiver and Host SDK owners.
- Current increment: CLOUD-028 completes the static MVP/installed-launcher comparison. The App
  configures its bundled MCP service with executor caller metadata and a message-approval policy;
  this does not establish custom-client or independently running Connector admission.
  The experimental CLI now enforces that hold before native IO; transport and observer coverage
  is fixture-only (96/96 local checks). This is not a new admission mechanism or B1 attempt.
- Next gate: Establish legitimate invocation for ADR-0047's current-executor custom diagnostic,
  preserving actual caller, fixed target and App approval policy. No new B1 submission has occurred.
  The subsequent product gate must establish how the existing Connector invokes the exact task
  when no Agent turn is active, including scope, lifetime, renewal if needed, restart and revocation.
  This does not select a credential/token model or require that complete product lifecycle before
  the bounded diagnostic. A stored task locator or Re-entry Grant does not itself authorize App
  invocation. Resolve changed authority with the owner rather than force admission.
  Platform coordination is a conditional next step, not a proven universal prerequisite.
  Keep product integration in the existing Connector. No supported production Adapter is selected.
  The binding contract must then name trusted task selection,
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
blocked. The completed static comparison distinguishes the successful MVP launcher, the installed
App Tools service, and the failed ordinary-Node probe. Intended-client/caller admission remains open.
Narrow binding and receipt specification may proceed in parallel, but cannot prove native access.
No automatic launcher
rerun, executable substitution, credential use, or peer-policy bypass follows from this correction.
A generic multi-Agent registry or cloud-owned raw task database is out of scope.

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

[CLOUD-028](../Development/CLOUD-028-desktop-admission-route-review.md) preserves the owner-confirmed
order: legitimate same-task admission/wake, durable binding and notification receipt, then the
hosted Receiver/Game SDK two-event trace. Its launcher findings and platform questions do not
authorize restarting the App, stripping App-tool configuration, exposing an endpoint, or replacing
the selected existing-task topology.
