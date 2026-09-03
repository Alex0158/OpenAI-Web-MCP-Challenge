# Feature 05 — Delivery Acknowledgement

**Build gate:** `ACK-001`–`ACK-005`

**Owner:** Cloud Receiver v2 acknowledgement and Host-effect authority boundary

**Compatibility source:** [Local Connector handoff 05](../05-delivery-acknowledgement.md) and [answers](../07-open-questions-for-cloud-receiver-team.md)

## Goal

Close a delivery only when the current Connector lease and an independently verified Host effect
refer to the exact same delivery. Local adapter or Codex success alone never acknowledges work.

## Wire contract

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

Return `200`:

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

The effect token is opaque to the Connector and is not included in the claim response or Agent
activation context. A trusted Host/local integration supplies it separately to the acknowledgement
caller.

## Effect authority boundary

The Receiver must be configured with an effect-authority port. The exact method name is an internal
implementation choice, but its observable contract is:

```text
verify(effect_token, expected_delivery_context)
  -> attestation(type, protocol_version, effect_id, delivery_id, event_id,
                 correlation_id, workflow_id, outcome, confirmed_at)
```

The verifier must bind and validate:

- `delivery_id`, `event_id`, `correlation_id`, and `workflow_id`;
- the delivery's `canonical_url` and `human_boundary`;
- outcome `effect_applied_awaiting_human`;
- attestation type and protocol version;
- unique `effect_id`;
- `confirmed_at` after lease acquisition, before lease and Grant expiry, before revocation, and not
  materially in the future.

The token's encoding remains owned by the Host effect authority. Do not invent a public token
format. If no verifier is configured, return a visible unsupported/authority error and leave the
delivery leased.

## State and transaction rules

1. Verify Connector identity and fixed target.
2. Verify the current lease token for the exact delivery; a stale lease cannot acknowledge a newer
   lease.
3. Ask the configured effect authority to verify the opaque effect token against the exact stored
   context.
4. Atomically transition `LEASED -> ACKNOWLEDGED` and persist the attestation.
5. Replay of the identical acknowledgement returns the same result with `duplicate: true`.
6. A different effect, wrong Connector, expired lease, or mismatched context returns a stable
   conflict/identity/authority error and does not overwrite the original acknowledgement.
7. A pre-revocation effect may converge only when its confirmation time is before revocation.

## Minimal data design

- current delivery state and lease digest;
- immutable acknowledgement/effect reference;
- unique `effect_id` and optionally a unique `(delivery_id, effect_id)` constraint;
- attestation context and confirmation time sufficient for audit and replay;
- no raw Connector, lease, or effect token.

The lease check, effect verification result, and state transition must be one recoverable operation.
The authority call may be outside the database transaction if the implementation has an explicit
idempotent boundary and cannot acknowledge when persistence fails.

## Red tests

| ID | Arrange and act | Required assertion |
|---|---|---|
| `ACK-001` | Claim a delivery and let the adapter/process succeed without posting an acknowledgement. | Delivery remains `LEASED`; process success is not Host-effect evidence. |
| `ACK-002` | Post a valid effect token from the configured test authority after the exact Host effect. | Authority verifies all context fields and bounded time; one atomic `200` acknowledgement; attestation persists. |
| `ACK-003` | Post invalid, expired, mismatched, future, post-revocation, unsupported effect, or stale lease. | Stable `4xx`; delivery remains unacknowledged; no adapter-success fallback or silent retry. |
| `ACK-004` | Replay the identical acknowledgement. | Same acknowledgement with `duplicate: true`; no second effect or state transition. |
| `ACK-005` | Acknowledge with a different effect or wrong Connector. | `409` or agreed identity/conflict error; original acknowledgement and audit history remain. |

Use a configured fake authority, not a hard-coded token or bypass. Inspect durable state after each
authority and lease failure.

## Green implementation order

1. Add the injected effect-authority port and a test implementation.
2. Add exact Connector/target/current-lease checks.
3. Add expected-context construction from durable delivery/Grant/Event facts.
4. Add effect verification and time/revocation checks.
5. Add atomic acknowledgement and attestation persistence.
6. Add identical replay and different-effect conflict behavior.
7. Add visible unsupported-authority errors and secret-free logging.

## Refactor checklist

- Keep the effect token out of continuation and Agent activation payloads.
- Keep the effect authority independent from the Local Connector process.
- Test restart and replay after an acknowledgement has been persisted.
- Test confirmation exactly before and after revocation cutoff.
- Re-run all previous feature matrices after changing delivery or Grant state code.

## Exit condition

Do not close the core implementation until all five Acknowledgement cases pass and the configured
authority proves exact context binding. The public effect-token format remains owned by that
authority, not by the Connector.

