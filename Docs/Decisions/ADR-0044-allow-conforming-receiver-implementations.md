# ADR-0044 — Allow Independently Implemented Conforming Receivers

**Status:** Accepted  
**Date:** 2026-09-03  
**Owners:** Principal architecture owner, Re-entry Core owner, Cloud Receiver v2 owner  
**Related:** ADR-0006, ADR-0012, ADR-0033 through ADR-0039, ADR-0043, TASK-028, TASK-033

## Context

ADR-0006 established one Receiver authority model and required hosted and local service shells to
compose the same Receiver Core. The application-neutral `reentry-core/` reference follows that
model with synchronous authority operations and a synchronous SQLite transaction port. The active
Cloud Receiver v2 instead implements Consent, Grant, Event, delivery, lease, acknowledgement, and
account control in TypeScript over Express, Prisma, and PostgreSQL. It does not import
`reentry-core/`.

The active implementation did not by itself amend ADR-0006. Green feature-specific tests also do
not prove that two independent algorithms have identical state, time, replay, race, and error
semantics. The effective-Grant-expiry conflict recorded by AUDIT-V2-002 is already evidence that
independent implementations can drift despite passing their own tests.

Directly composing the current Core package is not a proportionate correction. Its SQLite store
rejects asynchronous transaction callbacks, while Prisma/PostgreSQL authority work is necessarily
asynchronous. Requiring composition now would either force a broad asynchronous Core rewrite or
restore a hydrate-SQLite-and-write-back compatibility bridge with serialized requests. Neither is
required to establish one normative Receiver model.

Protocol v0.2 adds a second pressure: standing authorization requires repeated ordered signals,
one-open-activation fencing, durable restart, replay, revocation, and effect-backed completion. The
project needs one mechanically enforceable semantic contract before that behavior is implemented in
the active Receiver.

## Decision

### 1. Keep one normative model, permit conforming implementations

ADR-0006 Section 3 is amended only at the implementation-identity boundary:

> Re-entry has one normative Receiver authority model. More than one executable implementation may
> exist only when every retained implementation passes the same mandatory, versioned conformance
> contract.

`reentry-core/` remains the application-neutral reference implementation and owns the shared
protocol fixtures and conformance corpus. Accepted ADRs, canonical Mechanism contracts, and strict
protocol values own normative semantics; runtime output from either implementation does not create
or amend expected behavior.

The active TypeScript/Prisma/PostgreSQL Receiver may remain independently implemented. Its account,
browser-session, pairing, developer-portal, HTTP-shell, relational-repository, and operational
concerns remain Cloud Receiver responsibilities. Independence does not permit alternate Consent,
Grant, binding, Event, sequence, replay, delivery, lease, effect, acknowledgement, revocation,
scope, time, error, or redaction semantics.

All other ADR-0006 authority and process boundaries remain unchanged. In particular, the Host owns
business truth, the Receiver owns continuation authority, the Connector is outbound-only, and the
Agent or adapter cannot assert Host effect or acknowledgement authority.

### 2. Make pinned black-box conformance a release gate

The shared corpus is owned from the Re-entry Core source and consumed by exact identity; it is not
copied and independently maintained in the Cloud Receiver repository. Each conformance run records:

- the exact Re-entry Core/conformance commit;
- the exact implementation commit and clean or intentionally bounded source state;
- the runtime and dependency-lock identity;
- the applied durable-schema migration set; and
- the target profile and exact pass/fail result.

The reference implementation runs through a loopback HTTP shell and its real SQLite store. The
active implementation runs through its real Express handlers and a disposable PostgreSQL database.
Test-only setup may seed deterministic Host keys, user/target identity, Connector authority, clock,
and effect authority through bounded harness control or IPC. It must not add a production reset,
effect, inspection, or administration route.

The adapter may normalize generated opaque identifiers and explicitly declared clock values. It
must not normalize HTTP status, stable error code, retryability, replay flag, state transition,
sequence, claim result, acknowledgement result, or revocation behavior. Expected results come from
accepted contracts and fixed vectors, never from running one implementation as the oracle for the
other.

A change to normative semantics is contract-first: accept the governing ADR or protocol amendment,
update the shared vector, then update every retained implementation. A one-sided green result blocks
merge, package release, migration promotion, and deployment claims for that protocol version.

### 3. Split normative conformance from implementation-profile verification

The mandatory matrix has two named layers:

1. **Normative Receiver conformance** contains the protocol and authority behavior that every
   retained implementation must share. It includes all frozen v0.1 vectors plus the accepted v0.2
   standing-authorization vectors.
2. **Production implementation profile** contains additional selected operational behavior that is
   not yet implemented by every reference path. For active v2 this includes three-attempt leasing,
   sixty-second leases, expired-lease reclaim, and durable `retry_exhausted` behavior from ADR-0037.

Passing the production profile does not amend normative semantics, and passing the smaller shared
profile does not prove the production profile. A production behavior becomes shared normative
conformance only after its governing contract and every retained reference path are reconciled.

The current standing Core reference has one bounded claim attempt. Therefore the first v0.2 shared
slice proves standing authority and two successful claim/effect/acknowledgement cycles; active-v2
reclaim and exhaustion remain mandatory active-v2 regressions until the standing reference is
hardened under TASK-033.

### 4. Require one minimum v0.2 black-box trace

The first shared standing-authorization trace performs these observable operations through the
selected versioned Receiver transport:

1. approve one standing Consent and receive one opaque binding at sequence zero;
2. accept signal sequence 1, then return exact duplicate truth for its replay;
3. reject sequence 2 as retryable `activation_in_progress` while signal 1 remains non-terminal,
   without storing work or advancing the sequence;
