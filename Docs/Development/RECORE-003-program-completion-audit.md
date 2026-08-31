# RECORE-003: Program Completion Audit

**Role:** CLOSED PROGRAM COMPLETION AUDIT  
**Risk profile:** Standard — documentation and evidence classification only  
**Status:** `locally_verified`  
**Opened:** 2026-08-31  
**Closed:** 2026-08-31  
**Branch:** `codex/re-entry-core-foundation`  
**Baseline:** `9b55410ae645b88dc7c9cb3f6ea41907576bf01a`  
**Terminal audit baseline:** `f97c74ff1e465901748f25d4655d8b5cfdeb7be2`  
**Final Core implementation:** `41fa3ef47b6b43c1234962419f08165f52d7b004`

## Objective

Audit and then re-audit every Re-entry Core Program Definition of Done item against current
authoritative code, tests, decisions, and evidence. Close the application-neutral Program only
when every required row has direct bounded evidence, without pulling production deployment,
final-app behavior, or an unsupported Agent path into the Core.

This audit changes no runtime behavior or Definition of Done. It uses four evidence states:

- `MET`: direct evidence exists at the boundary the Program requires;
- `PARTIAL`: direct evidence exists for part of the item, with a named missing boundary;
- `OPEN`: application-neutral work is missing and may proceed under a bounded increment; and
- `DECISION-GATED`: work depends on a later accepted runtime, app, or platform decision and must
  not be guessed inside the Core.

## Governing boundary

- `REENTRY-CORE-PROGRAM.md` owns the Definition of Done.
- Core/00 and Core/05 own current status and evidence claims.
- ADR-0006 through ADR-0014 own the accepted source, authority, transport, adapter, and
  conformance boundaries.
- RECORE-001, RECORE-002, RECORE-004, RECORE-005, and RECORE-006 are closed records, not authority
  for behavior outside their exact evidence boundaries.
- A test double that injects a field or authority result proves consumer behavior only. It does
  not prove the missing write lifecycle or production authority.

## Definition of Done ledger

### Authority and source

| Requirement | State | Direct evidence and remaining boundary |
|---|---|---|
| `reentry-core/` is the sole source for new Core behavior | `MET` | ADR-0006 assigns the source root; current runtime code and tests live there. |
| MVP1 and MVP2 remain unchanged references | `MET` | The current branch has no `mvp/` or `References/` change from the RECORE-001 baseline; MVP2 remains an unmerged contributor reference. |
| Canonical documents, decisions, work records, code, and evidence have no material status contradiction | `MET` | Terminal scans reconcile committed Core, Decision, Development, package, code, test, and evidence claims. Uncommitted user-owned supporting candidate work is excluded and does not select an app or change Core authority. |

### Contracts and implementation

| Requirement | State | Direct evidence and remaining boundary |
|---|---|---|
| Manifest, Grant, private binding, typed event, durable delivery, lease, acknowledgement, Host-effect correlation, and human-boundary semantics | `MET` | Protocol, Grant creation and control, opaque Host binding, event, delivery, lease, acknowledgement, correlation, and human-boundary semantics are directly tested. ADR-0014 and RECORE-006 add exact private Grant-to-binding resolution without exposing or selecting a raw platform locator. Production binding capture and custody remain decision-gated, not an application-neutral contract gap. |
| Host SDK, Receiver Core, Cloud Receiver, Local Connector, persistence, and Agent Adapter are independently exercisable | `MET` | Narrow exported modules and focused suites exercise every named boundary. The Cloud Receiver evidence is an HTTP handler and bounded role process, not a deployed service. |
| Domain-neutral conformance Host fixture | `MET` | ADR-0012 and `conformance/` exercise the current contracts without importing a final-app domain. |

### Process and authority proof

