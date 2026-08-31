# Re-entry Core

**Status:** v0.1 protocol, Host SDK, Receiver C1, Receiver Grant control, Connector delivery C2,
transport/process C3d, Agent Adapter contract C4b, source-repository conformance profile C6b, and
app-independent quality and weight baseline locally verified  
**Authority:** ADR-0006 through ADR-0013 and `Docs/Development/RECORE-001-foundation.md` through
`Docs/Development/RECORE-004-grant-control.md`

This directory is the authoritative source for new application-neutral Re-entry Core behavior.
MVP1 and MVP2 remain unchanged references.

## Current surface

- `src/protocol.mjs` — strict bounded Manifest, event envelope, public binding, private receipt,
  canonical JSON, Ed25519 signing, and typed errors.
- `src/host-sdk.mjs` — narrow Host-side Manifest and event issuance without Receiver or Agent
  authority.
- `src/receiver-core.mjs` — Receiver-owned consent challenge, private Grant, public binding,
  authenticated same-subject inspection and atomic revocation, exact event replay, atomic
  pending-delivery reservation, and a narrow delivery facade behind injected authority ports.
- `src/receiver-delivery.mjs` — internal target-scoped claim, short lease, bounded-attempt,
  stale-worker fencing, and Host-effect-backed acknowledgement state machine.
- `src/receiver-support.mjs` — shared strict Receiver validation, immutable-value, and typed-error
  helpers.
- `src/sqlite-receiver-store.mjs` — optional Node SQLite reference store with explicit
  transactions, additive schema migration, WAL and full synchronous durability for file-backed
  state, and no fallback.
- `src/sqlite-receiver-schema.mjs` — internal versioned schema and delivery projection.
- `src/cloud-receiver-http.mjs` — strict bounded Host-event, delivery-claim, and effect-
  acknowledgement HTTP mapping over an injected Receiver Core.
- `src/local-connector-client.mjs` — outbound-only no-retry Connector client with secure-origin,
  timeout, response-size, redirect, and exact-response validation.
- `src/agent-adapter.mjs` — credential-free lease-to-activation derivation, one-call bounded
  adapter dispatch, and explicit accepted, unsupported, rejected, or unknown outcomes.
- `src/receiver-http-contract.mjs` — internal route, field, and transport-limit constants.
- `conformance/` — source-repository-only domain-neutral Host, Receiver, Connector, deterministic
  Agent, and redacted orchestration profile; excluded from runtime exports and package files.
- `bench/` — bounded protocol, durable Receiver, Agent Adapter, and source-profile local regression
  entrypoints; excluded from runtime exports and package files.
- `test/` — positive, negative, tamper, boundary, privacy, rollback, restart, and independent-
  process tests; fault wrappers remain test-only.
- `protocol/test-vectors/` — frozen interoperability inputs and outputs.

## Commands

```bash
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
Deterministic Agent Adapter tests cover credential omission, expiry and correlation rejection,
all bounded outcomes and unavailable capabilities, one-call behavior, timeout, exception,
malformed result, immutability, and the no-effect/no-acknowledgement boundary.

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
deterministic adapter is contract evidence, not a runtime fallback or a real Agent. Unsupported
capability is not replaced by a hidden fallback.
