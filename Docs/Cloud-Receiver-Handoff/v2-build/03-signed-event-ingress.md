# Feature 03 — Signed Host Event Ingress

**Build gate:** `EVENT-001`–`EVENT-004`

**Owner:** Cloud Receiver v2 event verification and enqueue boundary

**Compatibility source:** [Local Connector handoff 03](../03-signed-event-ingress.md)

## Goal

Accept one valid signed Host Event, verify it against an active Grant, and atomically create one
pending delivery for that Grant's fixed target. Event ingestion must not call or depend on the
Connector being online.

## Wire contract

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

The signature is Ed25519 over the exact bytes:

```text
<timestamp>.<body>
```

The canonical body includes at least `event_id`, `correlation_id`, `binding_id`, `issuer_origin`,
`workflow`, `event_type`, `sequence`, `state_version`, `timestamp`, and `canonical_url`.

For a first accepted Event return `202`:

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

`202` means accepted and queued only. It does not mean claimed, activated, or acknowledged.

## Validation order

1. Validate content type, body size, outer fields, and canonical body shape.
2. Resolve the Host public key by `issuer_origin` and `key_id`.
3. Validate timestamp freshness and Ed25519 signature over the exact canonical bytes.
4. Resolve the opaque binding and active Grant.
5. Verify expected origin, Grant expiry/revocation/exhaustion, event sequence, and state version.
6. Deduplicate by `event_id`.
7. In one transaction, record the accepted Event and create exactly one `PENDING` delivery for the
   Grant target.

Do not contact the Connector during this route. A stopped or unpaired Connector must not change
the acceptance decision for a valid active Grant.

## Minimal data design

- `events`: unique event id, correlation id, binding/Grant id, issuer origin, workflow, event type,
  sequence, state version, event timestamp, canonical URL, accepted timestamp, and duplicate-safe
  receipt metadata;
- `deliveries`: one row linked to the Event, Grant, and target with initial state `PENDING`;
- unique constraint on `event_id`;
- transaction boundary covering the first Event insert and first delivery insert.

Retain enough redacted event metadata for audit and replay. Do not persist raw signatures or expose
private binding data in Connector prompts unless the Core contract explicitly requires it.

## Red tests

| ID | Arrange and act | Required assertion |
|---|---|---|
| `EVENT-001` | Submit one valid signed Event for an active binding. | Canonical `202`, `accepted: true`, `duplicate: false`; exactly one Event and one pending delivery for the fixed target. |
| `EVENT-002` | Submit the identical signed Event again. | Canonical `202`, same identifiers, `duplicate: true`; no second Event, delivery, or run consumption. |
| `EVENT-003` | Submit invalid signature, stale/future timestamp, wrong origin/key, unknown binding, bad sequence, or malformed body. | Stable `4xx`/`410`; no Event, Grant, or delivery mutation. |
| `EVENT-004` | Submit a validly signed Event for expired, exhausted, or revoked Grant. | Corresponding stable Grant error before queueing; no Connector request and no delivery. |

Use a stopped Connector fixture for `EVENT-001` to prove ingress independence. Inspect durable rows
after each invalid and duplicate case.

## Green implementation order

1. Add canonical JSON and signature verification using the existing Core contract.
2. Add Host key/origin lookup and timestamp policy.
3. Add binding/Grant state and sequence validation.
4. Add event-id uniqueness and duplicate response behavior.
5. Add the atomic Event-plus-delivery transaction.
6. Add stable error mapping and redacted audit projection.

## Refactor checklist

- Preserve exact outer request fields and signature input bytes.
- Keep verification and enqueue in one transaction after all authority checks.
- Make deduplication safe across process restart and concurrent identical requests.
- Confirm Connector liveness is not consulted during Event acceptance.
- Re-run Pairing and Consent/Targeting matrices after changing Grant or Event indexes.

## Exit condition

Do not start Delivery Claim until all four Event cases pass, including concurrent/duplicate
submission and persistence restart checks.

