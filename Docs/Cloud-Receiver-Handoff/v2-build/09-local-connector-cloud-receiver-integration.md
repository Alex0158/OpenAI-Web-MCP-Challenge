# Local Connector to Cloud Receiver v2 Integration Contract

**Role:** Local Connector maintainer handoff

**Status:** Connector-compatible; Feature 4, all Feature 5 acknowledgement cases, and the local
real-process E2E acceptance fixture verified against the exact Cloud checkout; ACK-003 follows the
accepted Core/Cloud error mapping

**Owner:** Local Connector team

**Audience:** Cloud Receiver v2 and SDK teams

**Date:** 2026-09-02

**Authority:** `reentry-core/`, ADR-0007, ADR-0009, ADR-0010, ADR-0011, ADR-0013, ADR-0037,
ADR-0038, and ADR-0039

## Boundary

The Local Connector is an outbound-only client and adapter boundary. It does not issue Grants,
choose a target, verify a Host effect, or expose a local listener. Its production behavior is
already compatible with the frozen v0.1 claim and acknowledgement routes:

- `reentry-core/src/local-connector-client.mjs` sends and validates claim and acknowledgement
  requests;
- `runtime/local-connector/src/local-connector.mjs` claims one lease and invokes one typed adapter;
- `LocalConnector.runOnce()` never acknowledges adapter success; and
- `LocalConnector.acknowledgeDelivery()` is an explicit caller-controlled operation requiring an
  independently supplied opaque Host-effect token.

The last two rules are intentional. ADR-0011 prohibits translating adapter success into a Host
effect, and ADR-0038 keeps effect-token authority outside the Connector. No automatic
acknowledgement, public Grant route, fallback route, or protocol change is part of this handoff.

## Exact Connector requests

Every request is one `POST` with:

```http
Accept: application/json
Content-Type: application/json
Cache-Control: no-store
```

The client uses `credentials: omit`, `redirect: manual`, a five-second request timeout in the
current v2 profile, and no automatic retry. The Receiver origin is HTTPS, or literal loopback
HTTP for local testing. No `Authorization` header, browser cookie, query string, or URL token is
used.

### Claim

```http
POST /v0.1/delivery-claims

{
  "connector_token": "<connector-token>",
  "claim_token": "<32-byte-unpadded-base64url-token>"
}
```

The Connector creates and retains the claim token before sending. If the claim succeeds, the
Receiver echoes it as `lease_token`; the Connector validates that equality. The Receiver stores
only its digest.

Work returns `200` with exactly `{ "duplicate": false, "lease": <lease> }`. A live exact retry by
the same Connector and claim token returns the same lease with `duplicate: true`. No work and
retry exhaustion both return an empty `204` with no `Content-Type`.

The current policy values are:

```text
maximum attempts: 3
lease duration: 60 seconds, bounded by Grant and Connector expiry
Connector polling: 5 seconds
request timeout: 5 seconds
```

### Acknowledgement

The Connector calls acknowledgement only after an independent Host-effect authority has supplied
the opaque effect token:

```http
POST /v0.1/delivery-acknowledgements

{
  "connector_token": "<connector-token>",
  "delivery_id": "<delivery-id>",
  "lease_token": "<current-or-final-lease-token>",
  "effect_token": "<opaque-host-effect-token>"
}
```

The effect token is not derived from the adapter result and is not placed in the lease or adapter
activation input. A valid effect authority response lets the Receiver atomically return `200`:

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

The response contains no Connector token, lease token, effect token, receipt, Grant, target, or
Host-domain payload. An exact retry returns the same envelope with `duplicate: true`; it creates no
new effect, attempt, or state transition.

## Exact errors and no-mutation behavior

The Connector accepts only the bounded error envelope:

```json
{ "error": { "code": "stable_machine_readable_code" } }
```

The required Feature 4–6 mappings are:

| Request | Status/code | Connector behavior | Durable assertion |
|---|---:|---|---|
| Invalid Connector identity | `401` or `403` / `connector_identity_invalid` | Surface the typed error; do not retry with another credential | Delivery state is unchanged |
| Same claim token after expiry | `409` / `claim_token_retired` | Surface the typed error; generate no hidden replacement | No new attempt or lease |
| Used claim token from another Connector | `403` / `delivery_lease_scope_invalid` | Surface the scope error | No state or secret disclosure |
| Invalid/stale acknowledgement lease | `403` / `delivery_lease_invalid` | Surface the typed error | Existing lease/acknowledgement remains authoritative |
| Invalid or mismatched effect | `403` / `host_effect_invalid` | Surface the typed error | Delivery remains unacknowledged |
| Effect outside lease/Grant/revocation window | `403` / `host_effect_time_invalid` | Surface the typed error | Delivery remains unacknowledged |
| Different effect after acknowledgement | `409` / `delivery_effect_conflict` | Surface the typed error | Original effect attestation remains authoritative |
| Effect identity used by another delivery | `409` / `effect_identity_conflict` | Surface the typed error | Neither delivery is overwritten |
| No delivery for acknowledgement | `404` / `delivery_not_found` or Core-equivalent | Surface the typed error | No mutation |
| Missing effect authority | `501` / `host_effect_authority_unavailable` | Surface unsupported capability | Claimed delivery remains leased |
| Bounded persistence contention | `503` / `receiver_busy` | Surface the typed error; do not guess outcome | No partial lease or acknowledgement |
| Malformed/oversized/non-JSON HTTP | `400`/`413`/`415` with stable code | Surface the typed error; no redirect follow | No partial mutation |

The Cloud implementation owns the exact status for an accepted Core error where the contract allows
an alternative. The Connector tests do not coerce an undocumented status or add a fallback route.

## Required test exchange

The Local Connector sends these executable tests to the Cloud Receiver team:

- [`cloud-receiver-v2-claim.contract.mjs`](../../../runtime/local-connector/test/cloud-receiver-v2-claim.contract.mjs)
  — `CONNECTOR-V2-CLAIM-001`–`005`;
- [`cloud-receiver-v2-ack.contract.mjs`](../../../runtime/local-connector/test/cloud-receiver-v2-ack.contract.mjs)
  — `CONNECTOR-V2-ACK-001`–`005`; and
- [`cloud-receiver-v2-e2e.test.mjs`](../../../runtime/local-connector/test/cloud-receiver-v2-e2e.test.mjs)
  — `CONNECTOR-V2-E2E-001`, the opt-in Host SDK to acknowledgement process harness; and
- this document, including the exact request, response, timing, persistence, and secret rules.

Run against an exact Cloud Receiver checkout and fresh disposable PostgreSQL database:

```sh
cd runtime/local-connector

CLOUD_RECEIVER_V2_CLAIM_CONTRACT=1 \
  CLOUD_RECEIVER_V2_ROOT="<exact-cloud-receiver-checkout>" \
  DATABASE_URL="<fresh-disposable-postgresql-url>" \
  CLOUD_RECEIVER_RUNTIME_DATABASE_URL="" \
  DIRECT_URL="" \
  node --test test/cloud-receiver-v2-claim.contract.mjs

CLOUD_RECEIVER_V2_ACK_CONTRACT=1 \
  CLOUD_RECEIVER_V2_ROOT="<exact-cloud-receiver-checkout>" \
  DATABASE_URL="<fresh-disposable-postgresql-url>" \
  CLOUD_RECEIVER_RUNTIME_DATABASE_URL="" \
  DIRECT_URL="" \
  node --test test/cloud-receiver-v2-ack.contract.mjs
```

The Cloud team must run the same files against its exact committed handler and database migrations.
If a received test conflicts with Core or an accepted ADR, stop and return the conflict to the
project manager; do not weaken the test or add an alias.

### Real-process E2E command

The Local Connector team also runs the following against the exact Cloud checkout. The wrapper
starts the Cloud Express app over loopback HTTP with an injected test-only Host-effect authority;
the claim and acknowledgement workers are separate Node processes using the production Local
Connector client/classes. The raw effect token is sent only over the worker's stdin, while the
independent effect file stores its SHA-256 digest and canonical attestation fields only.

