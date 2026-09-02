# SDK-005 — Cloud Receiver v2 Full Host-to-Acknowledgement Contract

**Status:** `verification_pending` — SDK Host/Event/Claim gates pass against exact Cloud `300bce02`; Cloud Feature 5/6 tests pass `10/10`; received Acknowledgement is `4/5` because ACK-003 has an error-code mismatch; combined flow remains open
**Date:** 2026-09-02
**Owner:** SDK development team
**Task:** [TASK-022](../Tasks/TASK-022-prepare-sdk-v2-full-chain-integration.md)
**Authority:** [ADR-0007](../Decisions/ADR-0007-freeze-reentry-core-v0.1-contract-kernel.md), [ADR-0009](../Decisions/ADR-0009-freeze-connector-lease-and-effect-acknowledgement.md), [ADR-0010](../Decisions/ADR-0010-freeze-receiver-http-and-connector-transport.md), [ADR-0013](../Decisions/ADR-0013-freeze-receiver-grant-control-and-revocation.md), [ADR-0036](../Decisions/ADR-0036-adopt-cloud-receiver-v2-signed-event-ingress.md), [ADR-0037](../Decisions/ADR-0037-adopt-cloud-receiver-v2-delivery-claim.md), [ADR-0038](../Decisions/ADR-0038-adopt-cloud-receiver-v2-delivery-acknowledgement.md), and [ADR-0039](../Decisions/ADR-0039-adopt-cloud-receiver-v2-transport-operations.md)
**Source contracts:** [SDK to Cloud Receiver v2 integration map](../Cloud-Receiver-Handoff/v2-build/08-sdk-cloud-receiver-integration.md), [Feature 04](../Cloud-Receiver-Handoff/v2-build/04-delivery-claim-and-lease.md), [Feature 05](../Cloud-Receiver-Handoff/v2-build/05-delivery-acknowledgement.md), and [Feature 06](../Cloud-Receiver-Handoff/v2-build/06-transport-and-operations.md)

## 1. Conclusion and boundary

The SDK is a Host-side adapter. It creates signed Manifests and Events, performs authenticated
Receiver setup/status calls, and owns the browser consent handoff. It does not claim delivery,
verify a Host effect, or acknowledge a delivery. Those operations belong to the Cloud Receiver and
Local Connector, and their contracts are included here so the teams can run one compatible flow.

The SDK production source remains unchanged for this increment. No public Grant inspection or
revocation route is added or assumed; internal test-only Grant control remains governed by ADR-0013.

```text
Host business truth
  -> Host SDK signs
  -> Cloud Receiver verifies and queues
  -> Local Connector claims a bounded lease
  -> independent Host-effect authority verifies the actual Host effect
  -> Local Connector acknowledges the exact delivery
```

An SDK or Receiver Event result of `202` means accepted and durably queued only. It does not mean
claimed, activated, effected, or acknowledged.

## 2. Exact test matrix

