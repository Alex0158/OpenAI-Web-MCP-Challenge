# CLOUD-003: Host-Key Registration and Event-Ingress Preview

**Role:** IMPLEMENTATION AND VERIFICATION RECORD  
**Risk profile:** Assured — authentication, durable identity, persistence, and cross-boundary delivery  
**Status:** `locally_verified`  
**Opened:** 2026-08-31  
**Branch:** `codex/eyad-reentry-core-foundation`

> **Current disposition:** `DEPRECATED` — this implementation record is historical evidence only.
> The Cloud Receiver runtime it describes was retired by [ADR-0032](../Decisions/ADR-0032-retire-current-cloud-receiver-runtime.md).

## Objective

Connect one configured preview organization to the unchanged Receiver Core through an
organization-authenticated Host public-key registration route. Prove that a Host SDK-signed Event
can be verified, durably accepted, converted into one pending delivery, and claimed by the existing
outbound Local Connector.

The target closure is `locally_verified`. This record does not claim production identity, public
hosting, a real consent session, a supported Agent adapter, Host-effect verification, or deployment.

## Authority and boundary

- TASK-003 owns the Cloud Receiver lifecycle and next production gate.
- ADR-0007 and ADR-0008 retain the protocol, Host issuance, Receiver Grant, event, and reservation
  contracts.
- ADR-0010 retains the three Core HTTP routes.
- ADR-0020 retains the local pairing and Host-user mapping boundary.
- ADR-0021 owns the preview-only Host-key registration route and its credential boundary.

The increment adds no new Re-entry Core wire fields and no consent bypass. The Host private key
remains on the Host backend. Re-entry stores only the registered public key and uses it for the
organization-scoped `manifest` and `event` key-resolution purposes.

## Implemented surfaces

- `runtime/cloud-receiver/src/host-key-control.mjs` — authenticated registration route and key
  resolver;
- `runtime/cloud-receiver/src/pairing-store.mjs` — durable Host-key table and v1-to-v2 migration;
- `runtime/cloud-receiver/src/local-preview-composition.mjs` — Host-key control wired to the
  existing Receiver Core;
- `runtime/cloud-receiver/src/index.mjs` and package exports — public runtime surface; and
- `runtime/cloud-receiver/test/host-key-control.test.mjs` and
  `runtime/cloud-receiver/test/local-preview-composition.test.mjs` — route, migration, restart,
  signature, event-ingress, and delivery-claim evidence.

## Falsifiers and stop conditions

- Registration accepts an invalid or non-Ed25519 public key.
- Organization authentication is bypassable or raw credentials are persisted or returned.
- Same-content registration is not idempotent or conflicting identity is silently replaced.
- A registered key can resolve outside its organization, issuer origin, key ID, or purpose.
- Event acceptance changes the frozen Core route or creates work before the Core transaction commits.
- A migration loses existing pairing state or silently falls back to an in-memory store.
- The Local Connector can claim a delivery outside its target scope.

## Verification plan

Run on Node 24:

1. Cloud Receiver syntax and focused tests;
2. complete Cloud Receiver verification;
3. Host SDK and unchanged Re-entry Core verification;
4. repository validator and sensitive-pattern scans; and
5. diff, package, migration, secret, and unrelated-work inspection.

The strongest supported claim remains local process and test evidence. The default local preview
still reports unsupported consent, Host-effect, and Agent capabilities.

## Verification result

Node 24.20.0 verification completed locally:

- `runtime/cloud-receiver`: syntax check passed; 16 of 16 tests passed;
- `runtime/host-sdk`: syntax check and 8 of 8 tests passed;
- `reentry-core`: syntax check, 79 of 79 tests, domain-neutral conformance, and package-surface
  checks passed;
- repository validators, repository validation, sensitive-pattern scan, and `git diff --check`
  passed; and
- the focused flow proved authenticated registration, duplicate and conflict handling, v1-to-v2
  migration, public-key persistence and reopen, Host SDK Event verification, pending delivery
  creation, and authorized Connector claim.

This closes the increment at `locally_verified`; it does not raise the project claim to
`runtime_verified` or `deployed`.

## Next gate

The next bounded Re-entry increment is an accepted consent-session contract that can create a
Receiver-owned Grant and public binding for the registered Host user. Production account identity,
credential lifecycle, deployment, and a selected Host application remain separate gates.