| Requirement | State | Direct evidence and remaining boundary |
|---|---|---|
| Cloud Receiver and Local Connector complete the bounded protocol as separate processes with separate state and credentials | `MET` | Shared role entrypoints run distinct Host, Receiver, and Connector children; only Receiver opens SQLite, Host retains its signing key, and Connector uses its own bearer and claim tokens over HTTP. This is non-production process evidence. |
| Separate-process failure, restart, lease recovery, replay, acknowledgement loss, revocation, stale state, and duplicate-effect behavior | `MET` | RECORE-005 directly verifies revocation-before-event, lease-before-revocation effect convergence and conflict, expired-lease reclaim with stale-worker fencing, and one exact pre-commit `SIGKILL` rollback point across distinct test processes. This remains bounded source-repository evidence, not production or arbitrary-crash proof. |
| Local Connector cannot issue or widen continuation authority | `MET` | Its public client can only claim and acknowledge with Receiver-verified identity and Host-effect authority. It has no Grant, event-signing, scope, or persistence mutation port. |

### Agent boundary truth

| Requirement | State | Direct evidence and remaining boundary |
|---|---|---|
| Deterministic adapter covers the complete adapter contract and failure classes | `MET` | ADR-0011 focused tests cover one-call dispatch, exact correlation, all result and unavailable-capability classes, timeout, exception, malformed result, and no retry or acknowledgement. |
| Unsupported real joins remain typed and have no hidden fallback | `MET` | Unsupported capabilities stay explicit; polling, DOM automation, generic MCP, direct REST, fresh-context substitution, and manual reconstruction are not runtime fallbacks. |
| Real Agent wake is not required for application-neutral Core closure | `MET` | The Program and ADR-0011 keep concrete Agent activation as a selected-platform gate without weakening the deterministic contract. |

### Quality and weight

| Requirement | State | Direct evidence and remaining boundary |
|---|---|---|
| Focused and aggregate verification pass | `MET` | Final-source verification passes 79 of 79 aggregate tests, 11 of 11 protocol tests, 5 of 5 focused process/fault tests, and direct conformance on Node 24.20.0 and Node 26.5.0. All nine package exports import on both runtimes. |
| Material performance and weight surfaces have bounded evidence | `MET` | Final-source protocol, deterministic adapter, file-backed Receiver lifecycle, cold source-profile startup, and exact package checks pass on both runtimes with explicit non-SLA limits. No idle workload was invented for a Connector with no idle loop. |
| Dependencies, processes, payloads, retries, logs, and generated state are bounded | `MET` | Runtime dependencies remain zero; strict payload and timeout limits, one-call/no-retry behavior, bounded child processes, redacted profile output, and exact handled-run cleanup are directly represented. |
| Happy path needs no speculative feature or fallback | `MET` | The verified path uses the frozen contracts and deterministic authorities without alternate transports or compatibility layers. |

### Documentation and delivery

| Requirement | State | Direct evidence and remaining boundary |
|---|---|---|
| Authority map, status, architecture, trust, validation, active work, runbook, and evidence are concise and consistent | `MET` | The Development index routes authority; Core/00 and Core/05 state the evidence ceiling; this terminal audit records closure and decision-gated follow-on work without redefining their owners. |
| No private credential, raw managed-context identifier, mutable runtime database, or sensitive trace is tracked | `MET` | No tracked Re-entry Core database, WAL, log, or trace exists. Credential-shape scans found no API or bearer secret; the only private-key header match is protocol source that accepts caller-supplied signing material, not embedded key material. Managed-context references in tests are explicit synthetic fixtures; no actual task, thread, credential, or platform locator is tracked. |
| Final Core increment has exact verification, commit, remote, and residual-risk state | `MET` | RECORE-006 records exact dual-runtime tests, conformance, export, dependency, package, benchmark, non-disclosure, residual-risk, implementation commit, and remote-match evidence. Commit `41fa3ef47b6b43c1234962419f08165f52d7b004` and canonical closure `f97c74ff1e465901748f25d4655d8b5cfdeb7be2` are both present on the remote task branch. |

## Resolved application-neutral gaps

The initial audit identified three application-neutral gaps:

1. **Grant control:** implement a Receiver-owned, authenticated, idempotent inspection and
   revocation contract; preserve audit history; and freeze the event-versus-revocation and
   lease-versus-revocation race rules. Existing `revoked_at` reads and override-based tests do not
   prove this lifecycle.
2. **Private context binding:** define the minimum opaque binding lifecycle and ownership boundary
   that lets a replaceable adapter target the authorized managed context without exposing a raw
   platform identifier to the Host, activation payload, logs, or public artifacts. It must not
   select a Codex wake mechanism.
