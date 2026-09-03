# Cloud Receiver v2 Test Exchange

**Status:** Receiver-owned integration-test document; local Receiver and received compatibility
results recorded, full-chain acceptance pending
**Date:** 2026-09-02
**Owner:** Cloud Receiver v2 team
**Authority:** `reentry-core/` plus accepted ADR-0007, ADR-0008, ADR-0009, ADR-0010, ADR-0036,
ADR-0037, ADR-0038, and ADR-0039
**Receiver commit exercised:** `300bce02e6a6f9b643a6de95a3596691304749b7`

## 1. Exchange status

| Direction | Test source | Counterpart state | Result against Receiver `300bce0` |
|---|---|---|---|
| Cloud Receiver → Local Connector | Claim and acknowledgement HTTP cases below | Local Connector changes are in the shared working tree; no clean committed counterpart SHA was supplied | Claim `5/5`; ACK `4/5` |
| Cloud Receiver → SDK | Event, Host/Consent, and transport expectations below | SDK working tree is not a clean exact counterpart commit; root reference is `5f71132` | SDK Event `7/7`; SDK Host/Consent `4/4` |
| Local Connector → Cloud Receiver | `runtime/local-connector/test/cloud-receiver-v2-claim.contract.mjs` and `cloud-receiver-v2-ack.contract.mjs` | Received from the shared workspace; exact Local Connector commit is pending | Claim `5/5`; ACK `4/5` |
| SDK → Cloud Receiver | `runtime/host-sdk/test/cloud-receiver-v2.event.contract.mjs` and `cloud-receiver-v2.contract.mjs` | Received from the shared workspace; exact clean SDK commit is pending | Event `7/7`; Host/Consent `4/4` |

The Receiver team changed only `saas-boilerplate/`. No Local Connector, SDK, Core, retired v1, public
Grant, deployment, or fallback implementation was changed.

The Local Connector ACK failure is an authority conflict, not a Receiver compatibility opportunity:
`CONNECTOR-V2-ACK-003` expects future proof timestamps to return `host_effect_time_invalid`, while
the authoritative Core implementation maps that normalization failure to `host_effect_invalid`.
The Receiver follows Core. The project manager must resolve the contract before either team changes
code or tests.

## 2. Exact requests and success responses

All protocol request and response bodies below are canonical JSON. Angle-bracket values are
placeholders only; no credential or raw token belongs in a document, log, or committed fixture.

### 2.1 Host SDK → Event ingress

```http
POST /v0.1/events
Accept: application/json
Content-Type: application/json

{
  "body": "<canonical-json-continuation-event>",
  "headers": {
    "WebMCP-Reentry-Key-Id": "<host-key-id>",
    "WebMCP-Reentry-Timestamp": "<epoch-seconds>",
    "WebMCP-Reentry-Signature": "<base64url-ed25519-signature>"
  }
}
```

The signature covers the exact UTF-8 bytes `<timestamp>.<body>`. There is no organization bearer
on this route. First acceptance is `202`:

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

An identical Event returns the same envelope with `duplicate: true`. The acceptance contains no
delivery, lease, effect, acknowledgement, Connector, Grant, or private binding value. Before the
`202`, PostgreSQL durably stores one Event, one pending Delivery, and the Grant run reservation.

### 2.2 Local Connector → delivery claim

```http
POST /v0.1/delivery-claims
Accept: application/json
Content-Type: application/json

{
  "connector_token": "<opaque-connector-token>",
  "claim_token": "<32-byte-base64url-claim-token>"
}
```

Work returns `200` with `{ "duplicate": false, "lease": <lease> }`. The lease contains the exact
Core continuation/receipt fields and returns the submitted claim token as `lease_token`. A live
replay by the owning Connector returns the same lease with `duplicate: true` and no new attempt.

No work and an exhausted delivery both return exactly:

```http
204 No Content
Cache-Control: no-store
Pragma: no-cache
X-Content-Type-Options: nosniff
Content-Length: 0
```

The body is empty and `Content-Type` is absent. A fresh-token wrong-target claim has this same
response. Reusing a claim token from another Connector is not a wrong-target test; it is a scope
error.

### 2.3 Local Connector → acknowledgement