| ID | Boundary | Required assertion | Current state |
|---|---|---|---|
| `SDK-V2-001` | SDK `registerHostKey()` -> Receiver | Exact public-key registration request, `201` first result, `200` idempotent result, bounded identity envelope | Existing Feature 2 gate; rerun against the exact current Cloud checkout |
| `SDK-V2-002` | SDK `createConsentSession()` -> Receiver | Signed Manifest, organization authentication, opaque consent URL/session envelope, no raw token field | Existing Feature 2 gate; rerun against the exact current Cloud checkout |
| `SDK-V2-003` | SDK `getConsentSession()` -> Receiver | Pending and approved status; approved binding contains no Connector/target/private values | Existing Feature 2 gate; rerun against the exact current Cloud checkout |
| `SDK-V2-004` | Receiver consent page -> browser SDK | Exact-origin, exact-popup completion event for approve and decline; no private data | Existing Feature 2 gate; rerun against the exact current Cloud checkout |
| `SDK-V2-EVENT-001` | SDK `sendEvent()` -> `/v0.1/events` | Canonical signed envelope, no organization API key, `202` continuation acceptance only | Existing Feature 3 gate; rerun against the exact current Cloud checkout |
| `SDK-V2-EVENT-002` | Identical Event replay | Same identifiers and `202`, `duplicate: true`, no second delivery or Grant run consumption | Existing Feature 3 gate; rerun against the exact current Cloud checkout |
| `SDK-V2-EVENT-003..007` | Invalid Event/Grant inputs | Exact bounded signature, expiry, revocation, origin, and sequence errors with no mutation | Existing Feature 3 gate; rerun against the exact current Cloud checkout |
| `SDK-V2-CLAIM-001..005` | Received Connector client -> `/v0.1/delivery-claims` | Exact body, target scope, lease/replay/expiry/exhaustion behavior, durable digest-only state | `5/5` passed against exact Cloud `300bce02` and fresh PostgreSQL |
| `SDK-V2-ACK-001` | Connector success without effect proof | Delivery remains `leased`; adapter/Agent success is not acknowledgement | Passed in received run against exact Cloud `300bce02` |
| `SDK-V2-ACK-002` | Connector + configured Host-effect authority -> `/v0.1/delivery-acknowledgements` | Exact context-bound effect attestation, one atomic `200` acknowledgement | Passed in received run against exact Cloud `300bce02` |
| `SDK-V2-ACK-003` | Invalid/stale/mismatched effect or lease | Stable `4xx`; no acknowledgement or overwrite | Failed: received test expects future effect `403 host_effect_time_invalid`; Cloud returns `403 host_effect_invalid` |
| `SDK-V2-ACK-004` | Identical acknowledgement replay | Same result with `duplicate: true`; no second effect or state transition | Passed in received run against exact Cloud `300bce02` |
| `SDK-V2-ACK-005` | Different effect or wrong Connector | Stable conflict/identity error; original attestation remains | Passed in received run against exact Cloud `300bce02` |
| `SDK-V2-HTTP-001..005` | All SDK/Connector HTTP boundaries | Bounded JSON, size limits, no redirect, no-store, stable errors, health/readiness, secret-free logs | Cloud Feature 6 test file `5/5` passed against exact Cloud `300bce02` |
| `SDK-V2-E2E-001` | Host SDK -> Receiver -> Connector -> Host effect -> acknowledgement | Complete response sequence and durable terminal `acknowledged` state, then exact acknowledgement replay | Blocked by ACK-003 mismatch; not run |

The existing SDK test sources remain the executable SDK-owned coverage:

- [`cloud-receiver-v2.contract.mjs`](../../runtime/host-sdk/test/cloud-receiver-v2.contract.mjs)
  covers `SDK-V2-001` through `SDK-V2-004`.
- [`cloud-receiver-v2.event.contract.mjs`](../../runtime/host-sdk/test/cloud-receiver-v2.event.contract.mjs)
  covers `SDK-V2-EVENT-001` through `SDK-V2-EVENT-007`.
- The received Claim compatibility source is
  [`cloud-receiver-v2-claim.contract.mjs`](../../runtime/local-connector/test/cloud-receiver-v2-claim.contract.mjs).

The SDK does not add a production test client for Claim or Acknowledgement. Running the received
Connector matrix verifies the downstream contract; it does not change the SDK ownership boundary.

## 3. Exact requests and successful responses

Examples use placeholders in angle brackets. They are not credentials or wire values to persist.
Every JSON body and response is canonical JSON, uses `Cache-Control: no-store`, and stays within the
v2 request/response size limits.

### 3.1 Host-key registration

```http
POST /v0.1/host-keys
Accept: application/json
Content-Type: application/json
Authorization: Bearer <organization-api-key>

{
  "host_id": "host_example",
  "issuer_origin": "https://host.example",
  "key_id": "host_key_example",
  "public_key_pem": "-----BEGIN PUBLIC KEY----- <public-key>"
}
```

First registration returns `201`; an exact idempotent replay may return `200`:

```json
{
  "type": "webmcp.reentry_host_key",
  "protocol_version": "0.1",
  "host_id": "host_example",
  "issuer_origin": "https://host.example",
  "key_id": "host_key_example",
  "status": "active",
  "duplicate": false
}
```

The SDK derives `public_key_pem` from its private Ed25519 key. The private key and organization
identifier never appear in this request body or response.

### 3.2 Consent-session creation and status

```http
POST /v0.1/consent-sessions
Accept: application/json
Content-Type: application/json
Authorization: Bearer <organization-api-key>

{
  "host_subject_ref": "host_user_123",
  "expected_origin": "https://host.example",
  "manifest": <complete-signed-webmcp-reentry-manifest>
}
```

The new-session response is `201`; an exact idempotent duplicate may return `200`:

```json
{
  "type": "webmcp.reentry_consent_session",
  "protocol_version": "0.1",
  "consent_session_id": "consent_session_123",
  "challenge": {},
  "consent_url": "https://reentry.example/consent?token=<opaque-token>",
  "expires_at": "2026-09-02T12:10:00.000Z",
  "duplicate": false
}
```

The browser receives only the safe URL and session identifier. The raw URL token is not separately
returned, persisted in plaintext, or logged.

```http
GET /v0.1/consent-sessions/consent_session_123
Accept: application/json
Authorization: Bearer <organization-api-key>
```

Pending status returns `200` with `binding: null`. Approved status returns `200` with the bounded
public binding. The binding contains correlation/workflow/event/expiry/run fields only; it does not
contain a Connector identifier, delivery target, account identifier, organization key, or private
binding value.

### 3.3 Browser completion handoff

After the Receiver page completes a successful account decision, the consent popup sends exactly:

```js
window.opener.postMessage(
  {
    type: "reentry.consent.complete",
    consent_session_id: "consent_session_123",
    status: "approved"
  },
  window.location.origin
);
```

Decline uses `status: "declined"`. The SDK accepts only the exact expected session, popup source,
and Receiver origin. It does not poll or accept arbitrary messages. The Host still confirms status
server-side before storing a binding or returning a continuation identifier.

### 3.4 Signed Event ingress

```http
POST /v0.1/events
Accept: application/json
Content-Type: application/json

{
  "body": "<canonical-json-event-body>",
  "headers": {
    "WebMCP-Reentry-Key-Id": "host_key_example",
    "WebMCP-Reentry-Timestamp": "<epoch-seconds>",
    "WebMCP-Reentry-Signature": "<base64url-ed25519-signature>"
  }
}
```

The signature is Ed25519 over the exact UTF-8 bytes `<timestamp>.<body>`. There is no organization
`Authorization` header on this route. First acceptance returns `202`:

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

An identical Event returns the same envelope with `duplicate: true`. Neither response contains
`claimed`, `delivery_id`, `lease_token`, `effect_token`, or `acknowledged`. The Receiver must commit
the Event, one pending delivery, and the Grant run reservation before returning `202`; a Connector
does not need to be online for acceptance.

### 3.5 Delivery Claim (downstream, not an SDK call)

The Local Connector sends the exact body to the Receiver:

```http
POST /v0.1/delivery-claims
Accept: application/json
Content-Type: application/json

{
  "connector_token": "<connector-token>",
  "claim_token": "<32-byte-base64url-claim-token>"
}
```

The Connector token is in JSON, not an Authorization header. No browser cookie or organization API
key is sent. Work returns `200` with `{ "duplicate": false, "lease": <lease> }`, where the lease
contains exactly:

```json
{
  "type": "webmcp.delivery_lease",
  "protocol_version": "0.1",
  "delivery_id": "delivery_123",
  "event_id": "event_123",
  "attempt": 1,
  "lease_token": "<same-claim-token>",
  "lease_expires_at": "2026-09-02T12:11:00.000Z",
  "continuation": {
    "correlation_id": "correlation_123",
    "workflow_id": "workflow_123",
    "event_type": "workflow_ready",
    "event_sequence": 1,
    "state_version": 2,
    "occurred_at": "2026-09-02T12:00:00.000Z",
    "canonical_url": "https://host.example/workflows/workflow_123"
  },
  "receipt": "<exact-private-continuation-receipt>"
}
```

