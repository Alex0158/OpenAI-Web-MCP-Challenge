# RECORE-001: Re-entry Core Foundation

**Role:** ACTIVE IMPLEMENTATION RECORD  
**Risk profile:** Assured — cross-process authority, consent, identity, durability, and Agent execution boundaries  
**Status:** `in_progress`  
**Opened:** 2026-08-31  
**Branch:** `codex/re-entry-core-foundation`  
**Baseline:** `25634e08536d699f0e107ef0d58afa5fdad2b157`

## Objective

Create the authoritative, application-neutral Re-entry Core source and documentation baseline,
then prove its first protocol and module-boundary kernel without changing the frozen MVP1 or
MVP2 references.

Target closure for this task is `locally_verified`. It does not include a deployed Cloud
Receiver, a working Codex wake path, a selected web app, or a judge-reproducible end-to-end run.

## Owning decisions and sources

- `REENTRY-CORE-PROGRAM.md` owns the standing program outcome, execution boundaries,
  anti-bloat rules, and Definition of Done.
- ADR-0002 separates the mechanism from the final application.
- ADR-0004 separates the event protocol from Agent runtime transport.
- ADR-0006 establishes Re-entry Core, its source root, and target process topology.
- ADR-0007 freezes the v0.1 protocol, cryptographic, binding, receipt, and module-port kernel.
- ADR-0008 freezes the Receiver-owned consent, Grant, replay, durable reservation, pending
  delivery, and reference-store boundary.
- ADR-0009 freezes trusted Connector identity, replayable target-scoped delivery leases, bounded
  retry, stale-worker fencing, and Host-effect-backed acknowledgement.
- ADR-0010 freezes the minimal Receiver HTTP mapping, outbound Connector client, transport
  bounds, and separate-process evidence boundary.
- Core/01 through Core/05 own the durable behavior, architecture, trust, and evidence contracts.
- MVP1 is the authority, durability, delivery, and evidence reference.
- MVP2 supplies selectively reusable modular seams and product-composition patterns only.

## Challenge

### Hypothesis

A single lightweight Node package with narrow exports and independent service entrypoints can
preserve MVP1-grade authority while allowing Host, Cloud Receiver, Local Connector, and Agent
adapter processes to evolve independently.

### Falsifiers

- A core contract requires domain-specific workflow logic or Site Tool names.
- Cloud Receiver and Local Connector must share raw Agent credentials or one mutable store.
- Event acceptance necessarily invokes an Agent synchronously.
- A module boundary exists only through naming and cannot be exercised in separate processes.
- Required durability cannot be implemented or tested without importing the MVP fixture server.
- The package or documentation duplicates an existing owning Core surface.

### Alternatives considered

1. **Continue MVP1:** rejected because its fixture, Host, Receiver, and local adapter composition
   would become the production source by accident.
2. **Promote MVP2 wholesale:** rejected because its authority, consent, persistence, delivery,
   prompt, and evidence contracts are weaker or incompatible.
3. **Create a multi-package microservice workspace immediately:** deferred because it adds build,
   dependency, and release overhead before module boundaries have a real second consumer.
4. **Create one modular package with independent entrypoints:** selected as the smallest path
   that can still prove real process separation later.

## Affected surfaces

- Re-entry Core identity and source ownership;
- Core architecture and current-status documentation;
- protocol, Host SDK, Receiver, Connector, and adapter module boundaries;
- local deterministic tests, conformance, and future performance evidence;
- development and closure workflow.

## Explicitly unaffected

- `mvp/` source, tests, runbooks, and evidence;
- MVP2 contributor branch source and attribution;
- final app selection and the three candidate recommendations;
- production credentials, hosting, live users, deployment, and submission;
- existing failed or inconclusive Agent/Browser join evidence.

## Ordered increments

### A. Authority and architecture baseline

- accept ADR-0006;
- establish this development index and record;
- reconcile Core current truth and system design;
- freeze reference-code mutation and unsupported claims.

### B. Protocol and module-boundary kernel

- create `reentry-core/` as one zero-runtime-dependency Node 24 ESM package;
- implement canonical serialization, strict bounded protocol validation, typed errors, and
  signature boundaries;
- expose narrow Host SDK, Receiver Core, Local Connector, and Agent Adapter contracts;
- add frozen vectors and module-boundary conformance tests.

### C. Receiver authority and durable store

- implement Receiver-owned enrollment, per-Grant private binding, activation fencing, event
  reservation, delivery ledger, lease, acknowledgement, and replay-safe effect convergence;
- use an explicit persistence port and one lightweight reference store;
- preserve crash and acknowledgement-loss tests before adding network services.

