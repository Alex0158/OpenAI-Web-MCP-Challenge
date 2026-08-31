# Re-entry Core

**Status:** v0.1 protocol, Host SDK, Receiver C1, Connector delivery C2, and transport/process C3c locally verified  
**Authority:** ADR-0006 through ADR-0010 and `Docs/Development/RECORE-001-foundation.md`

This directory is the authoritative source for new application-neutral Re-entry Core behavior.
MVP1 and MVP2 remain unchanged references.

## Current surface

- `src/protocol.mjs` — strict bounded Manifest, event envelope, public binding, private receipt,
  canonical JSON, Ed25519 signing, and typed errors.
- `src/host-sdk.mjs` — narrow Host-side Manifest and event issuance without Receiver or Agent
  authority.
- `src/receiver-core.mjs` — Receiver-owned consent challenge, private Grant, public binding,
  exact event replay, atomic pending-delivery reservation, and a narrow delivery facade behind
  injected authority ports.
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
- `src/receiver-http-contract.mjs` — internal route, field, and transport-limit constants.
- `test/` — positive, negative, tamper, boundary, privacy, rollback, restart, and independent-
  process tests; process fixtures are not runtime entrypoints.
- `protocol/test-vectors/` — frozen interoperability inputs and outputs.

## Commands

```bash
npm test
npm run test:conformance
npm run benchmark:protocol
node --test test/receiver-core.test.mjs test/sqlite-receiver-store.test.mjs
node --test test/separate-process.test.mjs
```

The package has zero runtime dependencies and targets Node 24 or newer.
`SqliteReceiverStore` is available only through the `./sqlite-receiver-store` subpath, so the
root, protocol, Host SDK, and Receiver Core imports do not load `node:sqlite` implicitly.

Local verification covers strict shapes, canonical encoding, Ed25519 signing and verification,
trusted-origin anchoring, tamper and boundary rejection, frozen vectors, Host SDK isolation,
trusted consent integration, private-output boundaries, atomic run reservation, exact replay,
target and subject isolation, replayable lease claims, bounded reclamation, stale-worker fencing,
effect-backed acknowledgement, transaction rollback, version-1 migration, and file
close-and-reopen persistence. Focused transport tests also cover ordinary JSON request mapping,
no-work responses, bounds, redacted failures, origin policy, redirects, timeouts, malformed or
stale responses, and absence of automatic retry. One test-only harness runs Host, Receiver, and
Connector children independently and verifies restart replay, effect gating, response-loss
convergence, and token non-persistence. It remains local evidence only.

The benchmark is a local regression baseline, not a throughput promise or service SLA.

## Current non-claims

This kernel does not implement a production consent or pairing session, TLS listener or public
Cloud Receiver service, production Connector daemon, durable Connector credential or claim-token
storage, real Host-effect verifier, Agent activation, Browser acquisition, WebMCP runtime access,
deployment, or a selected Host application. Test child processes are evidence scaffolding, not
shipping services. Unsupported capability is not replaced by a hidden fallback.
