# TASK-020: Build Cloud Receiver v2 Delivery Acknowledgement

**Status:** `closed` — Feature 5 locally verified at Receiver commit `300bce02e6a6f9b643a6de95a3596691304749b7`
**Owner:** Cloud Receiver v2 acknowledgement and Host-effect authority boundary
**Profile:** Assured
**Scope:** `saas-boilerplate/` only, plus this Task, its ADR, evidence, and integration-test document
**Authority:** [ADR-0038](../Decisions/ADR-0038-adopt-cloud-receiver-v2-delivery-acknowledgement.md)
**Source contract:** [Feature 05 — Delivery Acknowledgement](../Cloud-Receiver-Handoff/v2-build/05-delivery-acknowledgement.md)

## Task Control

- Type: `implementation`
- Lifecycle: `closed`
- Priority: `P0`
- Owner: Cloud Receiver v2 implementation team.
- Current increment: Add effect-backed acknowledgement to the already-green durable delivery lease;
  complete.
- Next gate: Project-manager resolution of the received Local Connector future-effect error mapping
  and a clean counterpart commit; no Receiver compatibility mapping is authorized by that mismatch.
- Dependencies: [ADR-0009](../Decisions/ADR-0009-freeze-connector-lease-and-effect-acknowledgement.md),
  [ADR-0010](../Decisions/ADR-0010-freeze-receiver-http-and-connector-transport.md),
  [ADR-0037](../Decisions/ADR-0037-adopt-cloud-receiver-v2-delivery-claim.md), and
  [TASK-019](TASK-019-build-cloud-receiver-v2-delivery-claim.md).

## Objective

Implement `POST /v0.1/delivery-acknowledgements` so a delivery closes only when the current
Connector lease and a separately verified Host-effect attestation match the same durable delivery.
Preserve exact replay, stale-lease fencing, revocation time ordering, and digest-only secret storage.

## Accepted boundary

- Request fields are exactly `connector_token`, `delivery_id`, `lease_token`, and `effect_token`.
- Success is the exact `200` `webmcp.delivery_acknowledgement` envelope from ADR-0009.
- The configured authority receives an opaque effect token and exact expected delivery context; the
  Receiver stores only the canonical attestation, never the token.
- A missing effect authority fails visibly with `501 host_effect_authority_unavailable` and does not
  mutate delivery state. The local test authority is evidence scaffolding, not a production effect
  verifier or token-format decision.
- Identical acknowledgement replay returns the stored result with `duplicate: true`; another effect,
  Connector, lease, or context is rejected without overwriting the original acknowledgement.
- No Acknowledgement fallback, adapter-success inference, public Grant route, Core change, Local
  Connector production change, Agent activation, or deployment claim is included.

## Acceptance gates

- `ACK-001`–`ACK-005` pass through the real v2 HTTP handler and disposable PostgreSQL.
- The database preserves the lease when no effect evidence is supplied, stores one exact attestation
  and effect ID on success, and preserves it across app restart and replay.
- Invalid, expired, mismatched, future, post-revocation, unsupported, stale, and wrong-Connector
  acknowledgements leave durable state unchanged.
- Pairing, Consent/Targeting, Event, and Delivery Claim regressions remain green.
- Raw Connector, lease, and effect tokens are absent from responses, logs, and database values.

## 4. Non-goals

Do not implement public Grant inspection/revocation, a production Host-effect adapter, Agent or
Browser activation, acknowledgement retries, transport fallback, or deployment.

## 5. Verification and closure

Detailed commands, runtime, database, authority fixture, results, and integration requests are in
[CLOUD-018](../Development/CLOUD-018-cloud-receiver-v2-delivery-acknowledgement.md). The Receiver
focused gate passed `ACK-001`–`ACK-005` (`5/5`) through real Express and disposable PostgreSQL.
The received Local Connector ACK contract passed `4/5` because its future-effect expected code
conflicts with the authoritative Core mapping; the mismatch is recorded and not hidden by a
compatibility branch.

## 6. Reopen condition

Reopen if the effect authority requires a different expected context, token placement, status, or
replay rule.
