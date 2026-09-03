# Re-entry Core

**Status:** frozen v0.1 kernel plus additive standing-v0.2 protocol, Host signer, Receiver/SQLite,
HTTP, Connector, and Agent Adapter reference chain locally verified; active Receiver working-tree
kernel separately locally verified under CLOUD-023, while public controls, pinned release, and
product adoption remain open  
**Authority:** ADR-0006 through ADR-0014, ADR-0043 through ADR-0045, and
`Docs/Development/RECORE-001-foundation.md` through
`Docs/Development/RECORE-007-standing-authorization-v0.2-reference.md`

This directory is the authoritative source for new application-neutral Re-entry Core behavior.
MVP1 and MVP2 remain unchanged references.

## Current surface

- `src/protocol.mjs` — strict bounded Manifest, event envelope, public binding, private receipt,
  canonical JSON, Ed25519 signing, and typed errors.
- `src/host-sdk.mjs` — narrow Host-side Manifest and event issuance without Receiver or Agent
  authority.
- `src/standing-protocol.mjs` and `src/standing-host-sdk.mjs` — additive v0.2 standing values and a
  server-side signer that requires caller-persisted Event identity, sequence, occurrence time, and
  workflow state.
- `src/receiver-core.mjs` — Receiver-owned consent challenge, private Grant, public binding,
  authenticated same-subject inspection and atomic revocation, exact event replay, atomic
  pending-delivery reservation, and a narrow delivery facade behind injected authority ports.
- `src/standing-authorization-core.mjs` — non-consumable standing Grant, contiguous signal,
  one-active backpressure, repeatable Delivery, inspection, effect acknowledgement, and revocation
  reference state machine.
- `src/receiver-delivery.mjs` — internal target-scoped claim, short lease, bounded-attempt,
  stale-worker fencing, and Host-effect-backed acknowledgement state machine.
- `src/receiver-support.mjs` — shared strict Receiver validation, immutable-value, and typed-error
  helpers.
- `src/sqlite-receiver-store.mjs` — optional Node SQLite reference store with explicit
  transactions, additive schema migration, WAL and full synchronous durability for file-backed
  state, and no fallback.
- `src/sqlite-receiver-schema.mjs` — internal versioned schema and delivery projection.
- `src/cloud-receiver-http.mjs` — separate strict v0.1 and `/v0.2` Host-event, delivery-claim, and
  effect-acknowledgement HTTP mappings; standing failures preserve an explicit bounded retryability
  disposition.
- `src/local-connector-client.mjs` — outbound-only no-retry Connector client with explicit
  fail-closed v0.1/v0.2 profile selection, secure-origin, timeout, response-size, redirect, and
  exact-response validation.
- `src/agent-adapter.mjs` — credential-free lease-to-activation derivation and one-call bounded
  dispatch for exact v0.1 or v0.2 leases, with explicit accepted, unsupported, rejected, or unknown
  outcomes.
- `src/managed-context-adapter.mjs` — private Grant-to-context resolution through one configured
  adapter authority and one selected driver, with no raw context locator in typed activation or
  result surfaces.
- `src/receiver-http-contract.mjs` — internal route, field, and transport-limit constants.
- `conformance/` — source-repository-only frozen v0.1 process profile plus the reusable v0.2
  standing expected-state scenario; excluded from runtime exports and package files.
- `bench/` — bounded protocol, durable Receiver, Agent Adapter, and source-profile local regression
  entrypoints; excluded from runtime exports and package files.
- `test/` — positive, negative, tamper, boundary, privacy, rollback, restart, and independent-
  process tests; fault wrappers remain test-only.
- `protocol/test-vectors/` — frozen interoperability inputs and outputs.

## Commands

```bash
npm run verify
npm test
npm run test:conformance
npm run benchmark:protocol
npm run benchmark:agent-adapter
npm run benchmark:receiver
npm run benchmark:profile
node --test test/receiver-core.test.mjs test/sqlite-receiver-store.test.mjs
node --test test/separate-process.test.mjs
```

From a source checkout, run the non-production conformance profile with:

```bash
node conformance/run.mjs
```