### D. Separate Cloud Receiver and Local Connector

- implement independent service entrypoints, stores, credentials, and failure handling;
- use outbound Connector retrieval and short-lived delivery leases;
- prove that Connector failure cannot widen authority or lose accepted work silently.

### E. Agent-adapter and Host integration gates

- retain a deterministic adapter for contract verification;
- add no private Codex adapter until a route-specific test proves the required capability;
- add the selected app only through a Host Adapter after an accepted app-selection ADR.

### F. Full verification and evidence reconciliation

- run focused, aggregate, separate-process, crash, replay, and performance verification;
- capture bounded redacted evidence;
- reconcile Core status, claim limits, active issues, and exact Git state.

## First-increment acceptance

- ADR-0006 is internally consistent with ADR-0002 and explicitly updates ADR-0004 topology.
- Core current status and system design identify Re-entry Core as the active development target.
- Development authority, closure labels, and RECORE-001 scope are explicit.
- No `mvp/`, MVP2, scenario, candidate-review, reference, evidence, or private runtime file changes.
- Markdown links and `git diff --check` pass for the owned change.

## Open risks that do not block Increment A or B

| Risk | Current state | Impact | Reopen condition |
|---|---|---|---|
| Connector-to-Codex-to-Browser/WebMCP join | Unproven; prior standalone joins failed | Prevents real local Agent activation | A materially different supported adapter is available for a bounded T1 test |
| Connector pairing and credential custody | Unspecified | Blocks trustworthy cross-device delivery | Before Cloud Receiver and Connector integration |
| Hosted persistence and multi-replica behavior | Unselected | May constrain deployment store | When the selected host and deployment target are known |
| Exact-thread value over a bounded capsule | Unproven | May change adapter context strategy | Selected-app value test with runtime evidence |
| Final app requirements | Unselected | Determines Host adapter and operating profile | Accepted app-selection ADR |

## Non-goals

- general multi-tenant issuer onboarding;
- broad event taxonomies;
- multiple Agent platforms;
- automatic fallback chains;
- installer, auto-update, fleet administration, or cross-platform packaging;
- production deployment or migration;
- final UI, brand, business model, or submission copy.

## Verification record

### Increment A — authority and architecture baseline

**Closure:** `locally_verified` on 2026-08-31.

- `git diff --check` passed.
- A local relative-link audit passed 128 of 128 links across the 13 owned or reconciled
  documents in this increment.
- The English-only scan found no Han characters in the owned Re-entry Core documents.
- `git diff --numstat -- mvp` returned no MVP1 source or evidence change.
- No `References/` file changed.
- Existing candidate-review and scenario working-tree files remain present and unmodified by
  this increment; they are not part of Increment A closure.

This proves the decision, authority routing, scope, and current-truth reconciliation exist and
are internally linked. It does not prove any Re-entry Core code, Cloud Receiver, Local
Connector, process separation, Agent activation, Browser, WebMCP runtime, deployment, or
performance behavior.

**Next entry condition:** begin Increment B with the zero-runtime-dependency Node 24 package,
strict protocol kernel, narrow module exports, frozen vectors, and conformance tests.

### Increment B1 — v0.1 contract freeze

**Closure:** `specified` on 2026-08-31.

- ADR-0007 fixes the first Manifest, public binding, detached event envelope, private receipt,
  cryptographic boundary, strict limits, process ports, and rejected extension fields.
- A local capability probe on the current Node `v26.5.0` runtime generated an Ed25519 key pair,
  produced a 64-byte signature, verified the original payload, and rejected a modified payload.
  This is not yet a Node 24 compatibility or cross-language conformance claim.
- `git diff --check` passed.
- A staged relative-link audit passed 105 of 105 links across the nine reconciled documents.
- The English-only scan found no Han characters in the staged documents.
- No `mvp/`, `References/`, scenario, candidate-review, or runtime-evidence file is part of this
  increment.

This proves a reviewable contract decision and current-truth reconciliation only. It does not
prove protocol code, frozen vectors, Host SDK behavior, Receiver authority, process separation,
durability, performance, Agent activation, Browser access, or WebMCP runtime behavior.

**Next entry condition:** implement the zero-runtime-dependency protocol and Host SDK kernel,
then verify strict positive, negative, boundary, tamper, and frozen-vector behavior.

### Increment B2 — protocol and Host SDK kernel

**Closure:** `locally_verified` on 2026-08-31.

- `reentry-core/` now contains one Node 24 ESM package with no runtime dependency, a narrow
  protocol export, a Host SDK export, and one frozen public-key interoperability vector.
