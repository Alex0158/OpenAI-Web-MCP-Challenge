# CLOUD-002: Local Pairing and Connector Preview

**Role:** IMPLEMENTATION AND VERIFICATION RECORD  
**Risk profile:** Assured — identity mapping, credential custody, persistence, and delivery boundary  
**Status:** `locally_verified`  
**Opened:** 2026-08-31  
**Branch:** `codex/eyad-reentry-core-foundation`  
**Baseline:** `77840f4`

> **Current disposition:** `DEPRECATED` for the Cloud Receiver portion — this record is historical
> evidence only. The runtime it describes was retired by [ADR-0032](../Decisions/ADR-0032-retire-current-cloud-receiver-runtime.md);
> the reusable Local Connector contract remains separately preserved.

## Objective

Build the smallest useful local slice between a Host backend and a user's machine: one configured
organization, one Host-user reference, browser-assisted Connector pairing, durable mapping to one
delivery target, and a separate outbound-only Node Local Connector. Target closure is
`locally_verified`; this record does not claim production identity, deployment, or Agent activation.

## Authority and decision

- TASK-003 owns the Cloud Receiver lifecycle and production next gate.
- ADR-0020 owns browser-assisted pairing, one local organization, Host-user mapping, token custody,
  and the Local Connector boundary.
- ADR-0006 through ADR-0014 and Mechanisms/03 retain the Receiver, delivery, transport, and Agent
  Adapter contracts.
- Core/00, Core/03, Core/04, and Core/05 own current status, architecture, trust policy, and claim
  limits.

The Host backend starts pairing with an opaque `host_subject_ref`. The user approves the short code
in a browser. The Connector polls with a private device code and receives a derived Connector
credential. The Receiver stores only digests of pairing credentials; the Connector stores its own
bearer in a restrictive local file.

## Implemented surfaces

- `runtime/cloud-receiver/src/pairing-store.mjs` — file-backed SQLite pairing state and mapping;
- `runtime/cloud-receiver/src/pairing-control.mjs` — pairing start, claim, approval, poll, browser
  page, and Connector identity resolution;
- `runtime/cloud-receiver/src/local-preview-composition.mjs` — explicit local composition wiring
  pairing identity into the unchanged Receiver Core;
- `runtime/local-connector/src/pairing-client.mjs` — browser-assisted device-code-style client;
- `runtime/local-connector/src/credentials.mjs` — atomic 0600 credential storage; and
- `runtime/local-connector/src/local-connector.mjs` and `src/main.mjs` — one outbound claim and typed
  Agent Adapter handoff through `claim-once`.

The preview has no production account system, multi-tenant dashboard, public listener, real consent
authority, Host signing authority, Host-effect verifier, or supported Agent adapter. The CLI's
unsupported adapter is explicit and does not acknowledge a delivery.

## Verification

The affected runtime suites passed on Node 24.20.0:

- Cloud Receiver syntax check: passed (15 modules);
- Cloud Receiver tests: 13 of 13 passed;
- Local Connector syntax check: passed; and
- Local Connector tests: 2 of 2 passed.

The tests cover positive pairing, approval and polling, wrong organization credentials, duplicate
Host user rejection, hashed control-store values, controlled pairing-store reopen, identity mapping,
credential-file permissions, credential-free adapter input, and the local composition's integration
with Receiver Core.

The strongest supported claim is a locally verified loopback/local preview. No public, production,
runtime, deployment, real Agent, Browser, WebMCP, or Host-effect claim follows.

## Residual risk and next gate

Production work still needs an accepted service identity, account/session model, credential rotation
and recovery, TLS and abuse controls, supervision, offline policy, real consent and Host-effect
authorities, and a selected Host application. The next highest-leverage gate is TASK-001 application
selection; do not widen this preview into production infrastructure before that contract is known.
