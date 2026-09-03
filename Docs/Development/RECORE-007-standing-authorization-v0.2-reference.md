# RECORE-007 — Standing Authorization v0.2 Reference Slice

**Role:** DEVELOPMENT implementation and verification record  
**Status:** `locally_verified` for the additive application-neutral cross-layer reference slice  
**Date:** 2026-09-03  
**Controls:** ADR-0043 through ADR-0045, TASK-028, and TASK-033

## Objective and closure level

Prove that standing authorization is implementable without weakening or silently reinterpreting the
frozen protocol-v0.1 path. The bounded proof requires one verified Consent decision, two sequential
effect-acknowledged signals under one standing Grant, retryable one-active backpressure, durable
restart, exact replay, and revocation rejecting a third signal.

This increment is `locally_verified` through the low-level standing Host SDK, loopback HTTP Receiver,
Core Connector client, Agent Adapter, SQLite restart, and runtime Codex-result version seam. It is
not the active Cloud Receiver v2, normal Host facade, registry/default Connector v0.2 path,
Sleepless Kingdom, external Agent, Browser/WebMCP, deployment, or production evidence.

## Implemented surface

- `reentry-core/src/standing-protocol.mjs` adds a strict additive protocol `0.2` Manifest, Event,
  binding, receipt, and acceptance surface. Standing mode is explicit; a large v0.1 `max_runs` is not
  an alias.
- `reentry-core/src/standing-authorization-core.mjs` adds the reference Consent, standing Grant,
  ordered signal, one-active reservation, short lease, effect-backed acknowledgement, inspection,
  replay, and revocation state machine. Host-visible approval returns only the public binding;
  private receipt authority remains in the Delivery path.
- `reentry-core/src/sqlite-receiver-schema.mjs` advances the current reference schema to version 6.
  It retains separate `receiver_standing_*` tables and persists the exact Host key ID and SHA-256
  SPKI public-key fingerprint consented for each standing Grant without changing v0.1 tables or
  uniqueness constraints.
- `reentry-core/src/sqlite-receiver-store.mjs` adds the durable standing-state operations, creates the
  current standing schema when migrating versions 1 through 3, and additively migrates versions 4
  and 5. Missing key-material evidence security-disables legacy standing Grants without deleting
  their challenge, Event, Delivery, or audit records; the migration policy is detailed below.
- `reentry-core/src/standing-host-sdk.mjs` signs standing Manifests and caller-outbox-owned Events.
  Event ID, sequence, occurrence time, and workflow snapshot remain explicit durable Host inputs;
  the SDK has no hidden process-memory sequence counter.
- `reentry-core/src/cloud-receiver-http.mjs` and `receiver-http-contract.mjs` add exact `/v0.2`
  Event, claim, and acknowledgement routes. Every v0.2 failure carries a bounded explicit
  `retryable` boolean while frozen v0.1 error bodies remain unchanged.
- `reentry-core/src/local-connector-client.mjs` and `agent-adapter.mjs` select one exact protocol
  profile, validate standing receipts and positive sequences, reject downgrade, and preserve v0.2
  activation identity without exposing standing authority to the Agent.
- `reentry-core/conformance/standing-v0.2/scenario.mjs` owns the implementation-neutral expected
  two-signal trace, exact public approval shape, same-origin wrong-Host-key rejection, and same-ID
  key-material rebinding rejection.
  `reentry-core/test/standing-cross-layer.test.mjs` runs it through the standing
  Host SDK, real loopback HTTP, file-backed SQLite, Connector client, deterministic Agent Adapter,
  effect authority, restart, inspection, and revocation.
- `runtime/local-connector/src/codex-exec-adapter.mjs` now echoes the validated activation protocol
  version in its bounded result; it still starts one fresh session and never acknowledges a Host
  effect by itself.
- The managed-context, Codex queue, reference Host, and application-demo adapters retain explicit
  v0.1 gates before any binding lookup or runtime side effect. Generic dual-version validation does
  not implicitly make those concrete consumers standing-capable. An explicit `null` Connector
  protocol is rejected; only an omitted or `undefined` selection gets the v0.1 compatibility default.