- The protocol enforces exact shapes, bounded canonical JSON, Ed25519 Manifest and detached
  event authentication, trusted expected-origin anchors, public-binding and private-receipt
  separation, typed validation and authentication errors, and explicit rejection of prompt-like
  or duplicate-authority fields.
- The Host SDK can issue only a signed Manifest or signed event envelope from Host-owned
  workflow state. It derives event scope from a live Receiver-issued public binding and has no
  Grant, consent, Receiver-store, Connector, Agent, or fallback authority.
- `npm test` passed 14 of 14 tests on the current Node `v26.5.0` runtime.
- `npm run test:conformance` passed 10 of 10 protocol tests.
- The same 14-test aggregate suite passed on an actual Node `v24.20.0` runtime.
- Informational coverage was 90.31% lines, 77.02% branches, and 96.67% functions. This is not a
  completeness or security claim.
- The reproducible `benchmark:protocol` entrypoint ran 5,000 iterations per operation on Node
  `v24.20.0`. For the 827-byte Manifest and 384-byte event body it observed 28,842 Manifest
  signs/s, 20,651 Manifest verifications/s, 51,870 event signs/s, and 25,094 event
  verifications/s. This is one single-process local regression baseline, not an SLA, hosted
  service result, or competitive performance claim.
- OpenSSL `3.6.3` independently verified both Ed25519 signatures in the frozen vector from the
  public key and Node-produced canonical bytes. This is local cross-tool cryptographic evidence;
  it does not prove independent canonicalization or cross-language interoperability.
- `npm ls --omit=dev --all` reported an empty dependency tree. `npm pack --dry-run --json`
  selected six runtime and vector files: 9,665 bytes compressed and 42,471 bytes unpacked.
  Tests remain in the repository but are excluded from the deployable package allowlist.
- `git diff --cached --check` passed. A relative-link audit resolved 42 of 42 links across the
  six owned documentation surfaces. English-only, private-PEM, forbidden-runtime-surface, and
  exact staged-scope scans passed; no MVP, reference, research, scenario, or evidence file is
  part of Increment B2.

This proves the v0.1 protocol and Host SDK kernel locally and in process. It does not prove
Receiver consent, Grant durability, reservation, replay convergence, leases, Cloud Receiver or
Local Connector process behavior, Agent activation, Browser access, genuine WebMCP runtime
delivery, deployment, performance under service load, or a selected application.

**Next entry condition:** specify and implement the smallest Receiver-owned Grant, durable
reservation, private receipt, and delivery-ledger authority boundary without adding an HTTP
service or Agent adapter.

### Increment C1a — Receiver authority contract

**Closure:** `specified` on 2026-08-31.

- ADR-0008 fixes the consent-authority port and explicitly rejects caller approval booleans or
  headers.
- It separates challenge creation, terminal human decision, private Grant, public binding,
  private receipt, authenticated event acceptance, run-budget reservation, and pending delivery.
- It selects a zero-runtime-dependency Node SQLite reference store without claiming hosted or
  multi-replica durability and forbids a JSON or volatile fallback.
- A local Node `v24.20.0` capability probe imported `node:sqlite`, enforced a foreign key setting,
  created a constrained table, inserted and read one row, and closed cleanly.

This is a decision and capability probe only. No Receiver Core, consent session, Grant record,
event reservation, pending delivery, restart behavior, Connector, or Agent behavior is yet
implemented or verified in the new core.

**Next entry condition:** implement ADR-0008 behind a narrow Receiver Core and SQLite store,
then prove consent, privacy, exact replay, rollback, close-and-reopen durability, bounds, and
Node 24 behavior before adding leases or network services.

### Increment C1b — Receiver authority and durable reservation

**Closure:** `locally_verified` on 2026-08-31.

- `ReceiverCore` now creates a Receiver-owned challenge without a Grant, verifies only an opaque
  decision token through the trusted consent-authority port, narrows requested Grant lifetime,
  and creates one private Grant plus the exact public binding after approval. Decline creates no
  Grant. Stable decision replay converges; conflicting or mutated attestations fail closed.
- Event acceptance resolves the opaque binding before signature verification, anchors the
  expected issuer origin in the stored Grant, revalidates exact scope and lifetime, and commits
  the event, one private pending delivery, and the `1 -> 0` run reservation in one transaction.
  It invokes no Connector, Agent, Host-state reader, network call, or fallback.
