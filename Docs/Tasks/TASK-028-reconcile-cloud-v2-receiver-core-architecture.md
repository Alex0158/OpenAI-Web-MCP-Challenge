# TASK-028: Reconcile Cloud v2 Receiver Core Architecture

**Role:** CANONICAL task lifecycle record  
**Registered:** 2026-09-03

## Task Control

- Type: `decision`
- Lifecycle: `verification_pending`
- Priority: `P1`
- Owner: Principal architecture owner and Cloud Receiver v2 owner.
- Current increment: Core and Receiver sources are committed locally; the minimum pinned standing
  trace and exact-commit PostgreSQL upgrade rehearsal pass. CLOUD-023 owns the bounded evidence.
- Next gate: Complete the mandatory
  shared v0.1/v0.2 failure/race/recovery matrix, and enforce release checks while retaining the
  separate active-v2 production lease profile. Public controls need their own accepted contract.
- Dependencies: ADR-0006, ADR-0012, ADR-0033 through ADR-0039, ADR-0043 through ADR-0045,
  AUDIT-V2-004 in Core/09, TASK-012, and TASK-033.

## 1. Problem and objective

ADR-0006 says the Receiver authority model is not implemented twice and Cloud/local shells wrap the
same Receiver Core. Active v2 independently implements Consent, Grant, Event, lease, and
acknowledgement services and has no Core package dependency. ADR-0033 preserves Core authority but
does not explicitly amend the one-implementation rule.

The objective is to remove this architecture ambiguity without retroactively legitimizing code by
documentation alone.

ADR-0044 resolves the decision boundary: the project keeps one normative Receiver authority model,
but permits the active TypeScript/Prisma/PostgreSQL Receiver to remain independently implemented.
That permission is conditional on mandatory pinned black-box conformance, exact-source migration
evidence, and release checks that block one-sided drift. Direct Core composition is deferred rather
than represented as current behavior.

## 2. Authority and evidence

- ADR-0006 and Core/03 own the one-Receiver topology.
- ADR-0033 selects the v2 base and keeps Core/accepted ADRs authoritative.
- Current package manifests, imports, services, schemas, and test matrices prove the two code paths.
- AUDIT-V2-004 records the current conflict; neither implementation is automatically declared wrong.
- ADR-0044 amends ADR-0006's implementation-identity rule while preserving its authority and process
  boundaries.
- The current standing Core reference proves the normative two-signal authority slice but not the
  active-v2 retry/reclaim profile, public control surface, Postgres migration, or deployed source.

## 3. Scope

Implement the accepted independent-conformance architecture across authority, transactions, error
mapping, schema evolution, deployment, release ownership, and test enforcement. Reconcile Core/01,
Core/03, Mechanisms 01–03, package boundaries, and verification only after executable evidence
exists; ADR acceptance resolves the architecture choice but does not close the current verification
and release gap.

## 4. Non-goals

- moving or rewriting production code outside the accepted independent-conformance direction;
- weakening strict v0.1 contracts to make implementations appear aligned;
- treating duplicated tests as proof of equivalent algorithms;
- migrating data without an exact selected implementation, additive migration, and rollback or
  restore plan;
- treating the active-v2 production retry profile as shared normative conformance before the Core
  standing reference implements it; or
- adding a public inspection/revocation route without same-user authority and its own route/session
  contract.

## 4.1 Exact-source standing-v0.2 preflight

**VERIFIED 2026-09-03:** a disposable detached checkout resolved active Receiver `origin/main` to
`6b4826f68bb3634d004c49259d9c5311c660d997`. Candidate `0d7bc3c4282fd3db2e9558874a0941ece3df13f5`
is its ancestor, and `git diff 0d7bc3c..6b4826f -- backend` is empty. The inspection changed no
workspace file, external repository, branch, commit, or deployment.

The exact source confirms these migration constraints:

- current Prisma and SQL enforce one Event and one Delivery per Grant, and the signed-Event migration
  fixes `event_sequence = 1`; widening those v0.1 constraints would violate the frozen profile;
- current Consent copies its ten-minute session expiry into the Grant, so standing lifetime cannot
  inherit that path until TASK-027 decides request narrowing, maximum lifetime, renewal, and visible
  display policy;
- `HostSubjectBinding` is target-stickiness state, not the new per-Consent opaque public binding; a
  standing Grant needs its own unique `bindingId` plus a foreign key to the selected subject/target
  binding; and
- the active canonical serializer uses `localeCompare` and accepts JavaScript values the Core rejects;
  a v0.2 validator must reproduce Core canonical bytes and limits rather than reuse it as-is.

