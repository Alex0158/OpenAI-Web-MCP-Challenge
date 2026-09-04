# TASK-035: Bind the Existing Agent Task During Enrollment

**Role:** CANONICAL task lifecycle record  
**Registered:** 2026-09-03

## Task Control

- Type: `implementation`
- Lifecycle: `in_progress`
- Priority: `P0`
- Owner: Local Connector/Agent Adapter owner, with Receiver and Host SDK owners.
- Current increment: Public queue Q2 now verifies one loaded-idle same-task wake.
  Q2 used one public `codex queue` call to the existing D2 fixture
  after loaded-idle/no-goal/no-queue/no-automation preflight. A distinct turn received the fixed
  `userMessage`, returned its exact marker and completed with zero tools. Passive observation
  confirmed completion before post-send App readback; there was no App-message rescue or fresh
  task. This runtime-verifies the external public-CLI path for the named condition, not the
  product Connector consumer, durable enrollment, qualified receipt, unloaded/restart behavior
  or Browser/WebMCP. Q2 is consumed with no retry; CLOUD-028 owns its timeline and claim limits.
- Historical diagnostic record (retained): The owner-approved D2 clean-state control created one dedicated projectless
  diagnostic task, completed its inert initial turn, verified idle/no-goal/no-queue/no-automation,
  then sent one fixed App-tool notification. A distinct turn in that same task returned the exact
  marker and completed with zero tool calls. Both turns used the configured default without
  model/effort override. App logs confirm successful warm-state `turn/start`, so neither idle
  state nor warm ownership alone prohibits this route. D2 is consumed with no retry. This is
  runtime-verified App-mediated idle wake, not independent background Connector admission or an
  App fix. CLOUD-028 owns the exact timeline and limits; the old-target pending-state cause is
  still inferred. No development task was targeted and C1 remains unused.
  D1 attempted one separately authorized App-mediated inert send to the existing
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
- Next gate: D2 closes the clean App-mediated idle-wake discriminator; do not request or perform
  another generic idle test. Preserve the old target and its unresolved pending-state failure,
  the idle D2 fixture, App state, development tasks and spent B1/D1/D2 allowances. No additional
  send or App mutation is authorized. Repeated-handoff reliability still needs overlap/state-
  reconciliation evidence; D2 does not prove the old task repaired or automatic retries safe.
  Start with the now-positive Q2 public queue primitive and retained Connector adapter, while
  coordinating the owner-held TASK-036 surfaces. Define the loaded-state support boundary,
  trusted enrollment/private binding, fixed event-only message and qualified admission under
  ADR-0049. The unchanged v0.1 adapter is not ready for promotion: it binds in process memory,
  sends a Browser/action prompt, and reports command acceptance rather than a qualified v0.2
  attestation. Do not silently wire it into the standing consumer or relabel queue success.
  Q2's `userMessage` role must be reviewed against notification-only semantics, not hidden as
  typed event data or treated as a new user strategy. Present any contract change before code.
  Unloaded/busy/restart and ambiguous outcomes still need a bounded implementation contract;
  preserve unknown without blind resend. A marker response is diagnostic evidence, not business
  completion required for handoff. Product proof must distinguish ingress, admission and wake.
  C1 remains unused and held on its private host-invocation prerequisite; it is a separate
  alternative, not the gate for the public path. B1/D1/D2/Q2 are consumed. Do not repeat generic
  idle controls, impersonate a caller, copy the private pipe into a detached process, or mutate
  another task's goal/queue/automation. A stored locator or Grant alone is not invocation authority.
  Platform coordination is conditional, not a universal prerequisite after Q2's narrow success.
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