- `SqliteReceiverStore` uses Node's built-in `node:sqlite`, synchronous `BEGIN IMMEDIATE`
  transactions, foreign keys, schema version 1, and file-backed WAL plus full synchronous
  durability. It rejects unknown or unversioned non-empty databases and permits no JSON or
  volatile fallback. Its write methods are unavailable outside an explicit transaction.
- Exact event replay re-authenticates the envelope and returns the prior public acceptance with
  `duplicate = true`; it creates no new event, delivery, identity, or run reservation. Public
  challenge, binding, and acceptance outputs contain no Grant, subject, delivery target, receipt,
  decision token, or Agent identity.
- The aggregate suite passed 26 of 26 tests on the current Node `v26.5.0` runtime and on an actual
  Node `v24.20.0` runtime. The tests include tamper, scope, expiry, exhaustion, caller-asserted
  approval rejection, hidden-getter rejection, exact and conflicting replay, injected
  pre-commit failure, transaction fencing, WAL/schema fail-closed behavior, and file
  close-and-reopen persistence.
- Informational coverage was 88.72% lines, 73.88% branches, and 93.23% functions. This is not a
  completeness, security, or runtime claim, and no low-value test was added to optimize the
  percentage.
- `npm ls --omit=dev --all --json` reported no dependency tree. `npm pack --dry-run --json`
  selected eight runtime and vector files: 16,898 bytes compressed and 82,830 bytes unpacked.
  The root package exposes Receiver Core without implicitly loading `node:sqlite`; the reference
  store is an explicit subpath.
- `git diff --check` passed. A local relative-link audit resolved 46 of 46 links across the seven
  owned code-facing and canonical documents. The English-only scan found no Han characters in
  code, tests, or owned documentation, and no MVP1 or immutable reference file changed.

This proves ADR-0008 locally through one process and a file close-and-reopen boundary. It does
not prove a production consent session or anti-CSRF control, service HTTP ingress, concurrent
multi-process contention, crash termination at OS boundaries, Connector pairing, leases,
acknowledgement, external delivery, Agent activation, Browser or WebMCP runtime behavior,
deployment, or distributed durability.

**Next entry condition:** freeze the smallest Cloud Receiver-to-Local Connector contract,
including pairing identity, outbound retrieval, lease fencing, and effect-backed acknowledgement,
before adding either process shell or any Agent adapter.

### Increment C2a — Connector lease and acknowledgement contract

**Closure:** `specified` on 2026-08-31.

- ADR-0009 fixes one trusted Connector-identity port and one exact identity attestation mapping
  a Connector to one subject and delivery target; it does not treat a caller-supplied target as
  authority or claim that production pairing exists.
- A Connector-generated 32-byte claim token becomes the lease token. Exact response-loss replay
  can return the same lease, while Receiver persistence keeps only its SHA-256 digest.
- One short target-scoped lease, one active lease per target, compare-and-set fencing, Grant- and
  Connector-identity-bounded expiry, and an explicit maximum attempt count prevent parallel or
  unbounded adapter activation.
- Delivery acknowledgement requires one trusted exact Host-effect attestation with outcome
  `effect_applied_awaiting_human`. Queue acceptance, Connector health, Agent start, adapter
  return, and caller completion strings are non-authoritative observations.
- The SQLite evolution is additive: schema version 2 keeps immutable version-1 delivery facts,
  adds one mutable state row per delivery, and retains a bounded digest-only attempt ledger so
  an expired claim token can never regain authority. Version-1 migration must be atomic and
  fail-closed.
- The decision deliberately excludes production pairing, credential vaults, HTTP, long polling,
  supervised workers, process separation, a real Agent adapter, Browser/WebMCP runtime behavior,
  and app-specific Host-effect verification.

This is a contract decision only. No Connector claim, lease, schema migration, acknowledgement,
separate process, Agent activation, or Host effect is yet implemented or locally verified in the
new core.

**Next entry condition:** implement ADR-0009 in Receiver Core and the SQLite reference store,
then prove identity scope, claim replay, bounded reclamation, stale-worker fencing, late
effect-acknowledgement convergence, rollback, version-1 migration, close-and-reopen behavior,
token non-persistence, and Node 24 compatibility before adding service shells.

### Increment C2b — Connector delivery state machine

**Closure:** `locally_verified` on 2026-08-31.

- `ReceiverCore` now composes an internal delivery state machine behind the trusted Connector-
  identity and Host-effect-authority ports. The public facade accepts only opaque authority
  tokens, a canonical client-generated claim token, and exact delivery identifiers; it accepts no
  caller-supplied subject, target, progress state, policy callback, Agent object, or fallback.
