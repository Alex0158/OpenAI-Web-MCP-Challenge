# ADR-0048 — Adopt Until-Revoked Standing Lifetime v0.3

**Status:** Accepted semantic profile; implementation and protocol transition open  
**Date:** 2026-09-04  
**Owners:** Project owner, Re-entry Core, Host SDK, Cloud Receiver v2, Local Connector, and Sleepless Kingdom integration owners  
**Related:** ADR-0043, ADR-0045, ADR-0046, TASK-027, TASK-028, TASK-029, TASK-033, Research 25

## Context

ADR-0043 and ADR-0045 accept a standing authorization and transport profile with finite v0.2
Grant lifetime. The selected product also requires one informed Consent to support repeated
notifications to the same bound task under ADR-0046. The current Core, active Receiver, SDK,
Connector, registry artifacts, and hosted snapshots do not have one proven jointly controlled v0.2
provenance. Revising v0.2 in place would risk old binaries interpreting new lifetime semantics.

The project therefore needs a durable lifetime choice that supports continuous coordination while
preserving compatibility, bounded execution, explicit revocation, and a reversible rollout.

## Decision

Re-entry adopts an additive v0.3 standing lifetime profile with an explicit signed
`lifetime.mode = "until_revoked"` representation. Finite v0.2 standing authorization remains the
current compatibility and demo profile. Existing v0.1 and v0.2 routes, rows, canonical bytes,
validators, and package behavior are not reinterpreted by this decision.

The v0.3 profile is a semantic and compatibility boundary. Its exact transport route names,
notification-handoff receipt, storage migration topology, and executable release sequence must be
accepted as one coordinated implementation under TASK-027, TASK-029, TASK-028, and TASK-033. A
separate proposal must not independently assign incompatible meanings to a shared future version.

## Lifetime and clock rules

- The signed Host offer remains finite and keeps existing signature and freshness validation.
- The Consent decision and page token use one fixed short absolute deadline, recommended as the
  earlier of offer expiry and creation plus ten minutes. No sliding page-token renewal is allowed.
- A v0.3 Grant has no scheduled expiry. It ends through explicit user/control revocation, issuer or
  security invalidation, or a material change to the consented scope.
- Event signature freshness, Connector authentication, delivery leases, stale-worker checks,
  attempt limits, effect timing, acknowledgement correlation, and user control sessions remain
  finite. Until-revoked authority never turns operational credentials or leases into permanent
  bearers.
- The effective lifetime shown to the user is the actual selected profile. The Receiver fails closed
  on missing, null-only, far-future, mixed, or unknown lifetime representations.

## Scope, revocation, and invalidation

The Grant keeps the consented subject, issuer origin and key identity/material, workflow and URL,
signal type, instruction, selected delivery target, continuation mode, human boundary, and
one-active-activation limit immutable. A changed key, device, target, workflow, signal, instruction,
or human boundary requires a new informed Consent unless a separately audited same-authority
rotation is accepted.

Explicit revocation is idempotent and serializes with Event acceptance, claims, and handoff:

- a revocation committed first rejects new Events and handoffs;
- an Event committed first remains historical truth and can be read by authenticated scoped access;
- revocation blocks new or reclaimed delivery leases after its commit; and
- a notification already handed to an external Agent cannot be recalled by revocation.

Connector offline or process stop does not silently revoke a Grant. Issuer key-material invalidation
and explicit device/target decommission must have a durable cutoff and defined pending-work outcome;
they must not silently rebind authority to another identity. No device-wide cascade is assumed for
ordinary offline behavior.

## Compatibility and storage

- v0.2 remains finite, version-selected, and regression-tested. Its `grant_expires_at`, routes,
  stored rows, and effect-backed compatibility evidence remain valid.
- v0.3 may use an isolated storage namespace or another version-aware schema only when old binaries
  cannot read or mutate new rows. An additive migration is required; destructive down-migration is
  outside this decision.
- A v0.2 Grant is never upgraded or extended in place. A new informed Consent creates v0.3 authority.
- SDK and Connector artifacts for v0.3 require new immutable versions, exact source identity,
  package integrity, and clean-consumer evidence. Existing registry versions are not reused.
- Rollback disables v0.3 enrollment and routing while retaining its data; it does not claim that an
  old binary is safe against a new schema without explicit proof.

## Signal and selected-product boundary

Standing authorization permits repeated ordered signals, not raw domain-event forwarding. The Host
outbox assigns durable Event identity and sequence; exact retries reuse the same identity. One
non-terminal activation is allowed per Grant. A concurrent signal receives typed retryable
backpressure and remains in the Host's bounded outbox/coalescing policy; it does not consume a
sequence until accepted.

The selected product follows ADR-0046: Receiver settlement is the trusted notification-handoff
boundary. Lifetime and authorization do not wait for Agent completion, Browser/WebMCP access, or a
Game effect. TASK-029 owns the handoff receipt and recovery contract; TASK-034 owns actual same-task
wake and authenticated WebMCP evidence. Game continues to emit only its accepted signal until its
owner accepts any scoped extension.

## Module responsibilities

- **Receiver:** authority, lifetime, revocation, invalidation, sequence, admission, and durable
  delivery state.
- **Host SDK:** signed profile selection and Event construction; no lifetime extension or automatic
  renewal.
- **Local Connector/Adapter:** finite credential and lease validation, stable handoff correlation,
  and local task binding; no Grant renewal or alternate-task fallback.
- **Game:** opaque binding, durable outbox, and approved business signal; no authority or credential
  decision in browser/page tools.
- **Consent/control UI:** same-user authenticated inspection and revocation with Origin/CSRF guards,
  clear scope/lifetime/status, and explicit in-flight limitations.

## Acceptance and non-goals

Before executable v0.3 rollout, prove strict lifetime parsing/signing, v0.2 regression, time-boundary
behavior, two sequential signals, one-active backpressure, duplicate and out-of-order handling,
revocation races, key/device invalidation, restart and offline recovery, old-row preservation,
old-binary rejection of v0.3 data, and rollback routing. Keep notification handoff, Agent wake,
Browser/WebMCP, and optional Game effects as separate evidence levels.

This decision does not add a new Game signal, change the command envelope, select a Desktop API,
create a permanent credential, authorize automatic renewal, require a background expiry job, publish
packages, deploy production, or claim that the current active v0.2 implementation already supports
v0.3.

## Consequences

The project gains a clear long-lived authorization model for continuous Re-entry while preserving
the current v0.2 integration path and a reversible compatibility boundary. The cost is an additional
versioned contract, storage/release surface, explicit control UI, invalidation policy, and a larger
conformance matrix. Those costs are accepted because the current consumer provenance is already
divergent and silent v0.2 reinterpretation would create greater compatibility and security risk.
