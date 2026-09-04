# TASK-035: Bind the Existing Agent Task During Enrollment

**Role:** CANONICAL task lifecycle record  
**Registered:** 2026-09-03

## Task Control

- Type: `implementation`
- Lifecycle: `in_progress`
- Priority: `P0`
- Owner: Local Connector/Agent Adapter owner, with Receiver and Host SDK owners.
- Current increment: D1 attempted one separately authorized App-mediated inert send to the existing
  disposable MVP task, not a development task. Idle/empty-queue/no-goal preflight passed, but the
  send timed out waiting for an active turn ID; no input or new target turn was observed. CLOUD-028
  correlates the failure with the App coordinator's pending/start/steer handling. D1 is consumed,
  no resend is allowed, and C1 remains unused. This is a narrower failure boundary, not proof of
  its underlying stale-state/race cause or a platform-wide idle prohibition.
  Follow-on App logs now confirm D1 reused a warm owner state; B1's earlier cold start overlapped
  Q1's real turn. The response resolver prefers an existing turn over its optimistic null-ID
  record. A disconnected six-case state model reproduces the resulting pending wait; the full
  experimental suite passes 122/122 on Node 24. This is a source-correlated candidate defect,
  not a captured renderer-state root cause, an App fix or a new runtime pass.
  Original invocation-history readback now distinguishes MVP1's real exact-task
  delivery from idle-wake causality. The original launcher was started by an Agent executor; both
  accepted clean/rehearsal runs had an automatic goal turn running before Event arrival. CLOUD-028
  records the verified timeline and corrected Core/Mechanism claims. The recipe is already located;
  do not keep asking for its source or treat these runs as independent idle-wake proof.
  The static MVP/installed-launcher comparison is complete. CLOUD-028 now
  verifies current host-mediated same-task input and exact response: B1 appeared as tool data in
  a new completed turn after the older Q1 input. This is a joined-turn response, not isolated B1
  wake or autonomous Connector admission. Its untruncated object envelope exposed an observer
  parsing gap, now corrected with explicit role, attribution and rejection tests. The native CLI
  remains held; its fixed local result is not a new App rejection. A receiving-side source trace
  now finds no active-caller-turn gate in MCP messaging, including its deduplication and tool-routing
  checks. The target has resume/start/steer paths. This supports idle compatibility at source level,
  not independent runtime admission. Core summaries are reconciled.
  The owner then requested restoration of the original method. Test-only baseline checks now
  cover the required launcher/runtime and the frozen relay's target/message constraints; they do
  not execute the App runtime, establish admission or consume C1. CLOUD-028 records the original
  reproduction omission and why the frozen relay cannot be used unchanged for the narrower C1.
  The locally verified bounded increment makes the existing Connector `doctor` distinguish executable
  prerequisites from the fresh-session preview and unimplemented/unverified same-task capabilities.
  It preserves dispatch, credentials, the native hold and C1; the Connector aggregate passed 55
  with 12 opt-in integration skips. The separate upstream source trace found App-owned tool-call
  and approval-response paths, but not the executor's permission evaluator or a detached client
  invocation contract. This is not an exhaustive rejection of every possible legitimate route.
- Next gate: Obtain a separate owner decision for one new dedicated test task and one inert App
  notification after its initial turn has completed and idle/no-goal/no-queue/no-scheduler state
  is verified. This clean-state control discriminates B1's candidate orphan state from a broader
  idle-start failure; it is not a product fresh-session fallback. No new task/send is authorized
  by the source/model result. Preserve the old target, App state, development tasks and D1's spent
  allowance; keep this diagnosis separate from C1's background-client admission gate.
  Define the smallest legitimate invocation from the existing Connector into the
  host-owned task interface when no Agent turn is active, retaining actual caller and approval
  handling. The original task-launched relay is the implementation reference, not a requirement
  to repeat the completed source audit or copy a private pipe into a detached process.
  The B1 allowance was consumed by the host-mediated control. The owner subsequently approved
  ADR-0047's temporary local relay and one new C1 inert notification; C1 is not yet submitted.
  This scope excludes Browser and still requires legitimate host invocation before listener startup.
  CLOUD-028 identifies the existing adapter seam but no independently usable host invocation;
  implementation is stopped at that boundary, not waiting for another generic test approval.
  The pre-execution prerequisite is a permitted client invocation contract that preserves upstream
  App approval. Successful runtime admission is then an observation of the authorized experiment,
  not a result that must already be proved before testing. Neither an active-turn restriction nor
  a need for a new delegation token has been demonstrated.
  The readable-source trace is complete at the named compiled-executor boundary. Obtain its
  permitted invocation contract for caller context and upstream approval, or original-integrator
  evidence of a genuinely independent idle-target run. The original active-executor launch recipe
  has been found and is not the missing source. Do not repeat that trace without new input.
  The new verification must rule out automatic goal continuation, a user wake message or another
  scheduler before the Event. Do not turn those mechanisms off in another task without authority;
  use a confirmed idle target within the approved diagnostic scope. C1 remains unused.
  Do not repeat wrapper metadata inspection as evidence for those unsupported requirements.
  A stored task locator or Re-entry Grant does not itself authorize
  App invocation. Name any actual authority change before requesting it; do not presume one from
  missing public documentation. Then specify scope, lifetime, renewal if needed, restart and revocation.
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