- One transaction returns an exact live claim replay or leases the oldest eligible delivery for
  the attested target. Lease expiry is narrowed by policy, Grant expiry, and Connector identity
  expiry. The per-delivery attempt maximum is snapshotted when the pending delivery is created,
  so later Receiver configuration cannot widen existing activation authority.
- Each claim-token digest is retained in a bounded attempt ledger. Exact response-loss replay
  spends no attempt, an expired or replaced token cannot regain authority, one target cannot hold
  parallel live leases, and an exhausted final lease can converge only through an effect confirmed
  at or after lease issue and strictly before the end of its final authority window.
- Acknowledgement requires one exact trusted Host-effect attestation with outcome
  `effect_applied_awaiting_human`. Connector status strings, queue acceptance, adapter return, and
  Agent narration are outside the input contract. Exact acknowledgement replay returns the prior
  effect; a different lease, delivery, effect identity, or canonical attestation fails closed.
- `SqliteReceiverStore` advances additively to schema version 2. It keeps immutable creation facts,
  one constrained mutable state row, and a digest-only attempt ledger. Version-1 migration runs in
  one `BEGIN IMMEDIATE` transaction and conservatively seeds existing deliveries with a one-attempt
  maximum. Raw Connector, claim, lease, and effect tokens are not stored.
- Runtime code is split by responsibility into the Receiver facade, delivery state machine,
  shared strict validation, SQLite store, and versioned schema. The package still has zero runtime
  dependencies; the delivery state machine and schema remain internal rather than new public
  package surfaces.
- The aggregate suite passed 40 of 40 tests on Node `v24.20.0` and Node `v26.5.0`. It covers
  subject, target, Connector, expiry, and revocation scope; exact replay; bounded reclamation;
  stale-worker fencing; late final-effect convergence; progress-field rejection; effect collision;
  injected post-write rollback; persisted policy bounds; version-1 migration; raw-token absence;
  and file close-and-reopen behavior.
- Informational coverage was 89.98% lines, 73.32% branches, and 94.74% functions. No low-value
  behavior or fallback was added to optimize the percentage.
- `npm run test:conformance` passed 11 of 11 protocol tests. `npm ls --all` reported an empty
  dependency tree. `npm pack --dry-run --json` selected 11 runtime, README, and vector files:
  23,274 bytes compressed and 120,295 bytes unpacked. Root and Receiver imports loaded without
  `node:sqlite`; the explicit store subpath loaded successfully.
- `git diff --cached --check` passed. A relative-link audit resolved 44 of 44 links across the
  seven owned documentation surfaces. English-only, actual private-key-header, and exact staged-
  scope scans passed; no MVP, reference, research, scenario, or runtime-evidence file is part of
  C2b.

This proves ADR-0009 locally through deterministic authority fixtures, one process, SQLite
transactions, migration, and a file close-and-reopen boundary. It does not prove production
pairing, credential custody, HTTP, a separate Cloud Receiver or Local Connector process,
concurrent process ownership, OS-crash recovery, a real Host effect, Agent activation,
Browser/WebMCP re-entry, deployment, or distributed durability.

**Next entry condition:** define and prove the smallest separate Cloud Receiver and outbound Local
Connector process shells around the unchanged Core ports. Keep transport, production identity,
and Agent adapter authority outside Receiver Core, and add no fallback path.

### Increment C3a — Receiver HTTP and Connector transport contract

**Closure:** `specified` on 2026-08-31.

- ADR-0010 fixes three narrow `POST` routes for signed Host-event ingress, Connector claims, and
  effect-backed acknowledgements. Consent, pairing, health, diagnostics, admin, reset, Agent, and
  generic RPC routes remain outside the increment.
- Requests use bounded UTF-8 JSON with exact parsed fields; responses use canonical JSON. The
  contract accepts standard UTF-8 content-type syntax but no query, content encoding, extensions,
  or credentials in URLs. Errors expose only one bounded code; unknown exceptions become a
  redacted internal error.
- The Cloud adapter receives an already composed `ReceiverCore`; it cannot select persistence or
  authority implementations. The Connector client is outbound-only, requires an explicit timeout,
  rejects redirects and insecure non-loopback origins, validates exact responses, and performs no
  automatic retry or token replacement.
- Separate-process evidence must keep Host signing authority, Receiver storage, and Connector
  credentials in independent child processes. Deterministic identity and effect fixtures remain
  test-only and cannot support production claims.
- The package stays zero-dependency and exposes transport only through explicit subpaths. No HTTP
  framework, retry package, broker, ORM, logger, or background loop is authorized.