The current v2 profile is at most three attempts, a 60-second lease, five-second Connector polling,
and five-second delivery request timeout. No work and terminal exhaustion both return an empty `204`
with no `Content-Type`. A live same-token replay by the owning Connector returns the same lease with
`duplicate: true` and does not increment the attempt. A fresh-token wrong-target claim returns the
same empty `204`; a previously used token from another Connector is a scope error.

### 3.6 Delivery Acknowledgement (downstream, not an SDK call)

After the independent Host-effect authority confirms the actual Host effect, the Connector sends:

```http
POST /v0.1/delivery-acknowledgements
Accept: application/json
Content-Type: application/json

{
  "connector_token": "<connector-token>",
  "delivery_id": "delivery_123",
  "lease_token": "<current-or-final-lease-token>",
  "effect_token": "<opaque-host-effect-token>"
}
```

The Receiver asks its configured effect authority to verify the opaque token against the exact
delivery, Event, correlation, workflow, canonical URL, human boundary, and
`effect_applied_awaiting_human` outcome. The public token encoding is owned by that authority and
must not be invented by the SDK or Connector.

Successful acknowledgement returns `200`:

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

An identical acknowledgement returns the same result with `duplicate: true`. The response contains
no lease token, receipt, Grant, Connector credential, target, or Host-domain payload.

## 4. Exact errors and no-mutation rules

All errors are bounded JSON of the form `{ "error": { "code": "stable_machine_readable_code" } }`.
The following status/code pairs are required by the Core and accepted feature contracts.

| Case | Expected status/code | Required state assertion |
|---|---|---|
| Invalid Event signature | `401` / `event_signature_invalid` | No Event, delivery, or Grant-run mutation |
| Expired Grant at Event ingress | `410` / `grant_expired` | Grant and run budget unchanged |
| Revoked Grant at Event ingress | `422` / `grant_revoked` | Grant and run budget unchanged; no new delivery |
| Wrong Event origin | `422` / `event_origin_mismatch` | No Event, delivery, or Grant-run mutation |
| Invalid Event sequence | `422` / `event_sequence_invalid` | No Event, delivery, or Grant-run mutation |
| Invalid Connector identity | `401` or `403` / `connector_identity_invalid` | No delivery state change |
| Same claim token after expiry/retirement | `409` / `claim_token_retired` | No new attempt or lease |
| Same claim token from another Connector | `403` / `delivery_lease_scope_invalid` | No state or secret disclosure |
| Invalid/stale acknowledgement lease | `403` / `delivery_lease_invalid` | Delivery is not overwritten |
| Invalid/mismatched effect proof | `403` / `host_effect_invalid` | Delivery stays unacknowledged |
| Effect confirmation outside lease/Grant/revocation window | `403` / `host_effect_time_invalid` | Delivery stays unacknowledged |
| Missing configured Host-effect authority | `501` / `host_effect_authority_unavailable` | Delivery stays leased and unacknowledged |
| Different effect after acknowledgement | `409` / `delivery_effect_conflict` | Original attestation remains authoritative |
| Effect identity used by another delivery | `409` / `effect_identity_conflict` | Neither delivery is overwritten |
| No delivery to acknowledge | `404` / `delivery_not_found` or Core-equivalent not-found mapping | No mutation |
| Malformed/oversized/unsupported HTTP request | `400`/`413`/`415` with documented stable code | No partial mutation and no redirect |
| Database contention | `503` / `receiver_busy` with `Retry-After: 1` where applicable | No partial lease or acknowledgement |

Feature 5 must expose a missing configured effect authority as `501 /
host_effect_authority_unavailable`, as recorded by the received Cloud task and accepted Core
authority boundary. This remains an expected contract until the Cloud implementation is committed
and tested; the SDK team will not invent or coerce a different code. A missing route or undocumented
code is a blocker, not a reason to weaken the test.