The package has zero runtime dependencies and targets Node 24 or newer.
`npm run verify` is the source-checkout closure command: it checks JavaScript syntax, runs the full
test suite, executes the direct conformance profile, and inspects the dry-run package surface.
The repository `.node-version` selects the reproducible Node 24 closure runtime; runs on newer local
runtimes are additional compatibility evidence and must name the executed version.
`SqliteReceiverStore` is available only through the `./sqlite-receiver-store` subpath, so the
root, protocol, Host SDK, and Receiver Core imports do not load `node:sqlite` implicitly.

Local verification covers strict shapes, canonical encoding, Ed25519 signing and verification,
trusted-origin anchoring, tamper and boundary rejection, frozen vectors, Host SDK isolation,
trusted consent integration, private-output boundaries, atomic run reservation, exact replay,
authenticated Grant inspection, revocation-before-event and event-before-revocation ordering,
idempotent revocation replay, target and subject isolation, replayable lease claims, bounded
reclamation, stale-worker fencing, pre-revocation effect convergence, post-revocation effect
rejection, transaction rollback, token non-persistence, version-1 migration, and file
close-and-reopen persistence. Focused transport tests also cover ordinary JSON request mapping,
no-work responses, bounds, redacted failures, origin policy, redirects, timeouts, malformed or
stale responses, and absence of automatic retry. The source-repository conformance profile runs
Host, Receiver, and Connector children independently, exercises one deterministic Agent dispatch,
rejects acknowledgement before a separate synthetic Host effect, emits one redacted result, and
cleans its exact temporary files. The forced-restart test reuses those role implementations and
adds test-only response-loss injection. Both remain local evidence only.
The additive standing slice also covers one Consent, two sequential signals, exact v0.2 routes,
explicit retryable backpressure, two claim/dispatch/effect/acknowledgement cycles, HTTP/SQLite
restart, inspection, revocation, rejected third signal, historical replay, wrong-version rejection,
private-receipt separation, consented Host-key fencing, Event/Grant expiry ordering, private-state
integrity checks, schema-v6 key-material pinning and fail-closed legacy migration, and unchanged
v0.1 behavior. It is local reference
evidence, not active Cloud Receiver conformance.
The source-owner review adds 20 deterministic transaction-boundary cases: time,
live authority, and authoritative rows are resolved after the SQLite writer lock,
so a wait cannot admit expired authority or backdate a revocation. The test hook
runs inside a real SQLite transaction; it does not simulate operating-system lock
contention or a cross-database atomic transaction. Injected authority callbacks
must remain synchronous, bounded, and non-reentrant while the writer lock is held.
The shared standing scenario also checks exact public approval, Event acceptance,
and acknowledgement envelopes and their correlation; 21 oracle self-tests cover
malformed responses and positive controls. Those self-tests are not independent
Receiver conformance. The standing shared matrix still lacks complete concurrent
race, forced multi-row rollback, and fresh-process crash coverage. Historical
SQLite migration fixtures derived from current DDL are not frozen historical
schema evidence.
Deterministic Agent Adapter tests cover credential omission, expiry and correlation rejection,
all bounded outcomes and unavailable capabilities, one-call behavior, timeout, exception,
malformed result, immutability, and the no-effect/no-acknowledgement boundary.
Managed-context adapter tests cover private `grant_id` lookup, exact adapter scoping, active,
missing, expired, lease-shorter, late-resolution, mismatched, malformed, accessor, exception,
timeout, and raw-reference non-disclosure behavior. The deterministic authority and driver do not
prove capture, persistence, or real context activation.

The Receiver benchmark uses file-backed SQLite with WAL and full synchronous durability. The
profile benchmark cold-spawns the unchanged source conformance runner. Both emit bounded JSON and,
like the protocol and Agent Adapter measurements, are local regression baselines rather than
throughput promises, production latency, cross-machine comparisons, or service SLAs.

## Current non-claims

This kernel does not implement a production consent, Grant-control, or pairing session; a consent
or administration UI; a Grant-control HTTP route; a TLS listener or public Cloud Receiver service;
a production Connector daemon; durable Connector credential or claim-token storage; a real Host-
effect verifier; Agent activation; Browser acquisition; WebMCP runtime access; deployment; or a
selected Host application. Test child processes are evidence scaffolding, not shipping services.
The conformance profile uses synthetic authorities and is not a production service shell. The
deterministic adapter is contract evidence, not a runtime fallback or a real Agent. The standing Host
signer is not a durable outbox or normal browser facade, and the v0.2 Connector profile is not a
pairing negotiation or published default. Unsupported capability is not replaced by a hidden
fallback.