This is a wire and process-boundary decision only. No HTTP adapter, Connector client, child-
process proof, restart recovery, network timeout, TLS service, pairing, real Host effect, Agent,
Browser, or WebMCP behavior is yet implemented or verified under ADR-0010.

**Next entry condition:** implement the strict HTTP adapter and outbound Connector client, then
prove exact Host event, claim, no-work, acknowledgement, redacted failure, restart replay, and
token non-persistence across independent Host, Receiver, and Connector processes.

### Increment C3b — HTTP adapter and outbound Connector client

**Closure:** `locally_verified` on 2026-08-31.

- `createCloudReceiverHttpHandler` maps only the three ADR-0010 routes to an injected synchronous
  Receiver Core. It accepts bounded UTF-8 JSON with standard content-type syntax, rejects query,
  content encoding, unknown route, wrong method, malformed body, oversized body, and claim or
  acknowledgement extensions before Core invocation, and emits deterministic no-store responses.
- Typed Receiver errors preserve only their bounded status and code. Unknown exceptions become
  `receiver_internal_error`; no exception message, stack, request body, token, delivery payload, or
  storage detail is returned.
- `LocalConnectorClient` accepts HTTPS origins or literal loopback HTTP only, requires an explicit
  100–60,000 millisecond timeout, follows no redirect, performs no automatic retry, and never
  replaces the caller's claim token. It bounds response bytes and rejects invalid content type,
  noncanonical response JSON, stream failure, malformed or extended shapes, stale leases, token
  mismatch, receipt/continuation mismatch, and acknowledgement mismatch.
- The root package export remains transport-free. Cloud HTTP and Connector client are explicit
  subpaths; their shared route contract remains internal. Import probes passed without loading
  `node:sqlite`.
- Seven focused transport tests pass. They include ordinary noncanonical request JSON,
  `202`/`200`/`204` mapping, raw route-alias and other pre-Core rejection, bounded error redaction,
  secure-origin rejection, redirect and timeout failure with one observed request, no-work, exact
  request bodies, noncanonical or BOM-prefixed JSON, oversized responses, stale or wrong-token
  leases, and interrupted response streams.
- The aggregate suite passed 47 of 47 tests on Node `v24.20.0` and Node `v26.5.0`; protocol
  conformance remained 11 of 11. Informational coverage was 89.48% lines, 73.25% branches, and
  95.79% functions.
- `npm ls --omit=dev --all --json` reported no dependencies. `npm pack --dry-run --json` selected
  14 runtime, README, and vector files: 28,508 bytes compressed and 146,580 bytes unpacked.

This verifies the HTTP mapping and client behavior locally through loopback unit integration. It
does not prove an independent Host, Receiver, or Connector process; file-backed network restart;
concurrent process ownership; acknowledgement-response loss; TLS; production pairing; secure
credential storage; real Host effects; a Connector daemon; Agent activation; Browser/WebMCP;
deployment; or a selected app.

**Next entry condition:** build test-only independent Host, Receiver, and Connector process
fixtures around these unchanged public subpaths. Prove signed event ingress, durable acceptance,
Receiver restart, exact claim replay, effect-backed acknowledgement, and token non-persistence
without adding runtime health, admin, test, or fallback routes.

### Increment C3c — independent process and response-loss proof

**Closure:** `locally_verified` on 2026-08-31.

- One test-only harness starts independent Host, Receiver, and Connector child processes through
  bounded IPC used only for readiness, authority setup, inspection, and teardown. It adds no
  runtime health, admin, consent, test, or fallback route.
- The Host child generates and retains its Ed25519 private key, returns only the public key, issues
  the Manifest and event through `ReentryHostSdk`, and sends the signed envelope to the Receiver
  HTTP route. The parent and the other children never receive the private key.
- The Receiver child alone imports `node:sqlite`, opens the file-backed store, composes
  `ReceiverCore` with deterministic test authorities, and binds the HTTP adapter to literal
  loopback. The Host and Connector children and the test parent report no loaded SQLite module.
- The Connector child imports only the outbound client surface. It retains one caller-created
  claim token, reaches the Receiver only through HTTP, and reuses the exact token after restart.
- A signed event returns `202` only after durable acceptance. Receiver close and restart preserves
  exact event replay as duplicate, then a second restart preserves the exact private lease and
  returns the repeated claim as duplicate without spending another attempt.
- An unknown Host-effect token returns the bounded `403 host_effect_invalid`. With the fixed
  test-only attestation installed through IPC, the Receiver commits acknowledgement before the
  fixture deliberately destroys the HTTP response. After another Receiver restart, the Connector
  repeats the exact acknowledgement and receives the same effect as duplicate.