## 5. Replay, timing, and durable-state assertions

### Replay and timing

1. Consent approval creates one Receiver-owned Grant and one target binding; decline creates no
   continuation authority.
2. A first valid Event is committed before `202`; an identical Event is a duplicate and cannot
   consume another run or create another delivery.
3. A valid claim creates at most one live lease per target/delivery. A live same-token replay returns
   the same lease without another attempt.
4. A lease expires no later than the earliest of `now + 60 seconds`, Grant expiry, or Connector
   identity expiry. Reclamation stops after attempt three.
5. The Host effect must be confirmed after lease acquisition and before lease/Grant expiry and any
   revocation boundary, with only the bounded accepted clock skew.
6. Acknowledgement is not an SDK or browser poll. It is a caller-controlled exact retry only when
   the caller has the same authority and token context.
7. An acknowledgement response loss is an unknown outcome; the Connector retries the identical
   acknowledgement under the accepted replay rule, not a new effect or fallback route.

### Durable database assertions

After the combined test, direct test-only database inspection must prove:

- exactly one accepted Event for the Event ID;
- exactly one Grant run reservation/consumption;
- exactly one delivery linked to the Event, Grant, binding, workflow, and target;
- exactly one attempt/lease for the successful path;
- delivery state `pending` after Event acceptance, `leased` after Claim, and `acknowledged` only
  after effect verification;
- the persisted `effect_id` and canonical effect attestation match the exact delivery context;
- the acknowledgement replay creates no new attempt, effect, row, or state transition;
- failed signature, Grant, origin, Event, claim, lease, and effect cases do not mutate unrelated
  state;
- claim, lease, Connector, and effect bearer values are stored only as digests or outside Receiver
  persistence; and
- process restart preserves the current lease/acknowledgement and exact duplicate behavior.

No production durable-state inspection route is added. Test harnesses may use direct database
inspection only against their disposable database.

## 6. Secret and authority boundaries

| Value | Owner and allowed path | Must never appear in |
|---|---|---|
| Organization API key | Host backend -> Host-key/consent/status control calls | Browser, Event request, Connector, response, logs, database evidence |
| Host Ed25519 private key | Host backend SDK signer only | Receiver request, browser, Connector, logs, database |
| Host public key | SDK registration request and Receiver key registry | Not secret; still do not expose organization identity |
| Consent URL token | Receiver URL to the exact browser popup | Separate JSON field, logs, screenshots, browser storage, evidence files |
| Private binding | Receiver/Host server status and Host database | Browser, WebMCP tool input, URL, Connector lease, logs |
| Connector credential | Paired Local Connector only | Browser, organization calls, Event, lease response, logs, Receiver durable state |
| Claim/lease token | Connector caller and exact replay request; Receiver digest at rest | Other Connector, logs, durable raw values, Agent context, browser |
| Host-effect token | Trusted Host-effect authority and acknowledgement caller | Claim response, Agent context, logs, Receiver durable raw values |
| Effect attestation | Receiver durable acknowledgement record and bounded response fields | Raw tokens, private binding, Connector credential, Host-domain payload |

The SDK must not send the organization API key on `/v0.1/events`, and no `202` response may imply
that a downstream secret, claim, effect, or acknowledgement exists.

## 7. Exact execution plan and current blockers

### SDK and received compatibility commands

Run each command with a fresh disposable PostgreSQL database and the exact Cloud checkout recorded
in the command environment:

```sh
cd runtime/host-sdk
CLOUD_RECEIVER_V2_CONTRACT=1 \
  CLOUD_RECEIVER_V2_ROOT="<exact-cloud-receiver-checkout>" \
  DATABASE_URL="<fresh-disposable-postgresql-url>" \
  CLOUD_RECEIVER_RUNTIME_DATABASE_URL="" \
  DIRECT_URL="" \
  node --test test/cloud-receiver-v2.contract.mjs

CLOUD_RECEIVER_V2_EVENT_CONTRACT=1 \
  CLOUD_RECEIVER_V2_ROOT="<exact-cloud-receiver-checkout>" \
  DATABASE_URL="<fresh-disposable-postgresql-url>" \
  CLOUD_RECEIVER_RUNTIME_DATABASE_URL="" \
  DIRECT_URL="" \
  node --test test/cloud-receiver-v2.event.contract.mjs
```

Run the received Claim test from its own package boundary; it is not folded into the SDK normal
suite:

```sh
cd runtime/local-connector
CLOUD_RECEIVER_V2_CLAIM_CONTRACT=1 \
  CLOUD_RECEIVER_V2_ROOT="<exact-cloud-receiver-checkout>" \
  DATABASE_URL="<fresh-disposable-postgresql-url>" \
  CLOUD_RECEIVER_RUNTIME_DATABASE_URL="" \
  DIRECT_URL="" \
  node --test test/cloud-receiver-v2-claim.contract.mjs
```

Run the received Acknowledgement matrix against the same exact Cloud checkout after Feature 5 is
committed:

```sh
cd runtime/local-connector
CLOUD_RECEIVER_V2_ACK_CONTRACT=1 \
  CLOUD_RECEIVER_V2_ROOT="<exact-cloud-receiver-checkout>" \
  DATABASE_URL="<fresh-disposable-postgresql-url>" \
  CLOUD_RECEIVER_RUNTIME_DATABASE_URL="" \
  DIRECT_URL="" \
  node --test test/cloud-receiver-v2-ack.contract.mjs
```

Run the received Feature 6 HTTP/operations tests from the exact Cloud backend package:

```sh
cd <exact-cloud-receiver-checkout>/backend
DATABASE_URL="<fresh-disposable-postgresql-url>" \
  CLOUD_RECEIVER_RUNTIME_DATABASE_URL="" \
  DIRECT_URL="" \
  NODE_ENV=test \
  npm test -- --runInBand src/modules/acknowledgements/test/acknowledgement.test.ts \
    src/modules/system-health/test/http.test.ts
```

The normal SDK regression remains:

```sh
cd runtime/host-sdk
npm run verify
```

### Current source blocker

The exact Cloud Receiver checkout used for the current rerun is clean at
`300bce02e6a6f9b643a6de95a3596691304749b7`. It includes Features 4, 5, and 6, all six committed
Prisma migrations, `/v0.1/delivery-acknowledgements`, `/healthz`, and `/readyz`. Its nested
`main` is three commits ahead of remote `origin/main` at
`b851c320fae0505e3cf098f979d149e04ab44310`; this is local checkout evidence, not pushed,
deployed, or public-runtime evidence.

Cloud's own Feature 5 acknowledgement and Feature 6 transport/operations tests pass `10/10` on
that checkout. The received Local Connector acknowledgement matrix is `4/5`: ACK-001, ACK-002,
ACK-004, and ACK-005 pass, while ACK-003 fails on one exact error code. For a future effect, the
received test expects `403 host_effect_time_invalid`; the Cloud implementation returns
`403 host_effect_invalid` during effect-attestation normalization. The current Core implementation
also classifies a future `confirmed_at` as `host_effect_time_invalid` in
`reentry-core/src/receiver-delivery.mjs`, while accepted ADR-0038 explicitly reserves
`host_effect_invalid` for invalid authority output. This is a protocol/test authority conflict,
not a reason to weaken either test. The project manager/owning teams must reconcile it before the
SDK can close the acknowledgement gate.

No SDK production fallback, guessed effect token, direct database mutation, v1 route, polling, or
alternate transport was added. The combined test remains open until ACK-003 is reconciled and the
exact Host SDK -> Receiver -> Connector -> Host effect -> acknowledgement flow is run.

## 8. Executed verification — 2026-09-02

