# Re-entry Core

**Status:** v0.1 protocol, Host SDK, and Receiver C1 locally verified  
**Authority:** ADR-0006 through ADR-0008 and `Docs/Development/RECORE-001-foundation.md`

This directory is the authoritative source for new application-neutral Re-entry Core behavior.
MVP1 and MVP2 remain unchanged references.

## Current surface

- `src/protocol.mjs` — strict bounded Manifest, event envelope, public binding, private receipt,
  canonical JSON, Ed25519 signing, and typed errors.
- `src/host-sdk.mjs` — narrow Host-side Manifest and event issuance without Receiver or Agent
  authority.
- `src/receiver-core.mjs` — Receiver-owned consent challenge, private Grant, public binding,
  exact event replay, and atomic pending-delivery reservation behind narrow injected ports.
- `src/sqlite-receiver-store.mjs` — optional Node SQLite reference store with explicit
  transactions, WAL and full synchronous durability for file-backed state, and no fallback.
- `test/` — positive, negative, tamper, boundary, privacy, rollback, restart, and isolation tests.
- `protocol/test-vectors/` — frozen interoperability inputs and outputs.

## Commands

```bash
npm test
npm run test:conformance
npm run benchmark:protocol
node --test test/receiver-core.test.mjs test/sqlite-receiver-store.test.mjs
```

The package has zero runtime dependencies and targets Node 24 or newer.
`SqliteReceiverStore` is available only through the `./sqlite-receiver-store` subpath, so the
root, protocol, Host SDK, and Receiver Core imports do not load `node:sqlite` implicitly.

Local verification covers strict shapes, canonical encoding, Ed25519 signing and verification,
trusted-origin anchoring, tamper and boundary rejection, frozen vectors, Host SDK isolation,
trusted consent integration, private-output boundaries, atomic run reservation, exact replay,
transaction rollback, and file close-and-reopen persistence. It remains local evidence only.

The benchmark is a local regression baseline, not a throughput promise or service SLA.

## Current non-claims

This kernel does not implement a production consent session or UI, Cloud Receiver HTTP service,
Connector pairing, delivery leases or acknowledgement, Local Connector dispatch, Agent
activation, Browser acquisition, WebMCP runtime access, deployment, or a selected Host
application. Unsupported capability is not replaced by a hidden fallback.