- After every process closes, byte scans of the SQLite database and any exact WAL/SHM sidecars find
  no raw Connector, claim/lease, accepted effect, or rejected effect token.
- The aggregate suite passes 48 of 48 tests on Node `v24.20.0` and Node `v26.5.0`; protocol
  conformance remains 11 of 11. Informational coverage is 89.86% lines, 74.90% branches, and
  97.20% functions.
- Runtime source, exports, dependencies, and the 14-file pack selection are unchanged because every
  process shell is test-only. Pack bytes are remeasured after documentation changes because the
  package includes its README.

This proves the ADR-0010 test-process boundary, graceful file-backed restart, unknown network
outcome convergence after a committed acknowledgement, and token non-persistence. It does not
prove forced or mid-transaction termination, concurrent Receiver ownership, a production process
supervisor, durable Connector credential or claim-token custody, TLS, production consent or
pairing, a real Host-effect verifier, an Agent adapter, Browser/WebMCP re-entry, deployment, or a
selected app.

**Next entry condition:** prove one bounded forced-Receiver-termination recovery path and decide
whether production single-owner enforcement needs a Core-adjacent contract. Do not add a daemon,
supervisor, credential store, or fallback until that evidence identifies a necessary interface.

### Increment C3d — forced Receiver termination

**Closure:** `locally_verified` on 2026-08-31.

- The C3c harness now terminates the Receiver with `SIGTERM` and no fixture cleanup command at
  three authority boundaries: after a committed event returns `202`, after a private lease is
  returned, and after acknowledgement commits while its HTTP response is deliberately destroyed.
- Every child exit reports `signal: SIGTERM`. A new Receiver process opens the same SQLite file and
  preserves exact event replay, the original claim token and lease without another attempt, and
  the final Host effect as a duplicate acknowledgement after the unknown network outcome.
- The focused forced-termination flow passes on Node `v24.20.0` and Node `v26.5.0`, including five
  consecutive current-runtime runs. The aggregate suite remains 48 of 48; no runtime source,
  export, dependency, listener route, or persistence schema changed.
- `npm ls --omit=dev --all --json` remains dependency-free. The packed README now records C3d, so
  the unchanged 14-file selection measures 28,650 bytes compressed and 146,941 bytes unpacked;
  the runtime source bytes themselves did not change in C3c or C3d.

This proves recovery after abrupt process termination at three already committed boundaries. It
does not inject termination inside a SQLite transaction, prove two simultaneous Receiver owners,
or supply a production supervisor. SQLite rollback is already covered through injected
post-write failures in C1/C2, but that is not OS-crash evidence and is not relabelled here.

Production single-owner enforcement is not added to the Core package now. Its correct mechanism
depends on the selected deployment substrate: one service replica, a platform lease, a managed
database transaction model, or a local supervisor have different stale-owner and recovery
semantics. A generic lockfile before that choice would add a second failure protocol without
proving the shipping topology.

**Next entry condition:** keep process ownership explicit and select any production owner or
durable Connector-custody mechanism only through a runtime-specific decision. Until then, continue
with bounded Core quality, evidence reconciliation, and app-independent adapter gates rather than
adding a daemon, lockfile, credential store, or fallback.

### Increment C4a — Agent Adapter activation contract

**Closure:** `specified` on 2026-08-31.

- ADR-0011 fixes one immutable activation derived from a live leased delivery and private
  continuation receipt. The adapter receives no Connector token, lease token, effect token, raw
  managed-context identifier, prompt, goal, tool list, or Host artifact.
- The result has four explicit classes: `accepted`, `unsupported`, `rejected`, and
  `outcome_unknown`. `accepted` means only that the adapter accepted the typed dispatch; it does
  not prove Agent start, Browser access, canonical-page navigation, WebMCP, a Host effect, or a
  human boundary.
- Invocation is bounded, calls one adapter once, and converts timeout, exception, or malformed
  correlation into a visible unknown outcome. It performs no retry, fallback, Host call, effect
  assertion, or delivery acknowledgement.
- A deterministic adapter may prove the contract only. It cannot become a product fallback or
  support a real platform claim.

This is a contract decision only. No Agent Adapter module, deterministic adapter test, private
binding lifecycle, Agent activation, Browser, WebMCP, Host effect, or acknowledgement behavior is
yet implemented or locally verified under ADR-0011.

**Next entry condition:** implement the smallest zero-dependency adapter boundary and deterministic
contract tests, then prove strict input/result shape, expiry, correlation, immutable credential-
free dispatch, every result class, one-call timeout/exception behavior, no fallback, and Node 24
compatibility before selecting any concrete Agent platform.

