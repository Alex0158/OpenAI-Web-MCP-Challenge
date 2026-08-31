# RECORE-004: Receiver Grant Control

**Role:** ACTIVE IMPLEMENTATION RECORD  
**Risk profile:** High — authority and data-lifecycle mutation  
**Status:** `specified`  
**Opened:** 2026-08-31  
**Branch:** `codex/re-entry-core-foundation`  
**Baseline:** `680afba0881351bde0cedf1f8c5d1e895af79291`

## Objective

Implement and locally verify the ADR-0013 Receiver-authenticated Grant inspection and atomic
revocation lifecycle without widening Host, Connector, transport, private context, or production
authority.

Target closure is `locally_verified`. Separate-process revocation belongs to the later Program
fault-matrix increment and is not claimed here.

## Owning authority

- ADR-0013 owns the control attestation, exact methods, outputs, atomic rule, and non-goals.
- ADR-0008 owns Grant, binding, event reservation, and existing `revoked_at` semantics.
- ADR-0009 owns claim, lease, revocation fencing, and Host-effect convergence.
- Core/02 owns user-facing Grant inspection and revocation requirements.
- Core/04 and Core/05 own trust rules and evidence ceilings.

## Challenge

### Hypothesis

One required authority port, two narrow Receiver Core methods, and one existing-column
compare-and-set can close the Grant-control gap. No schema migration, HTTP administration,
background transition, or generic policy framework is needed.

### Falsifiers and stop conditions

- The design must trust a caller-supplied subject, timestamp, or Grant identity.
- Revocation cannot serialize with event acceptance in the existing transaction port.
- Pending or leased delivery can activate or acknowledge outside ADR-0013 ordering.
- A raw control token, private Grant identity, target, receipt, or managed-context value enters
  persistence or a bounded output.
- The change requires a production session, UI, Connector credential model, or new dependency.
- Exact replay cannot converge without a second mutable audit system.

If any condition occurs, stop implementation and reopen the decision rather than adding a
fallback or widening the increment.

## Bounded implementation

### A. Core authority and outputs

- Add the exact Grant-control authorization type and required `verifyControl` port.
- Add strict `inspectGrant` and `revokeGrant` inputs.
- Verify control before binding lookup, bind action and subject, and use the Core clock for
  revocation.
- Return only the exact frozen summary or revocation result, deeply immutable.

### B. Persistence

- Add one transaction-only compare-and-set for the existing `revoked_at` column.
- Do not change schema version, add a table, store the control token, or delete history.
- Keep the store port narrow and fail visibly on a lost or inconsistent write.

### C. Verification

- Cover strict positive, negative, boundary, race-order, rollback, replay, reopen, and
  token-non-persistence behavior.
- Replace override-based revocation tests with real Core revocation where applicable.
- Re-run focused Receiver/store tests, aggregate and protocol checks, Node 24 compatibility,
  dependency tree, and package selection.

## Explicitly unaffected

- Cloud Receiver HTTP routes and outbound Connector API;
- private managed-context binding and concrete Agent adapter;
- production consent, control session, anti-CSRF, pairing, and credential custody;
- production process shells, supervision, single-owner enforcement, and hosted persistence;
- MVP1, MVP2, references, research, scenarios, final-app work, deployment, and submission;
- user-owned dirty files outside the exact task paths.

## Acceptance and claim boundary

- An authenticated same-subject control can inspect one exact binding and persist one revocation.
- Invalid authority exposes no binding and changes no state.
- Revocation replay returns the stored boundary and no second write.
- Event-first and revocation-first ordering follows ADR-0013.
- Pending and leased delivery behavior uses the real persisted revocation state.
- Rollback and file reopen preserve exact state and token privacy.
- Node 24 and current-runtime checks pass with zero runtime dependencies.
- Closure claims only local Core authority and persistence behavior, not HTTP, user consent,
  production identity, process separation, Agent activation, or app behavior.

**Next entry condition:** implement only after this decision and task record are committed and
remotely verified. On closure, the next Program gap remains private managed-context binding or the
separate-process fault matrix, selected by current evidence rather than task-number momentum.