```sh
cd runtime/local-connector

CLOUD_RECEIVER_V2_E2E=1 \
  CLOUD_RECEIVER_V2_ROOT="/Users/mac/Desktop/OpenAI-Web-MCP-Challenge/saas-boilerplate" \
  DATABASE_URL="postgresql://mac@127.0.0.1:55433/local_connector_v2_clean_300bce_0902" \
  DIRECT_URL="" \
  CLOUD_RECEIVER_RUNTIME_DATABASE_URL="" \
  NODE_ENV=test \
  node --test test/cloud-receiver-v2-e2e.test.mjs
```

Expected result: `CONNECTOR-V2-E2E-001` passes `1/1`. The flow is:

```text
Host SDK registerHostKey/createConsentSession/sendEvent
  -> Cloud HTTP 201/202 and one durable pending delivery
  -> Connector claim worker sends connector_token + fresh claim_token
  -> Cloud HTTP 200 lease; Connector adapter returns accepted without secrets
  -> independent Host-effect fixture records only a digest and attestation
  -> acknowledgement worker sends connector_token + delivery_id + lease_token + effect_token
  -> Cloud HTTP 200 acknowledged; durable status = acknowledged
  -> Receiver restart; exact acknowledgement replay returns HTTP 200 duplicate = true
  -> new fresh claim token returns empty HTTP 204 and no new attempt
```

The test asserts the exact response envelopes, durable lease/attempt/acknowledgement fields,
unchanged acknowledgement timestamp and attestation on replay, `0600` local credential custody,
and absence of raw Connector, claim/lease, or effect tokens from Receiver output, logs, durable
values, the effect fixture, and worker output. It does not prove a deployed Receiver or claim a
production Host-effect authority.

## Test cases

### `CONNECTOR-V2-CLAIM-001`–`005`

The existing claim matrix proves exact body/token placement, successful `200` leases, empty `204`
no-work and exhaustion responses, live replay, expiry and bounded three-attempt reclamation,
fresh-token wrong-target isolation, cross-Connector scope rejection, process restart, concurrent
claim serialization, durable attempt state, and raw-secret redaction.

### `CONNECTOR-V2-ACK-001`

Claim one delivery and run a deterministic adapter that returns `accepted`. Do not submit an
acknowledgement. The Connector must report only the typed activation result. The database must
remain `status = leased`, `acknowledged_at IS NULL`, and have exactly one attempt. The adapter
input must not contain `connector_token`, `lease_token`, or `effect_token`.

### `CONNECTOR-V2-ACK-002`

Claim one delivery, perform the actual Host effect through the configured test authority, and call
`LocalConnectorClient.acknowledgeDelivery()` with the same delivery ID, lease token, and opaque
effect token. The Receiver must pass the exact stored context to the authority:

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

The result is one canonical `200` acknowledgement, durable state becomes `acknowledged`, one
effect attestation and effect ID are stored, and no raw Connector, lease, or effect token appears
in the response, logs, or durable rows.

### `CONNECTOR-V2-ACK-003`

Try an unknown, future, revoked, and stale effect/lease, then call the same route against an app
without an effect authority. Each failure must be a bounded visible error, must not overwrite
the delivery, and must not trigger a retry or adapter fallback. A stale lease must be tested after
a new lease replaces it. The missing-authority result must be the Cloud implementation's recorded
`501 host_effect_authority_unavailable` contract.

### `CONNECTOR-V2-ACK-004`

Replay the identical acknowledgement after Receiver app/process restart. The Receiver must
re-authenticate the opaque values, return the original envelope with `duplicate: true`, preserve
`status = acknowledged`, preserve the original `effect_id` and attestation, and create no second
attempt or effect record.

### `CONNECTOR-V2-ACK-005`

