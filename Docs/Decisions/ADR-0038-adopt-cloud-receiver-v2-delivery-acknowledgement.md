# ADR-0038 — Adopt Cloud Receiver v2 Delivery Acknowledgement

**Status:** Accepted for Feature 5 local v2 implementation only
**Date:** 2026-09-02
**Owners:** Cloud Receiver v2 implementation team
**Related:** ADR-0007, ADR-0008, ADR-0009, ADR-0010, ADR-0013, ADR-0036, ADR-0037, TASK-020
**Source contract:** [Feature 05 — Delivery Acknowledgement](../Cloud-Receiver-Handoff/v2-build/05-delivery-acknowledgement.md)

## Context

Feature 4 leaves one target-scoped durable Connector lease. A Connector or Agent adapter can report
progress, but neither is authority that the Host application changed. ADR-0009 therefore requires a
separate Host-effect authority before the Receiver can close a delivery. Feature 5 adds that boundary
to the Prisma/Express v2 service without changing the Core contract or inventing a public effect-token
format.

## Decision

### 1. Preserve the exact v0.1 acknowledgement route

The only route is:

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

Success is the canonical `200` response:

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

The response contains no lease, Connector, effect, Grant, binding, or Host payload.

### 2. Compose an injected effect-authority port

The v2 app composition accepts an optional `effectAuthority` with:

```text
verifyEffect({ effectToken, expected })
  -> {
       type: "webmcp.host_effect_attestation",
       protocol_version: "0.1",
       effect_id,
       delivery_id,
       event_id,
       correlation_id,
       workflow_id,
       outcome: "effect_applied_awaiting_human",
       confirmed_at
     }
```

The `expected` object contains exactly the durable delivery and Grant context required by ADR-0009:
`delivery_id`, `event_id`, `correlation_id`, `workflow_id`, `canonical_url`, `human_boundary`, and
`outcome`. The authority owns effect-token encoding and verification. The default app has no authority
and returns `501 host_effect_authority_unavailable` without mutating state; tests inject a deterministic
authority only to prove this boundary.

### 3. Require exact lease, effect, time, and state fencing

The Receiver authenticates the Connector and verifies the current lease digest for the exact delivery
before invoking the effect authority. It then verifies that the attestation matches all expected
identifiers, has the required outcome, and was confirmed at or after lease acquisition but strictly
before lease expiry, Grant expiry, and any Grant revocation. A final expired lease may converge only
when the attestation was confirmed during that final lease and no newer lease replaced its digest.

After authority verification, one PostgreSQL transaction re-reads and locks the delivery, rechecks
Connector scope, lease digest, state, effect uniqueness, and the time window, then atomically stores:

- `status = acknowledged`;
- the unique `effect_id`;
- canonical effect attestation JSON; and
- the acknowledgement timestamp.

The existing current lease digest remains for exact acknowledgement replay and final-effect fencing.
No raw effect, lease, or Connector token is persisted or logged.

### 4. Define replay and failure behavior

- An identical acknowledgement returns the stored envelope with `duplicate: true` and creates no
  second state transition.
- A different effect for an acknowledged delivery returns `409 delivery_effect_conflict`.
- A stale lease returns `403 delivery_lease_invalid`; a wrong Connector returns the existing scoped
  identity error; invalid authority output returns `403 host_effect_invalid`.
- Missing authority returns `501 host_effect_authority_unavailable`.
- Any failure before the transaction commits leaves the delivery leased or otherwise unchanged.

## Consequences

The Receiver now has a durable effect-backed close path and truthful replay behavior. Local tests can
prove the port with a fake authority, but no production Host-effect identity, token encoding, selected
application, or deployment claim is made. Public Grant inspection/revocation remains outside this
increment until the ADR-0013 public-authority decision permits it.

## Verification gate

`ACK-001`–`ACK-005` must pass through real Express and disposable PostgreSQL, including no-effect
lease retention, exact context verification, invalid/stale/revoked/future failures, acknowledgement
replay after restart, effect conflicts, and secret redaction. Earlier Pairing, Consent, Event, and
Claim matrices must remain green.

## Reopen triggers

Reopen if the route shape, effect context, time window, replay rule, status mapping, token placement,
authority ownership, Core behavior, or Local Connector protocol must change.