```http
POST /v0.1/delivery-acknowledgements
Accept: application/json
Content-Type: application/json

{
  "connector_token": "<opaque-connector-token>",
  "delivery_id": "delivery_123",
  "lease_token": "<current-or-final-lease-token>",
  "effect_token": "<opaque-host-effect-token>"
}
```

The Receiver sends the opaque effect token and exact stored context to its configured authority:

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

The authority must return exactly one normalized attestation shape:

```json
{
  "type": "webmcp.host_effect_attestation",
  "protocol_version": "0.1",
  "effect_id": "effect_123",
  "delivery_id": "delivery_123",
  "event_id": "event_123",
  "correlation_id": "correlation_123",
  "workflow_id": "workflow_123",
  "outcome": "effect_applied_awaiting_human",
  "confirmed_at": "<canonical-iso-timestamp>"
}
```

Success is the exact canonical `200` envelope:

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

An identical replay returns `duplicate: true`. A different effect conflicts; no acknowledgement
route returns a raw effect token or lease token.

### 2.4 Transport and operations

| Request | Success or failure |
|---|---|
| `GET /healthz` | `200 {"status":"ok"}` |
| `GET /readyz` with PostgreSQL available | `200 {"status":"ready"}` |
| `GET /readyz` with PostgreSQL unavailable | `503 {"error":{"code":"receiver_not_ready"}}` |
| Known v0.1 route with non-POST method | `405`, `Allow: POST`, `http_method_not_allowed` |
| Unknown v0.1 route | `404`, `http_route_not_found` |
| Malformed JSON | `400`, `http_body_invalid` |
| Body larger than 16 KiB | `413`, `http_body_too_large` |
| Non-JSON or encoded request | `415`, `http_content_type_invalid` |
| PostgreSQL transaction timeout/deadlock | `503`, `receiver_busy`, `Retry-After: 1` |
| Unexpected v0.1 failure | `500`, `receiver_internal_error` |

Every v0.1 JSON response is canonical, no-store, no-cache, no-sniff, and at most 32 KiB. No route
redirects.

## 3. Stable errors and replay assertions

| Boundary | Error | Status | Required no-mutation/replay assertion |
|---|---|---:|---|
| Event | `event_signature_invalid` | `401` | No Event, Delivery, or Grant-run mutation |
| Event | `grant_expired` / `grant_revoked` | `410` / `422` | Grant and run budget unchanged |
| Event | `event_origin_mismatch` / `event_sequence_invalid` | `422` | No Event or Delivery |
| Claim | `connector_identity_invalid` | `403` | No delivery state change |
| Claim | `claim_token_retired` | `409` | No new attempt or lease |
| Claim | `delivery_lease_scope_invalid` | `403` | No cross-Connector disclosure |
| Acknowledgement | `delivery_lease_invalid` | `403` | Current/newer lease remains authoritative |
| Acknowledgement | `host_effect_invalid` | `403` | Delivery remains unacknowledged |
| Acknowledgement | `host_effect_time_invalid` | `403` | Delivery remains unacknowledged |
| Acknowledgement | `host_effect_authority_unavailable` | `501` | No adapter-success fallback or mutation |
| Acknowledgement | `delivery_effect_conflict` | `409` | Original effect remains authoritative |
| Acknowledgement | `effect_identity_conflict` | `409` | Neither delivery is overwritten |

The current profile is maximum `3` attempts, `60-second` leases, `5-second` Connector polling, and
`5-second` delivery request timeout. A Host effect must be confirmed after lease acquisition and
strictly before lease expiry, Grant expiry, and revocation, with Core's bounded future skew.

## 4. Durable PostgreSQL assertions

After a valid combined flow, direct test-only inspection must show:

1. one accepted Event for the Event ID;
2. one Grant run reservation (`runs_remaining` consumed once);
3. one Delivery linked to Event, Grant, binding, workflow, and delivery target;
4. one `DeliveryAttempt` for the successful lease;
5. state progression `pending` → `leased` → `acknowledged` only after Host-effect verification;
6. a unique `effect_id`, canonical effect attestation, and `acknowledged_at` on the Delivery row;
7. identical acknowledgement replay creates no new attempt, effect, row, or transition;
8. invalid signature, origin, Grant, claim, lease, authority, and effect cases leave durable state
   unchanged; and
9. raw Connector, claim, lease, effect, consent, session, and organization bearer values are absent
   from Receiver database values and logs (only digests or canonical non-secret attestations remain).