The recommended additive model is `StandingConsentSession`, `StandingGrant`, `StandingEvent`,
`StandingDelivery`, and `StandingDeliveryAttempt`, introduced by one hand-reviewed SQL migration.
The standing Grant must explicitly persist account/subject, organization, consented Host-key ID and
SHA-256 SPKI public-key fingerprint,
issuer origin, workflow identity/type/URL, signal type, immutable instruction, human boundary,
continuation mode, effective expiry, selected target, `authorization_mode = 'standing'`,
`max_active_activations = 1`, revocation, and `last_event_sequence`. Event and Grant sequences use
PostgreSQL `BIGINT`; Events require global `event_id` identity plus `UNIQUE(grant_id,
event_sequence)`. Delivery keeps one Event, a non-unique Grant foreign key, digest-only lease
credentials, the existing bounded three-attempt lifecycle, effect and acknowledgement state, and a
manual partial unique index allowing at most one `pending` or `leased` Delivery per standing Grant.

The minimum transaction ordering is:

1. Event, revoke, and claim/reclaim lock the same standing Grant row.
2. Event replay lookup and canonical identity comparison occur before revoked/expired checks so an
   accepted historical Event remains replayable after revocation.
3. Under the Grant lock, Event handling rechecks replay, consented Host key ID and material, scope, occurrence time,
   exact next sequence, and open activation, then atomically advances sequence and inserts the Event
   plus pending Delivery.
4. Sequence conflict is decided before open-slot backpressure, so two distinct Events competing for
   one next sequence converge deterministically; the actual next Event during open work receives
   retryable `activation_in_progress`.
5. Claim/reclaim rechecks expiry and revocation under the same Grant lock. Effect verification may
   occur outside the database transaction, but acknowledgement must re-read and compare-and-set the
   Delivery and accept only an effect confirmed before revocation.

The least-coupled source layout is one isolated `backend/src/modules/standing/` module, an additive
Prisma/SQL migration, exact v0.2 protocol middleware and validators, and new versioned routes wired
through `backend/src/routes/index.ts` and `backend/src/app.ts`. Existing v0.1 consent, Event,
claim/reclaim, effect, and acknowledgement logic is reusable as reviewed behavior and test patterns,
not as a branch that weakens its schema or response contract.

Release remains blocked until all of the following are explicit:

- a separate standing Consent page/token namespace and same-user inspect/revoke route/session/CSRF
  contract; the current page posts to v0.1 and says “Once/works once,” while the Contracts dashboard
  is preview data rather than a control surface;
- TASK-029's real Host-effect authority; the current production composition returns `501` when no
  authority is injected;
- Connector saved-capability negotiation and deliberate v0.2 selection while v0.1 remains default;
- v0.2 middleware coverage for parser, validation, route, not-found, and internal failures using exact
  `{error:{code,retryable}}` bodies without changing v0.1;
- Receiver-side Event/claim rate and quota controls; current rate limiting covers auth routes only;
  and
- a pinned cross-repository conformance release gate; the inspected active repository currently has
  no `.github` CI surface.

## 4.2 Active kernel and source-pin boundary

The following paragraphs preserve earlier source-closure snapshots; Section 4.3
owns the subsequent Receiver commit and exact upgrade result.

The active Receiver `Re-Entry` working tree based on
`6b4826f68bb3634d004c49259d9c5311c660d997` now contains the additive five-table migration,
isolated standing service, and real `/v0.2` Event/claim/ACK routes. Node 24 verification passed
21 backend suites / 154 tests, root type-check and build, and the shared standing scenario against
disposable PostgreSQL. Consent and control use typed internal seams, and effect evidence is
deterministic. The [Receiver verification record](../../saas-boilerplate/backend/conformance/standing-v0.2/README.md)
owns reproduction and limitations; neither this implementation nor migration is committed or
deployed.

The Core source at the initial observed HEAD `4a71866ac1a5735b22d4931b0d7f555fa2ba306d` did not contain
the standing scenario in its Git tree; relevant source and ADRs then existed only in the working
tree. That historical observed digest was not an ADR-0044 commit pin. The source-preflight
increment rejects absent, mismatched, uncommitted, or
modified source before dynamic imports and database work; its development mode is explicit and
non-release. Sixteen source-identity tests pass, including Git replacement-object and real-entrypoint
refusal probes. The original default run correctly refused the missing pin; explicit development
mode passed separately. Source-identity verification alone does not close the full normative
matrix, production profile, exact-source migration, or required CI/release gates.

The subsequent source-owner review corrected reference time/authority reads before the SQLite
writer lock and strengthened exact success-envelope checks in the shared scenario. Core
verification now passes `153/153` tests; the 154-test active backend suite and strengthened real
Express/PostgreSQL development trace were rerun successfully. CLOUD-023 records the exact
source fingerprint and the remaining shared-matrix limits. The user has now approved a
documentation-only selection/accepted-contract commit followed by the reviewed Core source,
then a real pin and rerun, without a new branch or push. TASK-033's filename was corrected
from `v0.2` to `v0-2` with identical content and an updated index. The original naming failure
is historical; the final exact index must pass governance checks before local closure.
No source pin is fabricated from a concurrent Game-only parent commit.