3. **Process failure matrix:** after the missing control contracts exist, prove revocation,
   expired-lease stale-worker fencing, same and conflicting Host-effect replay, and OS-level
   mid-transaction termination at separate-process boundaries without production hooks.

RECORE-004 has since locally verified item 1 through ADR-0013 and implementation commit
`eadb7313984f8dd16e5fb973c8775e56f252d845`. RECORE-005 has since verified item 3 through
implementation commit `e5571fa8cb56ff129e787fb725a81d5ee94bfae5` and the exact four-case
test-process matrix. RECORE-006 verified item 2 through implementation commit
`41fa3ef47b6b43c1234962419f08165f52d7b004`. Its deterministic adapter authority resolves only the
private receipt `grant_id` plus configured adapter ID, keeps the raw locator inside the
authority-to-driver boundary, and adds no runtime dependency, Receiver route, schema, Connector
API, platform SDK, or fallback. The terminal audit finds all three gaps closed at their stated
evidence levels.

## Decision-gated non-blockers

The following remain real risks but are not permission to expand the application-neutral Core:

- production service and Connector shells, supervision, and single-owner enforcement;
- real consent UI, pairing, credential custody, rotation, credential revocation, and recovery;
- hosted storage, TLS, rate limiting, retention, multi-replica behavior, and deployment;
- a real Host-effect verifier and concrete Agent/Browser/WebMCP adapter;
- selected-app state, tools, event frequency, latency, privacy, economics, and human workflow;
- public demo, clean-room judge flow, and submission.

Each requires its named runtime, app, platform, or release decision. Deterministic Core evidence
must not be relabelled as proof of those surfaces.

## Terminal verification record

**Program closure:** application-neutral `locally_verified` on 2026-08-31.

- The exact final source at baseline `f97c74ff1e465901748f25d4655d8b5cfdeb7be2` passes 79 of 79
  aggregate tests, 11 of 11 direct protocol tests, 5 of 5 focused process/fault tests, and the
  exact redacted conformance runner on Node 24.20.0 and Node 26.5.0.
- All nine declared package exports import on both runtimes. Runtime dependencies are empty.
  `npm pack --dry-run --json` selects 16 files, 34,227 compressed bytes, and 180,301 unpacked
  bytes; tests, conformance sources, benchmarks, and mutable runtime artifacts are excluded.
- Final-source benchmarks pass their bounded local-only contracts on both runtimes. Manifest and
  event payloads remain 827 and 384 bytes. Node 24/current median Agent import startup is
  23.767/30.158 ms; Receiver startup is 1.769/1.561 ms; and cold source-profile startup is
  194.343/212.398 ms with 419 output bytes. These are regression samples, not service budgets,
  cross-version rankings, or Agent latency.
- No tracked Re-entry Core database, WAL, SHM, log, trace, archive, or package artifact exists.
  Credential-shape scanning finds only the protocol validator's literal private-key header, not
  embedded key material. Binding references in tests are synthetic fixtures; no actual task,
  thread, credential, or platform locator is tracked.
- `mvp/` and immutable `References/` have no committed change between the RECORE-001 baseline
  `25634e08536d699f0e107ef0d58afa5fdad2b157` and this terminal audit baseline.
- The final runtime increment and its canonical closure were each exact-staged, pushed, and
  remote-matched. The user's unrelated dirty Docs, research, and scenario work remains unmodified
  and uncommitted by this audit.

## Closure meaning and reopen conditions

Re-entry Core is complete only at the Program's application-neutral, locally verified evidence
boundary. This does not close final-app selection, production topology or security, supported
Agent/Browser/WebMCP activation, deployment, product value, clean-room judge reproduction, or
submission. Those are named follow-on programs and cannot inherit a stronger claim from this
closure.

Reopen the Core Program only if current code or tests contradict an invariant, a selected app
exposes a genuinely application-neutral contract gap, an accepted ADR changes authority or
topology, a required check regresses, or supported runtime evidence falsifies the current adapter
boundary. Ordinary selected-app specialization and platform implementation do not reopen Core by
default.
