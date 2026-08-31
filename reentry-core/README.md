# Re-entry Core

**Status:** v0.1 protocol and Host SDK kernel locally verified  
**Authority:** ADR-0006, ADR-0007, and `Docs/Development/RECORE-001-foundation.md`

This directory is the authoritative source for new application-neutral Re-entry Core behavior.
MVP1 and MVP2 remain unchanged references.

## Current surface

- `src/protocol.mjs` — strict bounded Manifest, event envelope, public binding, private receipt,
  canonical JSON, Ed25519 signing, and typed errors.
- `src/host-sdk.mjs` — narrow Host-side Manifest and event issuance without Receiver or Agent
  authority.
- `test/` — positive, negative, tamper, boundary, and Host-isolation tests.
- `protocol/test-vectors/` — frozen interoperability inputs and outputs.

## Commands

```bash
npm test
npm run test:conformance
npm run benchmark:protocol
```

The package has zero runtime dependencies and targets Node 24 or newer.

Local verification covers strict shapes, canonical encoding, Ed25519 signing and verification,
trusted-origin anchoring, tamper and boundary rejection, frozen vectors, and Host SDK isolation.
It remains in-process evidence only.

The benchmark is a local regression baseline, not a throughput promise or service SLA.

## Current non-claims

This kernel does not implement Receiver consent, durable state, Cloud Receiver HTTP service,
Local Connector delivery, Agent activation, Browser acquisition, WebMCP runtime access,
deployment, or a selected Host application. Unsupported capability is not replaced by a hidden
fallback.