After one successful acknowledgement, submit the same delivery through another Connector and then
submit a different effect through the owner. The wrong Connector must receive the scoped identity
error. The different effect must receive `409 delivery_effect_conflict`. The original attestation
and audit history must remain unchanged.

## Durable-state assertions

The tests inspect the disposable database directly; there is no production inspection route. The
Cloud team must prove:

- one delivery target has at most one live lease;
- each new claim attempt increments once, while a live exact replay does not;
- attempts stop at three and exhaustion still maps to empty `204`;
- the current lease digest and attempt history survive process restart;
- acknowledgement changes only the exact delivery from `leased` or final `retry_exhausted` to
  `acknowledged`;
- one effect ID and canonical attestation are retained, and acknowledgement replay creates no
  second effect or attempt; and
- raw Connector, claim/lease, and effect tokens are absent from Receiver durable values.

## Secret boundaries

| Value | Connector may use | Receiver may persist | Must never appear in |
|---|---|---|---|
| Connector token | Claim/ack request body only | Digest only | URL, headers, response, logs, durable raw values, Agent input |
| Claim/lease token | Claim request and explicit exact replay; validated lease context | Digest only | Logs, durable raw values, Agent input, browser |
| Effect token | Explicit acknowledgement request only | Never | Claim response, Agent input, logs, durable raw values |
| Effect attestation | Not minted by Connector; returned as bounded acknowledgement fields only | Canonical attestation/effect ID | Raw tokens, private binding, Host artifact |
| Grant/binding/private context | Validated lease receipt only where Core permits | Receiver-owned records | Other Connector, browser, Agent prompt, logs |

The Local Connector credential file is a local protected credential store and intentionally retains
the Connector credential needed for future authentication. That is distinct from the Receiver's
digest-only claim/lease/effect storage rule. Expanding the no-plaintext rule to the local
Connector credential requires a separate custody/keychain decision; this handoff does not silently
change Pairing behavior.

## Combined acceptance flow

The final cross-team test must run against exact committed Cloud Receiver, Local Connector, and
SDK checkouts:

```text
Host SDK creates and sends signed Event
  -> Cloud Receiver returns 202 after durable Event + delivery commit
  -> Local Connector claims one 60-second lease
  -> Host effect authority confirms the exact Host effect
  -> Local Connector sends the exact acknowledgement request
  -> Cloud Receiver returns 200 acknowledged
  -> identical acknowledgement replay returns 200 duplicate=true
```

Direct disposable-database inspection must show one Event, one delivery, one attempt, one effect
attestation, and terminal `acknowledged` state. The `202` Event result must not claim any downstream
fact. The flow must not use the retired `runtime/cloud-receiver/` package or any public Grant
inspection/revocation route; ADR-0013 remains the gate for that capability.

## Current counterpart result

The current exact Cloud Receiver checkout is `saas-boilerplate` commit
`300bce02e6a6f9b643a6de95a3596691304749b7`, with Feature 4 implementation at
`d840439efe628a24c89fec6b74f37f04a701cb58`. It is a clean committed checkout containing the
acknowledgement route, six migrations, and Feature 6 transport/operations shell. The Claim matrix
passes `5/5`; the acknowledgement matrix passes `5/5` against the accepted ACK-003 mapping.
Cloud's own Feature 5 and Feature 6 tests pass `10/10` against that
checkout. The Local Connector production implementation remains at the pairing baseline
`7fab264d237b3e172acb091888643c831cadcb85`; the current claim/acknowledgement test and
real-process E2E harness tip is `4b8215156d814551f8da06dad16319deaff549d7`. No Local Connector
production or Core client files changed in that test/documentation increment.
The combined flow remains gated only by final cross-team execution and deployment evidence.

The accepted ACK-003 mapping is now explicit: malformed or far-future normalization returns
`host_effect_invalid`; `host_effect_time_invalid` is reserved for a normalized effect outside the
valid lease/Grant/revocation window. The Local Connector test and the Cloud handler agree, and the
fresh-database ACK matrix is green. The SDK-owned E2E and deployed Receiver evidence remain open.