4. claim signal 1, verify one separate correlated Host effect, and acknowledge it;
5. accept the same sequence-2 signal without another Consent decision, then claim, effect-verify,
   and acknowledge it;
6. restart the Receiver and inspect sequence 2 with no open activation;
7. revoke the standing Grant, reject sequence 3 and any new or reclaimed lease, and preserve exact
   historical replay of signal 1 without creating work; and
8. retain all frozen v0.1 results unchanged.

The mandatory negative vectors also cover concurrent distinct Events competing for the same next
sequence, Event-versus-revocation linearizability, conflicting Event identity, wrong target,
invalid signature/origin/time, acknowledgement without a valid effect, and state preservation on
every failed operation.

The exact v0.2 HTTP paths and envelopes must be accepted and implemented before this trace can pass.
The current standing Core reference alone is not HTTP conformance evidence.

### 5. Use an additive exact-source PostgreSQL migration

The active Receiver adoption uses a reviewed migration from an exact committed source. It must:

- preserve existing v0.1 rows, tables, uniqueness constraints, routes, and rejection behavior;
- never upgrade a v0.1 Grant in place; a new v0.2 Consent creates new standing authority;
- add explicit standing Grant state including authorization mode, approved scope, expiry,
  revocation, maximum active activations, and last accepted sequence;
- permit multiple standing Events and Deliveries per standing Grant while retaining unique Event
  identity, unique `(grant_id, event_sequence)`, and one Delivery per Event;
- enforce at most one `pending` or `leased` standing Delivery per Grant with a PostgreSQL partial
  unique index in reviewed migration SQL;
- retain digest-only lease credentials, durable attempt/effect/acknowledgement facts, and terminal
  failure state required by the active production profile;
- lock or compare-and-set the same Grant authority boundary so Event acceptance atomically validates
  the next sequence and open slot, advances the sequence, stores the Event, and creates the pending
  Delivery;
- serialize Event, revocation, claim/reclaim, and acknowledgement races consistently with ADR-0043;
  and
- provide forward verification, rollback or restore procedure, and no silent empty-state fallback.

Separate additive standing tables are the default migration shape because active v0.1 currently
enforces one Event and one Delivery per Grant. Dropping those constraints or adding nullable
polymorphic foreign keys requires a separate reviewed justification and equivalent rollback proof.

The same-user control authority also needs a real active-v2 inspection and revocation surface.
Organization API keys must not gain authority over user-owned Grants. Exact route and session/CSRF
behavior require their governing contract before implementation; schema existence is not control
authorization.

### 6. Defer direct Core composition

Direct package composition is rejected for the current increment. It may be reconsidered if the
Core gains a durable asynchronous repository or unit-of-work port that can participate in one
PostgreSQL transaction without hydration, global serialization, dual writes, or weakened failure
semantics. Until then, mandatory conformance is the enforcement mechanism, not a claim that two
algorithms are intrinsically identical.

## Consequences

### Positive

- The active Receiver can retain its production-appropriate TypeScript/Prisma/PostgreSQL structure.
- The architecture has one normative authority model without pretending that shared package
  composition already exists.
- Protocol drift becomes a release-blocking executable result instead of a documentation review.
- v0.1 remains frozen while v0.2 can be added without destructive Grant conversion.
- Core reference evidence and production lease-profile evidence remain accurately separated.

### Costs and risks

- Two implementations can still share an untested bug or drift outside covered vectors. Time,
  replay, race, rollback, restart, and typed-failure vectors are therefore mandatory, not optional
  unit-test duplication.
- Cross-repository CI must pin and report exact source identities; copied fixtures or floating branch
  references would recreate the drift this decision is intended to prevent.
- Prisma may not express the required partial unique index. The generated migration SQL and the
  resulting PostgreSQL catalog must be reviewed and tested directly.
- The current v0.2 reference does not yet prove reclaim, attempt exhaustion, rate limits, quotas, or
  a public control surface. No production standing-authorization claim follows from the first shared
  trace.
- The deployed active-v2 snapshot is not currently Git-attested. Existing deployment evidence cannot
  be relabelled as evidence for this architecture, migration, or v0.2.

## Rejected alternatives

### Require direct composition immediately

Rejected because the current synchronous Core transaction boundary does not compose honestly with
asynchronous Prisma operations. A broad Core rewrite or serialized hydration bridge would expand
the change before conformance proves the intended behavior.

### Treat active-v2 tests as sufficient equivalence

Rejected because implementation-owned tests can encode implementation-specific behavior. Existing
expiry drift demonstrates that green local suites do not establish one normative model.

### Copy the Core tests into the active Receiver repository

Rejected because two mutable copies can diverge while both remain green. The corpus must have one
owner and be consumed by exact pinned identity.

### Put production-only lease behavior into the first shared slice

Rejected because the standing Core reference does not yet implement the active-v2 retry profile.
The behavior remains mandatory for active v2, but cannot be reported as cross-implementation
conformance until both paths implement the accepted contract.

## Verification and release gate

TASK-028 remains open until the pinned shared runner passes every retained implementation through
real transport and durable stores, exact state and race vectors pass, and release automation blocks
one-sided drift. TASK-033 owns the v0.2 cross-layer adoption and Postgres migration proof.

No active Receiver migration or release claim is valid without an exact reviewed implementation
commit, exact conformance commit, applied-migration identity, disposable-database verification,
v0.1 regression result, and post-migration readback. A working-tree deployment or independently
green feature suite does not satisfy this gate.

## Reopen triggers

Reopen this decision if direct composition becomes transactionally viable, another Receiver
implementation is retained, the shared adapter masks a semantic mismatch, a production profile must
become normative, or a passing vector still permits different durable state, time, replay, error, or
revocation outcomes.