The current exact Cloud Receiver checkout is clean at
`300bce02e6a6f9b643a6de95a3596691304749b7`; its nested remote readback remains
`b851c320fae0505e3cf098f979d149e04ab44310`. Runtime evidence is Node `v26.8.1`, npm `11.19.0`,
and PostgreSQL `14.18` on `127.0.0.1:55440`. Each focused run used a separate disposable database
and all six committed migrations. The database process was stopped after verification.

- `SDK-V2-001` through `SDK-V2-004`: `4/4` passed against Cloud `300bce02` using
  `sdk_receiver_300bce_sdk`.
- `SDK-V2-EVENT-001` through `SDK-V2-EVENT-007`: `7/7` passed against Cloud `300bce02` using
  `sdk_receiver_300bce_event`. This includes the signed envelope, no organization API key on
  `/v0.1/events`, `202` acceptance-only semantics, duplicate replay, invalid signature,
  expired/revoked Grant, wrong origin, invalid Event, and no-mutation assertions.
- Received `CONNECTOR-V2-CLAIM-001` through `CONNECTOR-V2-CLAIM-005`: `5/5` passed against Cloud
  `300bce02` using `sdk_receiver_300bce_claim`.
- Received `CONNECTOR-V2-ACK-001` through `CONNECTOR-V2-ACK-005`: `4/5` passed against Cloud
  `300bce02` using `sdk_receiver_300bce_ack`; ACK-003 failed only because the received test expects
  `host_effect_time_invalid` for a future effect while Cloud returns `host_effect_invalid`.
- Cloud Feature 5 acknowledgement tests: `5/5` passed using `sdk_receiver_300bce_http`.
- Cloud Feature 6 HTTP/operations tests: `5/5` passed using `sdk_receiver_300bce_http`.
- Normal SDK verification: `npm run verify` passed `18/18` with syntax checks green.
- Normal Local Connector verification: syntax passed for `28` modules and `34/34` executed tests;
  its `10` opt-in Claim/Acknowledgement tests remain skipped without their database gates.
- Repository governance checks passed: `test_validators.py`, `test_sensitive_scan.py`,
  `validate_repository.py --root .`, and `scan_sensitive_patterns.py --root .`.

Earlier environment-only attempts are retained as evidence: the mutable mixed Cloud worktree
produced setup/Prisma failures, and the first new exact-checkout Local Connector run was blocked by
unprivileged loopback access (`connect EPERM`). Neither is treated as a protocol result; the
privileged rerun above is the current result.

## 9. Evidence status

| Evidence | Status |
|---|---|
| Existing SDK Host-key/consent/status/browser gate | `4/4` passed against exact Cloud `300bce02` and fresh PostgreSQL |
| Existing SDK Event gate | `7/7` passed against exact Cloud `300bce02` and fresh PostgreSQL |
| Cloud Feature 4 Claim compatibility | Received matrix `5/5` passed against exact Cloud `300bce02` and fresh PostgreSQL |
| Cloud Feature 5 Acknowledgement | Cloud own tests `5/5`; received Local Connector matrix `4/5`, blocked by ACK-003 error-code mismatch |
| Cloud Feature 6 HTTP/operations | `5/5` Cloud tests passed against exact Cloud `300bce02` and fresh PostgreSQL |
| Combined Host SDK -> Receiver -> Connector -> effect -> acknowledgement | Not run; remains open until ACK-003 is reconciled and the combined flow passes |

No whole-system completion claim is made by this record.

## 9. Closure and reopen conditions

Close only after the exact Cloud Receiver and Local Connector commits are recorded, the SDK and
received matrices pass with a fresh database, the normal SDK suite remains green, the effect
authority verifies the exact Host effect, the combined flow reaches durable `acknowledged`, and an
identical acknowledgement replays as `duplicate: true`.

Keep open on any mismatch, missing route, missing authority, database mutation, secret leak,
unexpected retry, protocol drift, or failed earlier feature. Reopen if a later change proposes
polling, fallback routes, alternate transports, public Grant control outside ADR-0013, or a new
meaning for Event `202`.
