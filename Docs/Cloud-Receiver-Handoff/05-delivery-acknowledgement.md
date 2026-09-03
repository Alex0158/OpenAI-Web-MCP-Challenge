# 05 — Delivery Acknowledgement

> **Cloud Receiver v2 handoff:** This document defines the proposed v2 replacement service. Cloud
> Receiver v1 is retired and retained only as historical evidence; this is not a v1 implementation
> guide. See [ADR-0032](../Decisions/ADR-0032-retire-current-cloud-receiver-runtime.md) for the v1
> runtime disposition.

## Responsibility

Close a delivery only when the current Connector lease and an independently verified Host effect
match the same delivery.

## API

```http
POST /v0.1/delivery-acknowledgements
Content-Type: application/json

{
  "connector_token": "opaque-secret",
  "delivery_id": "delivery_123",
  "lease_token": "current-lease-token",
  "effect_token": "trusted-host-effect-token"
}
```

The effect verifier must confirm the exact `delivery_id`, `event_id`, correlation, workflow, human
boundary, and valid time window. Do not treat a successful Codex process or adapter return as Host
effect evidence.

Return `200 application/json`:

```json
{
  "type": "webmcp.delivery_acknowledgement",
  "protocol_version": "0.1",
  "delivery_id": "delivery_123",
  "event_id": "event_123",
  "effect_id": "effect_123",
  "acknowledged": true,
  "duplicate": false,
  "status": "acknowledged"
}
```

## Required state rules

- Verify Connector identity, target scope, current lease, and effect authority.
- Atomically transition `LEASED -> ACKNOWLEDGED`.
- A repeated identical acknowledgement returns `duplicate: true`.
- A different effect for an already acknowledged delivery fails with a conflict.
- A stale lease token cannot acknowledge a newer lease.
- An invalid or unsupported effect authority fails visibly; never auto-acknowledge.

## Acceptance test

Verify that adapter success alone leaves the delivery leased. A valid effect token closes it. A
stale lease, wrong Connector, or mismatched effect is rejected.

## Required contract tests

| ID | Scenario | Required result |
|---|---|---|
| `ACK-001` | Claim a delivery and let the local adapter/process succeed without submitting an acknowledgement. | Delivery remains `LEASED`; process success alone is never treated as Host-effect evidence. |
| `ACK-002` | Submit a valid opaque effect token issued after the exact Host effect. | The configured effect authority verifies `delivery_id`, `event_id`, correlation, workflow, canonical URL, human boundary, outcome `effect_applied_awaiting_human`, attestation type/version, and bounded `confirmed_at`; atomically return `200` acknowledged. |
| `ACK-003` | Submit an invalid, expired, mismatched, future, post-revocation, or unsupported effect token, or a stale lease token. | Return a stable `4xx` error and leave the delivery unacknowledged; never fall back to adapter success or silently retry. |
| `ACK-004` | Replay the identical acknowledgement. | Return the same acknowledgement with `duplicate: true`; do not create a second effect or transition. |
| `ACK-005` | Acknowledge the same delivery with a different effect or wrong Connector. | Return `409` or the agreed stable conflict/identity error; preserve the original acknowledgement and audit history. |

The effect token format is intentionally opaque to the Local Connector and is owned by the Host
effect authority. The cloud test must use a configured test authority, not a hard-coded production
token or an acknowledgement bypass.
