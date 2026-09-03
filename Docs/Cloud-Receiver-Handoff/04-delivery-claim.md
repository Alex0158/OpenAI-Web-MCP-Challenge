# 04 — Delivery Claim and Lease

> **Cloud Receiver v2 handoff:** This document defines the proposed v2 replacement service. Cloud
> Receiver v1 is retired and retained only as historical evidence; this is not a v1 implementation
> guide. See [ADR-0032](../Decisions/ADR-0032-retire-current-cloud-receiver-runtime.md) for the v1
> runtime disposition.

## Responsibility

Let an authenticated Local Connector claim at most one eligible delivery with a short lease.

## API

```http
POST /v0.1/delivery-claims
Content-Type: application/json

{
  "connector_token": "opaque-secret",
  "claim_token": "32-byte-base64url-idempotency-token"
}
```

### No work

Return exactly `204 No Content` with an empty body and no `Content-Type` header.

### Work available

Return `200 application/json`:

```json
{
  "duplicate": false,
  "lease": {
    "type": "webmcp.delivery_lease",
    "protocol_version": "0.1",
    "delivery_id": "delivery_123",
    "event_id": "event_123",
    "attempt": 1,
    "lease_token": "same-as-claim-token",
    "lease_expires_at": "2026-09-02T12:01:00.000Z",
    "continuation": {
      "correlation_id": "correlation_123",
      "workflow_id": "checkout",
      "event_type": "payment_authorized",
      "event_sequence": 1,
      "state_version": 4,
      "occurred_at": "2026-09-02T12:00:00.000Z",
      "canonical_url": "https://host.example/checkout"
    },
    "receipt": {
      "type": "webmcp.continuation_receipt",
      "protocol_version": "0.1",
      "grant_id": "grant_123",
      "correlation_id": "correlation_123",
      "issuer_origin": "https://host.example",
      "workflow_id": "checkout",
      "event_type": "payment_authorized",
      "canonical_url": "https://host.example/checkout",
      "expires_at": "2026-09-02T12:05:00.000Z",
      "human_boundary": "stop before final submission",
      "continuation_mode": "open_canonical_page_read_current_state"
    }
  }
}
```

## Required state rules

- Verify the Connector token and resolve its fixed `delivery_target_id`.
- Claim atomically: `PENDING -> LEASED`.
- Store only the digest of `claim_token`.
- If the same claim token is replayed while its lease is live, return the same lease with
  `duplicate: true`.
- Do not issue a second live lease for the same target.
- Reclaim expired leases only within a bounded attempt limit.
- Do not put Connector tokens, lease tokens, or private binding data in the continuation prompt.

The current client requires canonical JSON, protocol `0.1`, a future lease expiry, and a lease expiry
no later than the receipt expiry.

## Acceptance test

Create one pending delivery, claim it twice with the same token, and confirm that only one lease and
one attempt exist. Claim with a different Connector and confirm that the delivery is not exposed.

## Required contract tests

| ID | Scenario | Required result |
|---|---|---|
| `CLAIM-001` | A valid Connector posts exactly `connector_token` and `claim_token`. | For work, return canonical `200` with one lease; for no work, return empty `204` with no `Content-Type`. Never require an organization bearer or browser cookie. |
| `CLAIM-002` | Replay the same claim token while its lease is live. | Return the same lease with `duplicate: true`; keep one delivery, one live lease, and one attempt. The returned `lease_token` must equal the submitted claim token. |
| `CLAIM-003` | Claim with a valid Connector bound to another target, or with an invalid Connector token. | The other target sees no delivery (`204` when identity is valid); invalid identity receives `401`/`403` with `connector_identity_invalid`. Neither path exposes receipt/binding data or mutates the delivery. |
| `CLAIM-004` | Let a lease expire and claim again within the retry limit; then exceed the limit. | Reclaim atomically with an incremented attempt only within the configured bound; after the bound, return the stable exhaustion/claim error and never create an unbounded lease loop. |
| `CLAIM-005` | Return a successful lease with boundary timestamps and receipt fields. | `lease_expires_at` is in the future and no later than receipt/Grant/Connector expiry; continuation and receipt identifiers agree exactly; response is canonical JSON and contains no Connector or private binding secret. |

The cloud test should inspect durable state after each race/replay case, not infer correctness from
the HTTP status alone.