The current Receiver implementation also preserves Core's internal `cancelled` state for pending
deliveries whose Grant authority has ended; it remains indistinguishable from no work on the claim
wire.

## 5. Secret boundaries

| Value | Allowed owner/path | Never appears in |
|---|---|---|
| Connector token | Local Connector → Receiver claim/ack JSON | lease/receipt, logs, database plaintext, SDK/browser payload |
| Claim/lease token | Connector-generated request; current lease replay | database plaintext, logs, effect attestation, SDK payload |
| Effect token | Host-effect authority input only | claim response, continuation context, response, logs, Receiver database |
| Organization API key | SDK control routes only | Event/Claim/Ack requests, logs, browser, database plaintext |
| Consent/session token | Re-entry browser decision URL only | SDK result fields, logs, database plaintext |
| Private binding/target identifiers | Receiver internal durable joins | public SDK/Connector responses, logs |

Failed requests return only `{ "error": { "code": "..." } }`. Unexpected v0.1 logs contain only
bounded route/status/event/code fields.

## 6. Commands and received results

Receiver local aggregate:

```sh
DATABASE_URL=postgresql://mac@127.0.0.1:55434/cloud_receiver_feature5 \
DIRECT_URL=postgresql://mac@127.0.0.1:55434/cloud_receiver_feature5 \
CLOUD_RECEIVER_RUNTIME_DATABASE_URL= NODE_ENV=test \
npm test -w backend -- --runInBand
```

Result: `10/10` suites and `41/41` tests passed on Receiver commit
`300bce02e6a6f9b643a6de95a3596691304749b7`.

Receiver closure readback: `git status --short` was empty; live `git ls-remote origin
refs/heads/main` returned `b851c320fae0505e3cf098f979d149e04ab44310`, so the tested Receiver commit
is local-only and three commits ahead of `origin/main`.

Received SDK tests, executed without editing SDK files:

```sh
CLOUD_RECEIVER_V2_ROOT=/Users/mac/Desktop/OpenAI-Web-MCP-Challenge/saas-boilerplate \
CLOUD_RECEIVER_V2_EVENT_CONTRACT=1 \
DATABASE_URL=postgresql://mac@127.0.0.1:55434/cloud_receiver_feature5 \
DIRECT_URL=postgresql://mac@127.0.0.1:55434/cloud_receiver_feature5 \
CLOUD_RECEIVER_RUNTIME_DATABASE_URL= NODE_ENV=test \
node --test runtime/host-sdk/test/cloud-receiver-v2.event.contract.mjs
```

Result: `SDK-V2-EVENT-001`–`007`, `7/7` passed. The Host/Consent suite passed `4/4`.

Received Local Connector tests, executed without editing Local Connector files:

```sh
CLOUD_RECEIVER_V2_ROOT=/Users/mac/Desktop/OpenAI-Web-MCP-Challenge/saas-boilerplate \
CLOUD_RECEIVER_V2_CLAIM_CONTRACT=1 \
DATABASE_URL=postgresql://mac@127.0.0.1:55434/cloud_receiver_feature5 \
DIRECT_URL=postgresql://mac@127.0.0.1:55434/cloud_receiver_feature5 \
CLOUD_RECEIVER_RUNTIME_DATABASE_URL= NODE_ENV=test \
node --test runtime/local-connector/test/cloud-receiver-v2-claim.test.mjs
```

Result: `CONNECTOR-V2-CLAIM-001`–`005`, `5/5` passed. The received ACK command used the same
database and exact Receiver commit; `CONNECTOR-V2-ACK-001`, `002`, `004`, and `005` passed, while
`003` stopped at the Core mapping conflict recorded above.

## 7. Combined test gate

The required combined path is:

```text
Host SDK → Cloud Receiver → Local Connector → Host effect → acknowledgement
```

It is **not claimed as passed**. The current blocker is the unresolved future-effect error mapping
in the received Local Connector ACK contract, compounded by the absence of a clean exact Local
Connector counterpart commit and a production Host-effect authority. The project manager must
resolve that authority boundary and provide exact counterpart SHAs before this document can be
promoted to full-chain verified. No Event, delivery, acknowledgement, public Grant, or deployment
claim should be inferred from the separate passing matrices.
