# 03 — Signed Host Event Ingress

> **Cloud Receiver v2 handoff:** This document defines the proposed v2 replacement service. Cloud
> Receiver v1 is retired and retained only as historical evidence; this is not a v1 implementation
> guide. See [ADR-0032](../Decisions/ADR-0032-retire-current-cloud-receiver-runtime.md) for the v1
> runtime disposition.

## Responsibility

Verify one Host Event and turn it into one pending delivery. Do not contact the Local Connector
from this endpoint.

## API

```http
POST /v0.1/events
Content-Type: application/json

{
  "body": "<canonical JSON event body>",
  "headers": {
    "WebMCP-Reentry-Key-Id": "host-key-1",
    "WebMCP-Reentry-Timestamp": "178...",
    "WebMCP-Reentry-Signature": "base64-ed25519-signature"
  }
}
```

The signature is Ed25519 over:

```text
<timestamp>.<body>
```

The event body must contain the event ID, correlation ID, binding ID, issuer origin, workflow,
event type, sequence, state version, timestamp, and canonical URL.

## Required behavior

1. Resolve the public key by `issuer_origin` and `key_id`.
2. Reject an invalid signature, stale timestamp, wrong origin, expired Grant, revoked binding, or
   invalid event sequence.
3. Deduplicate by `event_id`.
4. Atomically record the accepted event and create one `PENDING` delivery for the Grant's target.

Return `202 application/json`:

```json
{
  "type": "webmcp.continuation_acceptance",
  "protocol_version": "0.1",
  "event_id": "event_123",
  "correlation_id": "correlation_123",
  "accepted": true,
  "duplicate": false,
  "status": "accepted"
}
```

`202` means only “accepted and queued.” It does not mean claimed, activated, or acknowledged.

## Acceptance test

Send the same valid event twice. The first request creates one pending delivery; the second returns
an accepted duplicate without creating another delivery. No Connector request is required during
event ingestion.

## Required contract tests

| ID | Scenario | Required result |
|---|---|---|
| `EVENT-001` | Submit one valid Ed25519-signed Event for an active binding. | Return canonical `202` `webmcp.continuation_acceptance` with `accepted: true`, `duplicate: false`, and create exactly one pending delivery for the binding's fixed target. |
| `EVENT-002` | Submit the identical Event again. | Return canonical `202` with the same event/correlation identifiers and `duplicate: true`; create no second event, run consumption, or delivery. |
| `EVENT-003` | Submit an invalid signature, stale/future timestamp, wrong origin/key, unknown binding, invalid sequence, or malformed body. | Return the stable `4xx`/`410` error for that failure and leave event, Grant, and delivery state unchanged. |
| `EVENT-004` | Submit a correctly signed Event for an expired, exhausted, or revoked Grant. | Reject it before queueing with the corresponding stable Grant error; do not contact the Connector. |

The test must verify that Event ingestion is independent of Connector liveness: a stopped or
unpaired Connector does not change the `202` acceptance decision for a valid active Grant.
