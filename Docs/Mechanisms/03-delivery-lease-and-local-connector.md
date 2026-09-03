# Delivery Lease and Local Connector

**Role:** CANONICAL mechanism contract  
**Status:** Core, active v2, and current-checkout Local Connector contracts locally verified at
bounded scopes; pairing abuse fence, registry-package compatibility, default effect
acknowledgement, production identity/deployment, and supported Agent runtime open; former receiver
historical  
**Controls:** ADR-0009, ADR-0010, ADR-0013, historical ADR-0019 through ADR-0032, and active
ADR-0033, ADR-0037 through ADR-0041

## Responsibility

This module owns the boundary between accepted Receiver work and one eligible device or hosted
delivery target: target authentication, short delivery leases, bounded reclamation, stale-worker
fencing, outbound-only Connector transport, adapter dispatch handoff, and Host-effect-backed
acknowledgement.

It does not own Grant issuance, event interpretation, context selection, Agent behavior, Host
mutation, public inbound device control, or service-supervision policy. Active v2 creates a
short-lived pairing code in the authenticated user dashboard and redeems it once at
`/v0.1/account/pairing-sessions/claim`; ADR-0033 owns that contract. The similar ADR-0028/ADR-0030
receiver path and ADR-0020 Host-code-first path are historical evidence only.

## Delivery state model

```text
PENDING
-> LEASED
-> ACKNOWLEDGED

PENDING or expired LEASED
-> bounded reclaim or terminal outcome
```

Accepted event truth, delivery selection, adapter activation, Host effect, and acknowledgement are
separate facts. Local process completion or an adapter return never proves that the Host changed.

## Lease authority

- a trusted Connector identity resolves to one subject and delivery target;
- the Connector supplies a fresh claim token and Receiver storage retains only its digest;
- exact response-loss replay can recover the same live target-scoped lease;
- expired leases may be reclaimed only within the configured attempt bound;
- stale claim tokens and prior workers are fenced;
- Grant revocation prevents a new or replayed lease; and
- the immutable consented `display.reason` is copied into one bounded delivery `instruction`,
  never accepted from the later Event; and
- Connector and lease credentials are absent from Agent activation.

## Transport contract

The Core HTTP adapter and active v2 Receiver both map event acceptance, delivery claim, and
effect-backed acknowledgement. Active v2 adds separate pairing and disconnect routes for Connector
identity; those routes are not part of the Core protocol kernel. The outbound Connector client:

- requires HTTPS except on literal loopback;
- follows no redirects;
- validates exact bounded responses;
- enforces timeout and response-size limits;
- makes one request per caller decision; and
- performs no automatic retry or claim-token substitution.

Production consent, Grant control, production device authorization, health, diagnostics, long
polling, push transport, and service lifecycle remain outside this transport kernel. ADR-0019 adds shell-owned
`GET /healthz` and `GET /readyz` around the unchanged adapter; those routes report process state and
never delivery or effect success.

## Effect and acknowledgement

Acknowledgement requires a separate trusted authority to verify one exact Host effect correlated
to the delivery, event, workflow, and human boundary. Adapter `accepted`, `completed`, process
health, or Agent narration is not effect evidence.

If the Host effect committed before Grant revocation, a late acknowledgement may converge. An
effect at or after revocation is rejected. Conflicting effect identity fails rather than being
silently reconciled.

## Code and focused verification

> `runtime/cloud-receiver/` entries describe the retired implementation. Active v2 sources are
> listed separately and remain bounded by the conformance findings in Core/09.