CLOUD-023 now records documentation commit `abcbbaa6df8168e8d62f6cb95aca700968759df9`
and source commit `58d8d71b2508084cf749e3d618d5ce5ae3feec51`. At the source commit,
the Core loopback/SQLite and real Express/PostgreSQL minimum standing traces each passed 1/1;
the latter reported verified Core source identity but explicitly unverified release conformance.
Final evidence-only HEAD/pin readback lives in the Receiver record. Its implementation and
migration remain uncommitted; this result clears the missing-Core-source gate, not TASK-028.

Public Consent/inspect/revoke remain a separate decision boundary. The
[control-plane proposal](../../saas-boilerplate/backend/src/modules/standing/CONTROL-PLANE-PROPOSAL.md)
is non-authoritative under TASK-027/TASK-033; it does not add routes or decide lifetime policy.

## 4.3 Receiver local source and migration closure

Receiver commit `9156e68fe9b988f2ec7423d1c93930da3a105d4e` on `Re-Entry` contains
the reviewed 28-path standing increment. Review corrected absolute-form HTTP
targets bypassing the standing route/no-store boundary and replaced an overstated
migration-preservation test claim with a separate exact-commit upgrade rehearsal.
The accepted protocol, migration SQL, dependency lock, and Core pin are unchanged.

Node 24 passed 21 backend suites / 156 tests, root type-check/build, Prisma
validation, 16 source-pin tests, five upgrade-guard tests, and the real pinned
standing trace after the Receiver commit. A new disposable PostgreSQL 16.14
instance applied the six baseline migrations, received the v0.1 fixture, then
applied the seventh standing migration. All seven checksums matched; 13 old
tables and 10 rows matched before/after before any post-upgrade seeding, and all
six constraint probes passed. CLOUD-023 and the Receiver record own exact
identities, command details, and residuals.

This closes the bounded local source/upgrade proof, not TASK-028. Full shared
negative/race/forced-rollback/fresh-process recovery coverage, tested application
rollback, deployed-role access, and mandatory CI/release enforcement remain open.
`release_conformance_verified` remains false. The separate public-control proposal
also records that internal inspection currently uses separate Grant/Delivery reads;
its public snapshot semantics must be decided and tested before product exposure.

## 4.4 Post-writeback exact-pin refresh

After parent evidence commits changed three files inside the selected Core/spec
inventory, the old fixed pin correctly failed before database access with
`conformance_source_commit_mismatch`. The reviewed pin now selects Core commit
`84f5082c5701c7a2bb4d233b511134898434a249` in Receiver commit `1368741`.

The refreshed local checks pass: source-pin fixtures `16/16`, migration guards
`5/5`, the pinned real Express/PostgreSQL standing trace `1/1` at Receiver
commit `7faf527aca7710a26ee03c2c4beec0e2c7edf8c0`, and the full backend
aggregate `21/21` suites / `158` tests with no skips or failures. The trace's
selected Core/spec source SHA-256 is
`6c7688a074c3d99bca6cba1945b79200db4b8f4b0455edef55f2f3659095cb65` on Node
`v26.5.0`.

This supersedes the earlier pin-only identity snapshot while preserving its
historical evidence. It does not close the mandatory shared failure/race,
forced-rollback, fresh-process recovery, release-enforcement, public-control,
lifetime, or production gates; `release_conformance_verified` remains false.

## 5. Verification and closure

ADR-0044 moves this decision task to `verification_pending`; it does not prove implementation
equivalence. Close only after:

- the shared corpus is consumed from one exact pinned Core/conformance identity rather than copied;
- frozen v0.1 and standing-v0.2 normative traces pass through real transport and durable stores for
  every retained implementation;
- active v2 separately passes its three-attempt, lease-reclaim, and `retry_exhausted` production
  profile;
- concurrent sequence, Event/revocation, replay, time, rollback, restart, error, and no-mutation
  vectors pass, including alternate same-origin keys and same-ID public-key-material rebinding;
- the exact-source additive PostgreSQL migration preserves v0.1 and mechanically enforces one open
  standing activation; and
- merge, package, migration-promotion, and deployment checks prevent one-sided contract drift.

TASK-033 owns the cross-layer v0.2 adoption. Its first two-signal success is necessary but is not by
itself TASK-028 closure.

## 6. Reopen condition

Reopen if another Receiver implementation appears, direct composition becomes transactionally
viable, the package/conformance boundary changes, a production profile becomes normative, or a
shared vector passes while state, time, replay, revocation, or error semantics still differ.
