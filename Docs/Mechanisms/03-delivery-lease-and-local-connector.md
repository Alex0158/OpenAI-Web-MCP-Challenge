# Delivery Lease and Local Connector

**Role:** CANONICAL mechanism contract  
**Status:** Core, bounded HTTP transport, and test-process behavior locally verified; production
Connector open  
**Controls:** ADR-0009, ADR-0010, and ADR-0013

## Responsibility

This module owns the boundary between accepted Receiver work and one eligible device or hosted
delivery target: target authentication, short delivery leases, bounded reclamation, stale-worker
fencing, outbound-only Connector transport, adapter dispatch handoff, and Host-effect-backed
acknowledgement.

It does not own Grant issuance, event interpretation, context selection, Agent behavior, Host
mutation, public inbound device control, pairing UX, or background scheduling policy.

## Delivery state model

```text
PENDING
-> LEASED
-> ACKNOWLEDGED

PENDING or expired LEASED
-> bounded reclaim or terminal outcome
```

Accepted event truth, delivery selection, adapter activation, Host effect, and acknowledgement are
separate facts. Queue acceptance or an adapter return never proves that the Host changed.

## Lease authority

- a trusted Connector identity resolves to one subject and delivery target;
- the Connector supplies a fresh claim token and Receiver storage retains only its digest;
- exact response-loss replay can recover the same live target-scoped lease;
- expired leases may be reclaimed only within the configured attempt bound;
- stale claim tokens and prior workers are fenced;
- Grant revocation prevents a new or replayed lease; and
- Connector and lease credentials are absent from Agent activation.

## Transport contract

The bounded Cloud Receiver adapter currently maps only event acceptance, delivery claim, and
effect-backed acknowledgement. The outbound Connector client:

- requires HTTPS except on literal loopback;
- follows no redirects;
- validates exact bounded responses;
- enforces timeout and response-size limits;
- makes one request per caller decision; and
- performs no automatic retry or claim-token substitution.

Production consent, Grant control, pairing, health, diagnostics, long polling, push transport, and
daemon lifecycle remain outside this transport kernel.

## Effect and acknowledgement

Acknowledgement requires a separate trusted authority to verify one exact Host effect correlated
to the delivery, event, workflow, and human boundary. Adapter `accepted`, `completed`, process
health, or Agent narration is not effect evidence.

If the Host effect committed before Grant revocation, a late acknowledgement may converge. An
effect at or after revocation is rejected. Conflicting effect identity fails rather than being
silently reconciled.

## Code and focused verification

| Surface | Current source | Focused tests |
|---|---|---|
| Lease and acknowledgement state machine | `reentry-core/src/receiver-delivery.mjs` | receiver and store tests |
| Receiver facade and authority integration | `reentry-core/src/receiver-core.mjs` | `reentry-core/test/receiver-core.test.mjs` |
| HTTP route mapping | `reentry-core/src/cloud-receiver-http.mjs` | `reentry-core/test/cloud-receiver-http.test.mjs` |
| Outbound Connector client | `reentry-core/src/local-connector-client.mjs` | `reentry-core/test/local-connector-client.test.mjs` |
| Process and restart composition | conformance and process fixtures | separate-process and fault-matrix tests |

## Current evidence and non-claims

Local evidence covers target isolation, claim replay, bounded reclamation, stale-worker fencing,
revocation races, effect conflicts, response loss, Receiver restart, exact HTTP mapping, and
outbound-client failure behavior. Test child processes and loopback HTTP do not prove a production
Cloud Receiver, TLS termination, durable Connector credentials, paired-device identity, supervised
daemon, offline catch-up, real Host-effect verifier, service capacity, or distributed queue.

## Runtime integration obligations

A production shell must choose pairing, credential custody, polling or push cadence, service
identity, process supervision, upgrade, diagnostics, and operator recovery explicitly. Unsupported
capability must remain visible; local development behavior is not an automatic shipping fallback.

## Reopen conditions

Reopen if the selected runtime supplies an authoritative delivery primitive with smaller semantics,
offline requirements exceed the current lease model, a real Host-effect contract changes
acknowledgement, or production evidence shows the bounded no-retry client cannot support safe
operator-controlled recovery.
