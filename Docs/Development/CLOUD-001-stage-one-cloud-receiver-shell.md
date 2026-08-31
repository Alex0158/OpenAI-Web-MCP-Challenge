# CLOUD-001: Stage 1 Cloud Receiver Shell

**Role:** IMPLEMENTATION AND VERIFICATION RECORD  
**Risk profile:** Assured — process topology, persistence, operational ingress, and shutdown  
**Status:** `locally_verified`  
**Opened:** 2026-08-31  
**Closed:** 2026-08-31  
**Branch:** `codex/eyad-reentry-core-foundation`  
**Baseline:** `0ce22ad8e6f3478cd85f5ad22ec3b5c18448f6a3`  
**Implementation commit:** `e11e71cebdb23782dcb85b9b19a4756a620bb917`

## Objective

Implement the first real, domain-neutral Cloud Receiver process shell around the existing Receiver
Core. Close only a loopback local-service boundary with file-backed SQLite, exact Core HTTP
delegation, redacted health and readiness, startup validation, and graceful shutdown.

Target closure is `locally_verified`. Public hosting, production credentials, organization control,
Browser consent, Connector pairing, Agent activation, and deployment remain open.

## Authority and sequencing

- TASK-003 owns the Cloud Receiver lifecycle and next gate.
- ADR-0006 owns the single Receiver plus outbound Local Connector topology.
- ADR-0008 through ADR-0010 own Receiver durability, leases, acknowledgement, and the frozen HTTP
  routes.
- ADR-0019 owns this shell's source placement, loopback boundary, operational routes, composition,
  and lifecycle.
- Core/03, Core/04, and Mechanism/03 retain the system, trust, and delivery invariants.

The user's Stage 1 implementation request is an implementation of the accepted one-Receiver
topology. It does not authorize public deployment or a new identity model.

## Challenge

### Hypothesis

One small Node package can turn the existing Core adapter into a real local service without adding a
second Receiver, fake runtime identity, public bind, framework, retry, fallback, or domain policy.

### Falsifiers and stop conditions

- The shell must reinterpret a protocol request or success value.
- A runtime fake consent, Connector, Host-effect, or signing authority is needed to start safely.
- A relative or in-memory database becomes an implicit fallback.
- Health or logs disclose credentials, paths, payloads, private Grant state, or internal exceptions.
- Bind failure selects another address, port, store, or transport.
- Graceful stop can close the store before the listener drains.
- A protocol, schema, Core authority, selected Host, or Local Connector change becomes necessary.

If a falsifier occurs, stop and reopen the owning decision. Do not move a test fixture into runtime
or widen Stage 1 to make the service appear complete.

## Minimal implementation boundary

- Add `runtime/cloud-receiver/` with a narrow service factory, file-backed SQLite composition helper,
  startup configuration parser, and executable process entrypoint.
- Delegate the three versioned routes unchanged to `createCloudReceiverHttpHandler`.
- Add only exact `GET /healthz` and `GET /readyz` operational routes.
- Bind only to literal loopback, apply fixed bounded Node server settings, and close through
  `SIGINT` or `SIGTERM`.
- Require a trusted absolute composition module; keep every synthetic authority under `test/`.
- Verify one generic Manifest and consent setup followed by event, claim, Host effect,
  acknowledgement, store reopen, and acknowledgement replay.
- Verify the executable in a separate child process for startup, readiness, SQLite creation, and
  `SIGTERM` closure.

## Explicitly unaffected

- Re-entry protocol values, Host SDK, Receiver Core, database schema, Core HTTP adapter, Local
  Connector client, Agent Adapter, and package exports;
- production account, organization, key, session, consent, Grant-control, pairing, effect, backup,
  retention, rate-limit, abuse-control, TLS, proxy, or deployment contracts;
- selected Host application, Browser SDK, WebMCP tools, Codex integration, and product proof;
- frozen `mvp/`, immutable References, Research, Scenarios, Experiments, `mvp-shared/`, and `mvp2/`;
- user-owned dirty files outside the exact Stage 1 paths.

## Verification plan and claim boundary

Run on Node 24.20.0:

1. shell syntax and focused tests;
2. complete `runtime/cloud-receiver` verification;
3. complete unchanged `reentry-core` verification;
4. repository validator and sensitive-pattern baselines after exact staging; and
5. staged diff, CJK, secret, generated-state, and remote-divergence review.

Positive, negative, boundary, restart, redaction, no-fallback, and process-signal cases must pass.
Closure remains `locally_verified`; the child-process lifecycle test does not make the full protocol
path production- or deployment-verified.

## Verification record

**Closure:** `locally_verified` on 2026-08-31.

- `npx --yes node@24.20.0 --version` selected Node 24.20.0 for closure.
- `npm run verify` under that runtime passed Cloud Receiver syntax and 9 of 9 tests.
- The positive flow issued one generic signed Manifest, created one Receiver-owned challenge and
  synthetic approval, accepted one event through HTTP, claimed one target-scoped lease through the
  outbound Connector client, acknowledged one trusted synthetic Host effect, closed and reopened
  SQLite, and returned the prior acknowledgement as an exact duplicate.
- Negative and boundary evidence covers non-loopback and invalid-port configuration, relative and
  in-memory database fallback, query and method rejection, redacted readiness failure, readiness
  during shutdown, listener collision without port fallback, bounded startup error output, and raw
  synthetic-token absence from the database file.
- The standalone entrypoint started in a distinct child process, created the file-backed store,
  returned bounded liveness and readiness, closed through `SIGTERM`, and exited successfully.
- The unchanged `reentry-core` `npm run verify` passed 79 of 79 tests, direct conformance, syntax,
  zero-runtime-dependency inspection, and its 16-file package check on Node 24.20.0.
- `python3 scripts/test_validators.py` passed 6 tests;
  `python3 scripts/test_sensitive_scan.py` passed 3 tests;
  `python3 scripts/validate_repository.py --root .` passed; and
  `python3 scripts/scan_sensitive_patterns.py --root .` found no high-confidence sensitive pattern.
- Staged diff validation passed. Exact staging excludes `mvp-shared/`, `mvp2/`, mutable databases,
  environment files, credentials, generated state, frozen references, and every unrelated path.
- No v0.1 protocol, Receiver authority, schema, Host SDK, Local Connector client, Agent Adapter, or
  Re-entry Core package contract changed. Core and Mechanism documents changed only to record the
  new local runtime status and its non-production evidence ceiling.

The strongest supported claim is a locally verified loopback Cloud Receiver shell. The generic
protocol flow runs through the real HTTP and SQLite composition in one test process; only process
startup, operational status, store ownership, and graceful signal closure are exercised in a child.
No public, production, deployment, real-identity, real-effect, or Agent claim follows.

## Residual risk and reopen condition

Real service identity and every production authority remain absent by design. Reopen CLOUD-001 if
the shell changes a frozen protocol route, accepts a non-loopback bind, loads an untrusted runtime
extension, silently falls back from durable SQLite or configured authority, leaks private state, or
cannot drain and close predictably in the selected deployment environment.
