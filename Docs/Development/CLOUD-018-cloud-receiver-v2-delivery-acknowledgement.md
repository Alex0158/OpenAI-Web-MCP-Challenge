# CLOUD-018 — Cloud Receiver v2 Delivery Acknowledgement

**Status:** `locally_verified` — Receiver Feature 5 complete; counterpart ACK contract has one
authority-mapping blocker
**Date:** 2026-09-02
**Owner:** Cloud Receiver v2 implementation team
**Scope:** `saas-boilerplate/` only; no Core, Local Connector, SDK, public Grant, or deployment change
**Task:** [TASK-020](../Tasks/TASK-020-build-cloud-receiver-v2-delivery-acknowledgement.md)
**Decision:** [ADR-0038](../Decisions/ADR-0038-adopt-cloud-receiver-v2-delivery-acknowledgement.md)
**Contract:** [Feature 05 — Delivery Acknowledgement](../Cloud-Receiver-Handoff/v2-build/05-delivery-acknowledgement.md)
**Exchange:** [Cloud Receiver v2 test exchange](../Cloud-Receiver-Handoff/v2-build/09-cloud-receiver-test-exchange.md)

## Outcome

Feature 5 adds the only acknowledgement route:

```http
POST /v0.1/delivery-acknowledgements
Content-Type: application/json

{
  "connector_token": "<opaque-connector-token>",
  "delivery_id": "delivery_123",
  "lease_token": "<current-32-byte-base64url-token>",
  "effect_token": "<opaque-host-effect-token>"
}
```

The request schema is strict and contains exactly these four fields. `delivery_id` is a bounded
Core identifier; `lease_token` is the canonical 32-byte base64url form; Connector and effect values
are printable opaque values owned by their respective authorities.

Successful acknowledgement returns canonical `200` JSON with exactly:

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

An identical replay returns the same envelope with only `duplicate: true`. It does not create a
second attempt, effect, or state transition.

## Implementation

- Added nullable `effect_id`, `effect_attestation_json`, and `acknowledged_at` columns to the
  durable Prisma `Delivery` row; `effect_id` is unique.
- Added migration
  `backend/prisma/migrations/20260902050000_delivery_acknowledgement/migration.sql`.
- Added an injected `EffectAuthority.verifyEffect({ effectToken, expected })` port. The exact
  expected context is:

  ```json
  {
    "delivery_id": "delivery_123",
    "event_id": "event_123",
    "correlation_id": "correlation_123",
    "workflow_id": "workflow_123",
    "canonical_url": "https://host.example/workflows/123",
    "human_boundary": "explicit_receiver_consent",
    "outcome": "effect_applied_awaiting_human"
  }
  ```

- Normalized attestations must contain exactly `type`, `protocol_version`, `effect_id`,
  `delivery_id`, `event_id`, `correlation_id`, `workflow_id`, `outcome`, and `confirmed_at`.
- The Receiver accepts a final lease proof only when confirmation is at or after lease acquisition,
  strictly before lease expiry, Grant expiry, and revocation; future confirmation is bounded by
  the Core 60-second skew rule.
- The database transaction re-reads the delivery, rechecks Connector scope and current lease
  digest, fences effect identity, and atomically transitions `leased` or `retry_exhausted` to
  `acknowledged`.
- Pending authority loss remains durably representable as `cancelled` in alignment with the Core;
  this does not add a wire response or route.
- A missing effect authority returns `501 host_effect_authority_unavailable` without mutation.

## Stable errors and state behavior

| Situation | Status | Response code | Durable result |
|---|---:|---|---|
| Strict request/body failure | `400` | `http_body_invalid` | No lookup or mutation |
| Unknown delivery | `404` | `delivery_not_found` | Unchanged |
| Wrong Connector scope | `403` | `connector_delivery_scope_invalid` | Unchanged |
| Invalid Connector identity | `403` | `connector_identity_invalid` | Unchanged |
| Stale or mismatched lease | `403` | `delivery_lease_invalid` | Unchanged |
| Invalid authority proof | `403` | `host_effect_invalid` | Unchanged |
| Effect outside lease/Grant/revocation window | `403` | `host_effect_time_invalid` | Unchanged |
| Missing effect authority | `501` | `host_effect_authority_unavailable` | Unchanged |
| Different effect after acknowledgement | `409` | `delivery_effect_conflict` | Original proof remains |
| Effect identity owned by another delivery | `409` | `effect_identity_conflict` | Neither delivery overwritten |
| Concurrent acknowledgement loses CAS | `409` | `delivery_acknowledgement_race` | No partial transition |

