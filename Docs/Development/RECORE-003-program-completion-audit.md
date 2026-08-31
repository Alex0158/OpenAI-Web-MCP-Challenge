# RECORE-003: Program Completion Audit

**Role:** CLOSED CURRENT-EVIDENCE AUDIT  
**Risk profile:** Standard — documentation and evidence classification only  
**Status:** `locally_verified`  
**Opened:** 2026-08-31  
**Closed:** 2026-08-31  
**Branch:** `codex/re-entry-core-foundation`  
**Baseline:** `9b55410ae645b88dc7c9cb3f6ea41907576bf01a`

## Objective

Audit every Re-entry Core Program Definition of Done item against current authoritative code,
tests, decisions, and evidence. Identify the smallest application-neutral completion gaps without
pulling production deployment, final-app behavior, or an unsupported Agent path into the Core.

This audit changes no runtime behavior or Definition of Done. It uses four evidence states:

- `MET`: direct evidence exists at the boundary the Program requires;
- `PARTIAL`: direct evidence exists for part of the item, with a named missing boundary;
- `OPEN`: application-neutral work is missing and may proceed under a bounded increment; and
- `DECISION-GATED`: work depends on a later accepted runtime, app, or platform decision and must
  not be guessed inside the Core.

## Governing boundary

- `REENTRY-CORE-PROGRAM.md` owns the Definition of Done.
- Core/00 and Core/05 own current status and evidence claims.
- ADR-0006 through ADR-0012 own the accepted source, authority, transport, adapter, and
  conformance boundaries.
- RECORE-001 and RECORE-002 are closed implementation records, not authority for unimplemented
  behavior.
- A test double that injects a field or authority result proves consumer behavior only. It does
  not prove the missing write lifecycle or production authority.

## Definition of Done ledger

### Authority and source

| Requirement | State | Direct evidence and remaining boundary |
|---|---|---|
| `reentry-core/` is the sole source for new Core behavior | `MET` | ADR-0006 assigns the source root; current runtime code and tests live there. |
| MVP1 and MVP2 remain unchanged references | `MET` | The current branch has no `mvp/` or `References/` change from the RECORE-001 baseline; MVP2 remains an unmerged contributor reference. |
| Canonical documents, decisions, work records, code, and evidence have no material status contradiction | `MET` | Current surfaces distinguish target contracts from bounded implementation. This audit adds the previously implicit Grant-control claim limit to Core/00, Core/03 through Core/05, and active-work routing. |

### Contracts and implementation

| Requirement | State | Direct evidence and remaining boundary |
|---|---|---|
| Manifest, Grant, private binding, typed event, durable delivery, lease, acknowledgement, Host-effect correlation, and human-boundary semantics | `PARTIAL` | Protocol, Grant creation, opaque Host binding, event, delivery, lease, acknowledgement, correlation, and human-boundary data semantics are directly tested. A Receiver-owned Grant inspection/revocation lifecycle and a private managed-context binding lifecycle are not implemented. |
| Host SDK, Receiver Core, Cloud Receiver, Local Connector, persistence, and Agent Adapter are independently exercisable | `MET` | Narrow exported modules and focused suites exercise every named boundary. The Cloud Receiver evidence is an HTTP handler and bounded role process, not a deployed service. |
| Domain-neutral conformance Host fixture | `MET` | ADR-0012 and `conformance/` exercise the current contracts without importing a final-app domain. |

### Process and authority proof

| Requirement | State | Direct evidence and remaining boundary |
|---|---|---|
| Cloud Receiver and Local Connector complete the bounded protocol as separate processes with separate state and credentials | `MET` | Shared role entrypoints run distinct Host, Receiver, and Connector children; only Receiver opens SQLite, Host retains its signing key, and Connector uses its own bearer and claim tokens over HTTP. This is non-production process evidence. |
| Separate-process failure, restart, lease recovery, replay, acknowledgement loss, revocation, stale state, and duplicate-effect behavior | `PARTIAL` | Forced Receiver termination after committed event and lease state, exact event and claim replay, wrong-effect rejection, acknowledgement-response loss, restart, and same-effect convergence are direct. Grant revocation is only simulated through overridden read results; expired-lease stale-worker fencing and conflicting-effect behavior are direct only in-process; no OS-level mid-transaction termination has been injected. |
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
| Focused and aggregate verification pass | `MET` | RECORE-001 records focused contract evidence; RECORE-002 records 56 of 56 aggregate tests and 11 of 11 protocol tests on Node 24 and Node 26. |
| Material performance and weight surfaces have bounded evidence | `MET` | RECORE-002 measures protocol, deterministic adapter, file-backed Receiver lifecycle, cold source-profile startup, and package weight with explicit non-SLA limits. No idle workload was invented for a Connector with no idle loop. |
| Dependencies, processes, payloads, retries, logs, and generated state are bounded | `MET` | Runtime dependencies remain zero; strict payload and timeout limits, one-call/no-retry behavior, bounded child processes, redacted profile output, and exact handled-run cleanup are directly represented. |
| Happy path needs no speculative feature or fallback | `MET` | The verified path uses the frozen contracts and deterministic authorities without alternate transports or compatibility layers. |

### Documentation and delivery

| Requirement | State | Direct evidence and remaining boundary |
|---|---|---|
| Authority map, status, architecture, trust, validation, active work, runbook, and evidence are concise and consistent | `MET` | The Development index routes authority; Core/00 and Core/05 state the evidence ceiling; this audit records the remaining Program gaps without redefining their owners. |
| No private credential, raw managed-context identifier, mutable runtime database, or sensitive trace is tracked | `MET` | No tracked Re-entry Core database, WAL, log, or trace exists. Credential-shape scans found no API or bearer secret; the only private-key header match is protocol source that accepts caller-supplied signing material, not embedded key material. Managed-context terms occur only as contract names or explicit absence assertions. |
| Final Core increment has exact verification, commit, remote, and residual-risk state | `OPEN` | This is intentionally a terminal closure gate. RECORE-001 and RECORE-002 are individually closed, but the Program cannot name a final increment while the gaps below remain. |

## Completion blockers

Three application-neutral gaps remain:

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

The final exact verification and Git evidence record follows those increments. These blockers are
independent of final Web App selection and may proceed sequentially.

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

## Verification record

**Closure:** `locally_verified` on 2026-08-31.

- The audit used the current branch at baseline `9b55410ae645b88dc7c9cb3f6ea41907576bf01a`.
- The current branch contains no `mvp/` or immutable `References/` change from the RECORE-001
  baseline.
- Current tracked Re-entry Core files contain no mutable database, WAL, log, or trace artifact.
- Credential-shape and managed-context scans support the bounded artifact claim above; they are
  not a general repository secret-audit claim.
- No runtime source, test, conformance, benchmark, package, MVP, reference, research, scenario, or
  user-owned dirty file changed in this audit.

**Next entry condition:** accept a narrow ADR for Receiver-owned Grant inspection and revocation.
Do not bundle private context binding, production credential revocation, new HTTP administration,
or process-fault scaffolding into that decision.