### Increment C4b — deterministic Agent Adapter boundary

**Closure:** `locally_verified` on 2026-08-31.

- The explicit `./agent-adapter` subpath now derives one immutable activation from a live delivery
  lease, passes no Connector, lease, effect, or raw managed-context credential to the adapter,
  validates exact receipt and continuation correlation, and invokes one injected adapter once.
- The boundary accepts only the four ADR-0011 result classes and four bounded unavailable-
  capability values. An exception, lease-bounded timeout, malformed result, or correlation mismatch
  becomes a redacted `outcome_unknown`; no path retries, falls back, calls the Host, asserts an
  effect, or acknowledges delivery.
- Six focused deterministic tests cover strict and accessor-safe input, expiry, scope mismatch,
  credential omission, immutability, every result class and unavailable capability, exception,
  timeout, malformed result, and result mismatch. The fixture has no Agent, Browser, network,
  Host, WebMCP, credential, or persistence behavior.
- The aggregate suite passes 54 of 54 tests on Node `v24.20.0` and Node `v26.5.0`; protocol
  conformance remains 11 of 11. Informational aggregate coverage is 89.71% lines, 74.58%
  branches, and 97.03% functions; the new module is 90.55%, 77.17%, and 100% respectively. No
  low-value behavior was added to increase coverage.
- The reproducible Node `v24.20.0` local regression benchmark measured ten cold Node-process plus
  Agent-subpath imports at 23.629 ms median, 118,460 activation derivations/s, and 61,920 accepted
  dispatch wrappers/s across 10,000 iterations. This is deterministic local overhead, not Agent,
  Browser, network, service, or end-to-end latency and not an SLA.
- `npm ls --omit=dev --all --json` reports no dependency tree. The explicit Agent subpath and root
  import pass package self-reference probes without loading `node:sqlite`, and the Agent symbols do
  not leak through the root export. `npm pack --dry-run --json` selects 15 runtime, README, and
  vector files: 31,189 bytes compressed and 161,874 bytes unpacked. Benchmarks and tests remain
  outside the package allowlist.

This proves only the platform-neutral ADR-0011 activation and result boundary with a deterministic
adapter. It does not prove private context-binding capture or persistence, a supported Codex or
Agent route, Agent activation, Browser acquisition, canonical-page opening, WebMCP discovery,
Host effect, delivery acknowledgement, production Connector custody, deployment, or a selected
application.

**Next entry condition:** reconcile the smallest useful development runbook and closure evidence,
then audit RECORE-001 against its bounded `locally_verified` target. Keep real adapter selection,
private context-binding lifecycle, production process ownership, and app specialization behind
their named runtime or application decisions.

### Increment C5 — development runbook and foundation closure audit

**Closure:** `locally_verified` on 2026-08-31. RECORE-001 remains `in_progress`.

- `REENTRY-CORE-RUNBOOK.md` now owns one repeatable local resume, bounded implementation,
  verification, failure-triage, evidence-writeback, Git-closure, and handoff procedure. It does not
  duplicate Core semantics or act as a production operations, pairing, deployment, or Agent-
  runtime runbook.
- The Development index links that procedure while preserving separate authority for the program
  contract, current status, Core contracts, ADRs, active implementation, code, and runtime truth.
- The closure audit confirms that the initial source baseline, protocol, Host SDK, Receiver
  authority, Connector delivery, strict HTTP transport, forced-restart test isolation, and
  deterministic Agent Adapter contract have reached their recorded bounded evidence levels.
- RECORE-001 does not close yet. Its own ordered Increment D and final reconciliation still lack a
  non-test-fixture domain-neutral conformance/development profile with independently exercisable
  Host, Receiver, and Connector entrypoints. The current child-process files remain evidence
  scaffolding and cannot be relabelled as shipping or production processes.
- This gap does not justify speculative pairing UI, daemon, lockfile, credential vault, hosted
  datastore, multi-replica control, real Agent adapter, or final-app behavior. Those remain behind
  their explicit runtime, trust, or application decisions.

This audit distinguishes a locally verified set of foundation contracts from a completed
foundation task and from the larger Re-entry Core Program Definition of Done. No closure label,
runtime claim, deployment claim, or selected-app claim is upgraded.

**Next entry condition:** decide the smallest domain-neutral conformance/development profile that
can exercise the existing Host, Receiver HTTP, outbound Connector, persistence, and deterministic
Agent ports outside the test tree. Freeze only its ownership, configuration, lifecycle, and claim
boundary before implementation; keep production custody and supervision explicitly out of scope.
