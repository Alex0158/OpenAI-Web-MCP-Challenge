# RECORE-005: Separate-Process Fault Matrix

**Role:** CLOSED IMPLEMENTATION RECORD  
**Risk profile:** High — forced process termination and durability evidence; no shipping behavior  
**Status:** `separate_process_verified`  
**Opened:** 2026-08-31  
**Closed:** 2026-08-31  
**Branch:** `codex/re-entry-core-foundation`  
**Baseline:** `bc224cc2c25ee04b21ba7e9d9993e503575ab3b4`
**Implementation commit:** `e5571fa8cb56ff129e787fb725a81d5ee94bfae5`

## Objective

Directly verify the remaining application-neutral separate-process fault matrix against the
current Receiver Core, SQLite store, HTTP adapter, and outbound Connector client. Close the gap
without adding a production process shell, runtime hook, retry, fallback, route, schema,
dependency, or private managed-context contract.

Target closure is `separate_process_verified` only for the exact test boundaries below. The
existing production, distributed, Agent, Browser, WebMCP, and selected-app non-claims remain.

## Authority and sequencing

- The Program Definition of Done requires direct separate-process revocation, stale-state,
  duplicate-effect, restart, and mid-transaction failure evidence.
- ADR-0008 owns atomic event reservation and durable pending delivery.
- ADR-0009 owns lease reclamation, stale-worker fencing, effect identity, and acknowledgement.
- ADR-0010 owns the existing HTTP and outbound Connector boundary.
- ADR-0012 owns source-repository role reuse and keeps fault orchestration test-only.
- ADR-0013 owns Grant revocation and effect-time ordering.
- Core/04 and Core/05 own failure semantics and the evidence ceiling.

No new ADR is required because this increment changes no product, protocol, authority, data
lifecycle, shipping topology, or package behavior. If implementation needs any such change, stop
and open the governing decision rather than hiding it inside a test hook.

This increment precedes private managed-context binding because every tested transition already
has an accepted contract and real persistence state. A context-binding lifecycle still depends on
an unselected Agent ownership and custody model; it must not be invented merely to unblock these
independent failure checks.

## Challenge

### Hypothesis

Four bounded process cases can close the remaining delivery fault evidence by reusing the current
Host, Receiver, and Connector roles plus one exact test-only post-write termination point. The
runtime source and package can remain unchanged.

### Falsifiers and stop conditions

- A case requires a new runtime retry, sweeper, daemon, lock, route, credential, or fallback.
- The Receiver or Connector must accept authority from the test controller rather than an
  existing deterministic authority port.
- Process isolation cannot be shown through distinct PIDs, Receiver-only SQLite ownership, and
  bounded credentials.
- Expiry evidence depends on an unbounded or nondeterministic wait.
- Mid-transaction termination can occur outside the named write boundary or may commit before
  the forced exit.
- A raw Connector, claim, control, or effect token enters durable files or bounded public output.
- The test composition leaks into package files or changes direct conformance behavior.

If a falsifier occurs, preserve the smallest failing evidence and revise the test boundary. Do
not add a general fault-injection framework or production recovery behavior.

## Bounded matrix

### P1 — revocation before event

- Approve one Grant, revoke it through the deterministic Receiver control authority, terminate
  and restart the Receiver, and inspect the same binding.
- The stored revocation boundary remains exact, the run remains unspent, and a later signed event
  is rejected without an event or delivery record.

### P2 — lease before revocation

- Accept and lease one delivery, obtain one Host effect before revocation, then revoke and restart
  the Receiver.
- Exact claim replay cannot reactivate the delivery; the pre-revocation effect may acknowledge
  late; exact acknowledgement replay is a duplicate; and a different pre-boundary effect is a
  visible conflict.

### P3 — expired lease and stale worker

- Persist one short lease, restart the Receiver, wait only until its recorded expiry plus a small
  bounded margin, and reclaim it from a second Connector process with a fresh claim token.
- The retired claim token cannot reclaim work, the stale worker cannot acknowledge, and the new
  lease can converge through one authorized Host effect.

### P4 — OS termination before transaction commit

- Arm one test-only Receiver-store wrapper to send `SIGKILL` immediately after the existing
  `insertDelivery` write returns but before the surrounding event transaction can return or
  commit.