- `reentry-core/test/standing-authorization.test.mjs` drives the complete bounded proof against a
  file-backed SQLite store, closes and reopens it, confirms that both signals use one approved
  Consent decision, fences duplicate decision attestations whose target or identity changes, rejects
  Events at the Grant-expiry boundary, rejects approval timestamps at or after offer expiry, and
  maps malformed or inconsistent private Delivery state to
  one Receiver invariant.
- The package exports the new modules explicitly while retaining every v0.1 export.

## Proven state sequence

```text
one standing Manifest + one Consent approval
-> standing Grant, last_event_sequence = 0
-> signal 1 accepted over /v0.2 + exact replay
-> signal 2 rejected over /v0.2 as retryable activation_in_progress, sequence not consumed
-> Connector claim + Agent dispatch + effect acknowledgement for Delivery 1
-> signal 2 accepted without another Consent
-> Connector claim + Agent dispatch + effect acknowledgement for Delivery 2
-> HTTP Receiver and SQLite close/reopen
-> last_event_sequence = 2, active_activations = 0
-> standing Grant revoked
-> signal 3 rejected with retryable = false, no Event persisted
-> exact replay of signal 1 returns prior acceptance without new work
```

The Event, sequence advance, activation reservation, and pending Delivery are committed in one
SQLite transaction. A partial unique index permits at most one `pending` or `leased` standing
Delivery per Grant.

## Local preview migration safety

Schemas 4 and 5 did not preserve the consented public-key material. A stored `key_id` alone cannot
prove that a current trust-directory value is the same key the user consented to. Schema 6 therefore
preserves every legacy row, records `__legacy_unpinned__` in the missing fingerprint column, and
sets `revoked_at = created_at` only for previously non-revoked standing Grants. For these explicitly
marked legacy rows that value is a deterministic security-invalidation cutoff, not the historical
time of a user revocation; existing revocation timestamps are preserved. New Events fail with
`grant_reconsent_required`, while new Consent creates a correctly pinned Grant.
Legacy ingress replays also fail closed because their original key material cannot be established;
their historical Event and acknowledgement rows remain intact. Normal exact replay after revocation
of a schema-6 pinned Grant retains the proven behavior above.

New-insert guards reject omitted, sentinel, malformed key IDs or fingerprints, and update guards
prevent either pinned field from being silently replaced. Fresh and migrated schemas must enforce
the same guards even where historical SQLite column-default metadata differs. This migration is
reference-preview compatibility only; it does not migrate active PostgreSQL or upgrade v0.1
authority. Once created under schema 6, an unchanged standing Grant survives ordinary restarts.

## Verification

The exact closure command used the repository's required Node 24 runtime:

```sh
PATH="/opt/homebrew/opt/node@24/bin:$PATH" /opt/homebrew/opt/node@24/bin/node \
  /opt/homebrew/opt/node@24/lib/node_modules/npm/bin/npm-cli.js run verify
```

Observed result:

- Node `v24.20.0`;
- syntax check passed across 48 modules;
- aggregate tests passed `112/112`, including the durable standing proof, low-level Host SDK, exact
  dual-version HTTP routing, retryable error transport, two v0.2 Connector/Adapter cycles, the
  reusable cross-layer scenario, v4/v5-to-v6 security migration, public/private approval
  separation, key-ID and key-material fencing, Consent/Event-expiry ordering, private-state integrity,
  revocation/effect convergence, and every
  existing v0.1 protocol, Receiver, SQLite, delivery, fault, HTTP, Connector, adapter, and
  conformance test;
- the unchanged domain-neutral conformance profile passed as protocol `0.1`;
- package verification passed with zero runtime dependencies and 19 selected package files;
- the Node 24 `runtime/local-connector` verification passed syntax plus `49` executed tests, with
  `12` external active-v2 contract tests explicitly skipped because their disposable PostgreSQL and
  exact external source were not supplied;