| Surface | Current source | Focused tests |
|---|---|---|
| Lease and acknowledgement state machine | `reentry-core/src/receiver-delivery.mjs` | receiver and store tests |
| Receiver facade and authority integration | `reentry-core/src/receiver-core.mjs` | `reentry-core/test/receiver-core.test.mjs` |
| HTTP route mapping | `reentry-core/src/cloud-receiver-http.mjs` | `reentry-core/test/cloud-receiver-http.test.mjs` |
| Outbound Connector client | `reentry-core/src/local-connector-client.mjs` | `reentry-core/test/local-connector-client.test.mjs` |
| Process and restart composition | conformance and process fixtures | separate-process and fault-matrix tests |
| Stage 1 Cloud Receiver process shell and local pairing preview | `runtime/cloud-receiver/src/` | `runtime/cloud-receiver/test/` |
| Local Connector process and credential custody preview | `runtime/local-connector/src/` | `runtime/local-connector/test/` |
| Account-first device authorization and consent targeting | `runtime/cloud-receiver/src/account-connector-control.mjs`, `account-consent-control.mjs`, and `product-flow-store.mjs` | `runtime/cloud-receiver/test/product-flow.test.mjs` |
| macOS background user service | `runtime/local-connector/src/macos-service.mjs` and `main.mjs` | `runtime/local-connector/test/macos-service.test.mjs` and `local-connector.test.mjs` |
| Active v2 pairing and disconnect | `saas-boilerplate/backend/src/modules/connectors/`; Local Connector pairing and disconnect clients | active PAIR/DISCONNECT suites and Connector v2 contract tests |
| Active v2 Claim, lease, and acknowledgement | `saas-boilerplate/backend/src/modules/deliveries/`; Prisma Delivery/Attempt state; Core outbound client | `CLAIM-001`–`005`, `ACK-001`–`005`, Connector contract tests, and `CONNECTOR-V2-E2E-001` |

## Current evidence and non-claims

Local evidence covers target isolation, claim replay, bounded reclamation, stale-worker fencing,
revocation races, effect conflicts, response loss, Receiver restart, exact HTTP mapping, and
outbound-client failure behavior. SQLite schema version 3 additionally migrates the immutable
instruction from the already stored and validated Manifest for schema versions 1 and 2. Stage 1
additionally covers one real loopback shell lifecycle,
file-backed composition, bounded readiness, graceful shutdown, and generic acknowledgement replay
after reopen. ADR-0020's local preview additionally covers browser-assisted pairing, durable hashed
pairing state, controlled pairing-store reopen, Host-user mapping, local credential-file custody,
and one outbound Connector claim and adapter handoff. CLOUD-008 additionally verifies the internal
local Codex fresh-session adapter with a fake process. CLOUD-009 additionally verifies Codex
discovery, version preflight, Node-version gating, and Host-directory validation. CLOUD-010
additionally verifies Connector-initiated account authorization, credential reuse, authenticated
device selection, bounded idle polling, graceful stop, and generated macOS LaunchAgent lifecycle.
Active v2 additionally has local Claim/ACK contract coverage and one separate-Connector-process,
separate-test-effect-worker acknowledgement/restart flow. **CONFLICTED:** its accepted five-failed-
claim pairing fence is not enforceable in current code (TASK-026). **VERIFIED OPEN:** the default
Connector `start`/`claim-once` path dispatches but never obtains effect proof or acknowledges, so the
lease can be reclaimed within the accepted three-attempt bound (TASK-029). **CONFLICTED RELEASE:**
registry Connector `0.2.20` bundles a pre-instruction Core client and rejects active v2's current
lease response; its reported `gitHead` also records package version `0.2.14`, so the artifact is not
exact-source reproducible (TASK-032). The passing separate-process run used the current checkout.
This does not prove a
production Cloud Receiver, TLS termination, production account identity, credential rotation or
recovery, production service supervision, offline catch-up, real Host-effect verifier, service
capacity, cross-machine operation, or distributed queue.

## Runtime integration obligations

A production shell must choose production device authorization, credential custody, polling or
push cadence, service identity, process supervision, upgrade, diagnostics, and operator recovery
explicitly. The local preview supplies a bounded long-running polling command and one generated
per-user macOS LaunchAgent profile; this is package and local process evidence, not production
service management. Its `doctor` command is a local preflight, not a deployment or Agent capability
check. Its normal `install` path authorizes the account once, stores a restrictive local credential,
and starts the user service; `--json` remains available for non-interactive callers. Unsupported
capability must remain visible; local development behavior is not an automatic shipping fallback.

## Reopen conditions

Reopen if the selected runtime supplies an authoritative delivery primitive with smaller semantics,
offline requirements exceed the current lease model, a real Host-effect contract changes
acknowledgement, or production evidence shows the bounded no-retry client cannot support safe
operator-controlled recovery.