- After restart, the Grant run, event, delivery, and delivery-state rows show no partial commit.
  Exact event resubmission is accepted as new work and creates one complete reservation.

## Minimal implementation boundary

- Permit `createReceiverRole` to receive an optional composition-time store factory and
  Grant-control authority. The normal conformance profile supplies neither.
- Expose Grant inspection and revocation role commands only when that authority is injected.
- Keep the fixed control authority, post-delivery-write `SIGKILL` arm, process orchestration, and
  cleanup inside `test/process-fixtures/` and the new fault-matrix test.
- Allow a bounded one-second lease only through the existing `leaseDurationMs` Core option passed
  by the test role; wait against the returned absolute expiry rather than a guessed delay.
- Reuse current Host, Receiver HTTP, Connector client, SQLite schema, and typed errors. Do not add
  a second implementation or a new wire route.

## Verification and claim boundary

- Run the focused fault matrix and existing separate-process test on Node 24 and the current
  runtime.
- Run the aggregate suite, protocol conformance, and direct redacted conformance profile on both
  supported runtimes where material.
- Confirm zero runtime dependencies and unchanged package file selection.
- Inspect persisted SQLite, WAL, and SHM bytes for the bounded raw test tokens before cleanup.
- Prove exact child termination signals, restarts, state transitions, errors, and duplicate flags.
- Preserve exact cleanup on handled success and failure; external interruption remains outside
  that cleanup claim.

Closure may claim only the four named source-repository test-process cases. It does not prove a
supervised service, production shutdown, arbitrary crash point, power-loss behavior, storage-
device durability, concurrent Receiver ownership, multi-replica coordination, distributed store,
real identity, real Host-effect verifier, private context binding, Agent activation, deployment,
or judge portability.

## Explicitly unaffected

- Runtime source behavior, public exports, package files, protocol vectors, and database schema;
- Cloud Receiver administration, consent, control, health, pairing, or diagnostic HTTP;
- production process ownership, Connector custody, retention, and multi-replica policy;
- private managed-context binding and concrete Agent adapter;
- MVP1, MVP2, References, research, scenarios, final-app work, deployment, and submission;
- user-owned dirty files outside the exact task paths.

## Verification record

**Closure:** `separate_process_verified` on 2026-08-31.

- P1 preserved exact revocation across Receiver restart, left the Grant run unspent, and rejected
  the later event as `grant_revoked` without a delivery.
- P2 kept exact claim replay retired after revocation, allowed only the effect confirmed before
  revocation to converge, returned exact acknowledgement replay as a duplicate, and exposed a
  different effect as `delivery_effect_conflict`.
- P3 reclaimed a one-second expired lease through a second Connector process, rejected the old
  claim as `claim_token_retired`, fenced the stale worker as `delivery_lease_invalid`, and allowed
  the new lease to converge.
- P4 observed Receiver exit by `SIGKILL`, no partial event transaction after restart, one exact
  reacceptance as new work, and duplicate replay only after that complete reservation committed.
- The focused process suite passed 5 of 5 tests, and the aggregate suite passed 71 of 71 tests,
  on Node 24.20.0 and Node 26.5.0.
- Protocol conformance passed 11 of 11 tests on both runtimes. Direct redacted conformance output
  remained exact on both runtimes, and the normal profile rejects Grant-control commands because
  it receives no control authority.
- Runtime dependencies remain zero. Package selection remains 15 files, 32,602 compressed bytes,
  and 170,432 unpacked bytes; conformance and test sources remain excluded.
- Persisted database, WAL, and SHM bytes excluded the bounded raw Connector, claim, control, and
  effect tokens before exact handled cleanup.
- Only conformance and test sources changed. Runtime `src/`, routes, schema, protocol vectors,
  public exports, dependencies, and package behavior did not change.
- The implementation commit was pushed, and the remote branch resolved to the same exact SHA.

This closure proves only P1 through P4 at the named source-repository test boundaries. It does not
prove arbitrary crash placement, power-loss durability, production supervision, concurrent
Receiver ownership, distributed coordination, real identity or Host-effect verification, private
context binding, Agent activation, deployment, or judge portability.

**Next entry condition:** return to the private managed-context binding gap and final exact Program
audit. Do not expand the fault harness.