- the Node 24 `runtime/reference-system` and `runtime/application-demo` verifications each passed
  syntax plus `2/2` tests;
- repository-validator unit tests passed `6/6`, sensitive-scanner unit tests passed `3/3`, and
  `validate_repository.py --root .` passed;
- task-scope tracked and untracked scanning reported zero sensitive-pattern findings; and
- `git diff --check` passed.

The required full `scan_sensitive_patterns.py --root .` command did not pass: it reported 21
`OPENAI_KEY` pattern matches in seven existing, unchanged Game evidence/Task/validation files.
Read-only classification confirmed every match was a `.sqlite` or `.png` artifact basename, not a
credential. The Game files and scanner were not changed or suppressed. This remains a repository
scanner false-positive closure issue, separate from the passing reference-code checks; no clean
whole-repository scan or commit/push gate is claimed.

Node 24 is the closure authority. Earlier Node 26 evidence predates this cross-layer increment and is
not reused as its aggregate result.

## Explicit non-claims and remaining gates

- The local scenario crosses real HTTP for Event, claim, and acknowledgement, but invokes the
  reference Core's injected Consent and same-subject control authorities directly because the
  protocol kernel does not standardize those shell routes. It is not TASK-028 black-box equivalence;
  each retained Receiver still needs a pinned adapter through its real shell and durable store.
- The active external Cloud Receiver v2 still has one-run relational constraints and does not import
  this reference module. ADR-0044 permits that independent implementation only behind pinned
  black-box conformance; TASK-028 and TASK-033 own its PostgreSQL migration and release gate.
- The low-level standing Host signer exists, but the normal `request -> confirm -> trigger` facade,
  browser handoff, selected-Host outbox, and account inspection/revocation path remain one-shot or
  unimplemented.
- The Core Connector client and current-checkout Codex result seam accept v0.2, but pairing and saved
  credentials do not negotiate it, the CLI default remains v0.1, and the published Connector is not
  an exact-source compatible standing release.
- The reference standing lease has one bounded claim attempt. Full reclaim, attempt exhaustion,
  terminal release, process-fault, and rate/quota evidence remain required before product adoption.
- TASK-027 still owns effective expiry, renewal, and visible lifetime policy.
- TASK-029 still owns a real product Host-effect authority and default acknowledgement composition.
- Sleepless Kingdom still needs a Game-owned ADR and implementation that maps high-frequency domain
  events to one coalesced Agent signal, current canonical-page truth, and selected command boundary.
- Revocation blocks future Event acceptance and claims but cannot retract an activation already
  delivered to an external Agent.
- No commit, push, package publication, external Receiver write, deployment, or production migration
  is claimed by this local record.

## Remediation and next gate

If protocol review rejects the field names or state split, prepare a separately reviewed scoped
reversal of the additive v0.2 code. Preserve persisted standing state and unrelated work; dropping
tables or deleting artifacts is not an authorized rollback shortcut. The unchanged v0.1 tables and
behavior remain the compatibility boundary.

The next cross-implementation gate is an exact-source active-v2 PostgreSQL migration and adapter that
runs the pinned standing scenario through its real Express routes while retaining all v0.1 and
active lease-profile regressions. The verified implementation base is active Receiver main at
`6b4826f68bb3634d004c49259d9c5311c660d997`; its `0d7bc3c` candidate is an ancestor and the backend
is unchanged between them. Product integration then needs the normal Host facade, explicit
Connector capability selection, same-user inspection/revocation, and real effect authority.
Sleepless Kingdom adaptation proceeds only after its signal coalescing, durable sequence/outbox, and
command boundary are reconciled with ADR-0043 and ADR-0045.

Later active-Receiver kernel and source-preflight evidence is recorded in
[`CLOUD-023`](CLOUD-023-standing-receiver-source-gate.md). The non-claims above describe this
reference increment; they do not supersede that later bounded active-Receiver record or close its
remaining public-control and release gates.
