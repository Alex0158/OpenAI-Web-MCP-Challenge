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