The adapter's successful activation result is not acknowledgement evidence. Only the separately
verified Host-effect proof can close a delivery.

## Red phase

The five red tests were added at:

[`backend/src/modules/acknowledgements/test/acknowledgement.test.ts`](https://github.com/4xeoz/saas-boilerplate/blob/498bd18a92b488b440ccd2e3b00f55362cb4d443/backend/src/modules/acknowledgements/test/acknowledgement.test.ts)

Command against the pre-Feature-5 Receiver:

```sh
DATABASE_URL=postgresql://mac@127.0.0.1:55433/cloud_receiver_feature4_rerun \
CLOUD_RECEIVER_RUNTIME_DATABASE_URL= DIRECT_URL= NODE_ENV=test \
npm test -w backend -- --runInBand \
  src/modules/acknowledgements/test/acknowledgement.test.ts
```

Result: `1` suite failed; `ACK-001` passed its existing lease assertion, while `ACK-002`–`ACK-005`
received the absent-route `404` instead of acknowledgement behavior. This was a valid red baseline,
not a database or test-harness failure.

## Green verification

Disposable database:

- PostgreSQL `14.18` on `127.0.0.1:55434`;
- database `cloud_receiver_feature5`;
- all six Prisma migrations applied, including the acknowledgement migration;
- cluster stopped after the verification run.

Focused command:

```sh
DATABASE_URL=postgresql://mac@127.0.0.1:55434/cloud_receiver_feature5 \
DIRECT_URL=postgresql://mac@127.0.0.1:55434/cloud_receiver_feature5 \
CLOUD_RECEIVER_RUNTIME_DATABASE_URL= NODE_ENV=test \
npm test -w backend -- --runInBand \
  src/modules/acknowledgements/test/acknowledgement.test.ts
```

Result: `ACK-001`–`ACK-005` passed, `5/5` tests, `1/1` suite.

The focused tests prove no-ack lease retention, exact authority context, invalid/future/
post-revocation/stale/unsupported rejection, restart replay, effect conflict, wrong Connector
scope, durable attestation state, and raw-secret redaction.

Feature 4 regressions passed `10/10` tests across the Claim and delivery suites. The complete
Receiver backend aggregate passed `10/10` suites and `41/41` tests after the final Feature 6
changes. Prisma generation, backend type-check, backend build, and `git diff --check` passed.

## Runtime, commit, and remote state

- Runtime executed: Node `v26.8.1`, npm `11.19.0`, Prisma `7.10.0`.
- Reproducible project baseline: Node 24; this record names the actual Node 26 runtime used.
- Tested Receiver commit: `300bce02e6a6f9b643a6de95a3596691304749b7`.
- Receiver worktree: clean on local `main`.
- Live command `git ls-remote origin refs/heads/main` returned
  `b851c320fae0505e3cf098f979d149e04ab44310`; the Feature 5/6 commit is local and not pushed.

## Secret and authority boundary

The Receiver never persists or emits the raw Connector token, lease token, or effect token. The
effect authority receives the opaque token only through its injected verification port. The Receiver
stores only a canonical attestation and effect identifier; responses, logs, and error bodies contain
no bearer values, private bindings, cookies, SQL, connection strings, or stack traces.

Production Host-effect authority selection, token encoding, Agent activation, deployment, public
Grant inspection/revocation, and the final cross-process full-chain test remain outside this local
closure.

## Counterpart blocker

The received Local Connector ACK suite passed `4/5`. Its `CONNECTOR-V2-ACK-003` expects a future
attestation to return `host_effect_time_invalid`. The authoritative Core implementation normalizes
future attestations inside effect verification and maps them to `host_effect_invalid`; the Receiver
matches Core and its own focused test. This is a contract/authority conflict, so no compatibility
mapping or test weakening was added. Project-manager resolution is required before the counterpart
ACK gate can close.
