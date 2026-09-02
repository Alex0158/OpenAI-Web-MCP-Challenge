# SDK to Cloud Receiver v2 Integration Contract

**Role:** Supporting cross-team handoff
**Status:** Supporting implementation guidance; it does not create a new protocol authority
**Audience:** Cloud Receiver v2 project manager and development team
**Prepared by:** SDK development team
**Date:** 2026-09-02
**Current v2 gate:** [TASK-015](../../Tasks/TASK-015-build-cloud-receiver-v2-consent-targeting.md),
Consent/Targeting/Internal Revocation and SDK compatibility locally verified; Event remains deferred

## Executive summary

The Host SDK is a Host-side adapter, not the Cloud Receiver. It signs Host-owned Manifests and
Events, calls a small set of Receiver control and ingress routes, and gives the browser one consent
action that can be used by both a normal button and a top-level WebMCP Site Tool. Cloud Receiver v2
must preserve the signed protocol, authentication boundaries, response meanings, and durable state
rules described here so the SDK can work without a rewrite.

The current v2 implementation has passed its Pairing prerequisite, the Consent/Targeting/Internal
Revocation feature gate, and the `SDK-V2-001` through `SDK-V2-004` compatibility gate locally at
Receiver commit `f67e741dd0392dd04f14d7d02764b7c0a7179dc5`. Event ingress, delivery, and
acknowledgement remain later feature gates. Do not implement those later routes by copying the
retired v1 runtime or by guessing an unaccepted API.

## Authority and current state

Use this order when a detail conflicts:

1. `reentry-core/` and the accepted protocol decisions, especially ADR-0007 and ADR-0010;
2. ADR-0035 and TASK-015 for the currently authorized v2 consent/targeting increment;
3. the v2 feature handoff files in this directory; and
4. this document as an SDK-to-Receiver integration map.

`runtime/cloud-receiver/` is v1 historical evidence and is retired by ADR-0032. It is not a v2
implementation source, migration source, or production fallback. The current v2 base is
`saas-boilerplate/`, using its separate User/Developer authentication surfaces, Prisma, and a fresh
PostgreSQL database. Feature 2 and the browser handoff are locally verified there; this document
records the SDK contract evidence without claiming deployment or integration completion.

## Ownership model

| Concern | Owner | SDK interaction |
|---|---|---|
| Host user, workflow, business state, canonical page | Host application | Host server supplies these values when creating Manifests and Events. |
| Host signing identity | Host application plus Receiver key registry | SDK sends the public key; the private key never leaves the Host. |
| Re-entry account and connected device | Cloud Receiver | SDK receives only a consent URL/session and later an authenticated status result. |
| Consent, Grant, binding, and target | Cloud Receiver | SDK creates/reads the consent session; the Receiver remains authoritative. |
| Business Event | Host application | SDK signs and sends it after the real Host business condition occurs. |
| Delivery, lease, Connector execution, acknowledgement | Cloud Receiver and Local Connector | These are downstream of `sendEvent`; the SDK does not perform them. |

The most important distinction is:

```text
Host business truth -> Host SDK signs -> Cloud Receiver verifies and queues
Cloud Receiver delivery -> Local Connector claims -> Host effect authority verifies -> acknowledgement
```

An SDK result of `202` means only that the Receiver accepted the Event. It does not mean that a
Connector claimed it, Codex started, an effect was committed, or acknowledgement succeeded.

## What the SDK actually calls

The current package is [`@4xeoz/re-entry-sdk`](../../../runtime/host-sdk/package.json). The server
implementation is [`src/server.mjs`](../../../runtime/host-sdk/src/server.mjs); the protocol signer
is [`reentry-core/src/host-sdk.mjs`](../../../reentry-core/src/host-sdk.mjs).

| SDK method | Receiver request | Authentication | Successful result | v2 status |
|---|---|---|---|---|
| `createManifest(input)` | No network request | None | Locally signed Manifest | SDK-local; available now |
| `createEvent(input)` | No network request | None | Locally signed Event envelope | SDK-local; available now |
| `registerHostKey({ hostId })` | `POST /v0.1/host-keys` | `Authorization: Bearer <organization-api-key>` | Registered public-key JSON | Feature 2; SDK-V2-001 |
| `createConsentSession({ manifest, hostSubjectRef })` | `POST /v0.1/consent-sessions` | Organization API key | Consent session and URL | Feature 2; SDK-V2-002 |
| `getConsentSession({ consentSessionId })` | `GET /v0.1/consent-sessions/:id` | Organization API key | Status; approved status includes binding | Feature 2; SDK-V2-003 |
| `decideConsent(...)` | `POST /v0.1/consent-decisions` | Organization API key | No v2 account-first route currently enabled | Deferred; never use as a fallback |
| `sendEvent(input)` | `POST /v0.1/events` | Signed Event envelope; no organization bearer | `202` continuation acceptance | Later Event gate |

The SDK sends JSON, uses `Cache-Control: no-store`, omits browser credentials, rejects redirects, and
does not automatically retry. The service must return bounded JSON errors in the form:

```json
{ "error": { "code": "stable_machine_readable_code" } }
```

The SDK does not send an organization API key on `/v0.1/events`. Event authorization comes from the
registered Host public key, signed Event envelope, binding, and Grant checks.

## End-to-end sequence

### 1. Pair a Connector first

This is a v2 prerequisite and is not a direct SDK call.

```http
POST /v0.1/account/pairing-sessions
Cookie: user_session=<authenticated Re-entry user>
Content-Type: application/json

{}
```

The response is `201` and contains a short-lived eight-character uppercase hexadecimal pairing code.
Persist only its SHA-256 digest. A fresh CLI claims it without a browser cookie or organization API
key:

```http
POST /v0.1/account/pairing-sessions/claim
Content-Type: application/json

{
  "pairing_code": "A1B2C3D4",
  "device_name": "Mac One"
}
```

The first valid claim atomically creates one Connector and one immutable delivery target, returning
the opaque Connector token once. A duplicate replay returns the same Connector metadata but omits
`connector_token`. This pairing target is what a later user consent approval binds to.

The exact cases are `PAIR-001` through `PAIR-005` in
[`01-pairing-and-credentials.md`](01-pairing-and-credentials.md). Pairing being green is a
prerequisite for the full SDK flow; it is not proof that the SDK consent or Event routes work.

### 2. Register the Host public key

During controlled Host setup, the Host server calls:

```http
POST /v0.1/host-keys
Authorization: Bearer <organization-api-key>
Content-Type: application/json

{
  "host_id": "host_example",
  "issuer_origin": "https://host.example",
  "key_id": "host_key_example",
  "public_key_pem": "-----BEGIN PUBLIC KEY----- ..."
}
```

The SDK derives `public_key_pem` from its Ed25519 private key. The Cloud Receiver must store and
resolve the public key by the organization, issuer origin, and key ID. It must never require or
accept the Host private key. The expected first-registration status is `201`; an idempotent existing
registration may return `200`.

The v2 registration response is this bounded identity envelope:

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

Host-key registration is part of the v2 Consent/Targeting prerequisite. The response does not expose
the organization identifier. Public key revoke/rebind behavior is not part of this contract and must
not be invented as part of the SDK compatibility work.

### 3. Create a consent session

The Host server creates the signed Manifest locally, then the SDK sends:

```http
POST /v0.1/consent-sessions
Authorization: Bearer <organization-api-key>
Content-Type: application/json

{
  "host_subject_ref": "host_user_123",
  "expected_origin": "https://host.example",
  "manifest": {
    "type": "webmcp.reentry_manifest",
    "protocol_version": "0.1"
  }
}
```

The real Manifest is the complete signed object produced by the SDK; the shortened object above is
only illustrative. The Receiver must validate the Manifest against the Core contract and bind the
consent session to the organization and Host subject.

For a new session, return `201`; for an exact idempotent duplicate, return `200`. The response must
contain enough data for the Host server to return this safe browser payload:

```json
{
  "type": "webmcp.reentry_consent_session",
  "protocol_version": "0.1",
  "consent_session_id": "consent_session_123",
  "challenge": {},
  "consent_url": "https://reentry.example/consent?token=<43-character-base64url-token>",
  "expires_at": "2026-09-02T12:10:00.000Z",
  "duplicate": false
}
```

The SDK browser entrypoint accepts only an HTTPS URL, or HTTP on loopback for local testing. The URL
must have the exact `/consent` path, exactly one `token` parameter, no credentials or hash, and no
other query parameters. The raw token must not be separately returned, persisted in plaintext, or
written to logs.

### 4. Let Re-entry own the browser decision

The browser uses [`src/client.mjs`](../../../runtime/host-sdk/src/client.mjs), not the server SDK.
`createReentryConsentAction()` calls the Host consent route, opens the returned URL after a human
gesture, and waits for a minimal completion message from the Receiver popup:

```js
{
  type: "reentry.consent.complete",
  consent_session_id: "consent_session_123",
  status: "approved"
}
```

The message may also contain `status: "declined"`. It must be sent from the exact consent URL origin
and the exact popup window. The Receiver page owns Re-entry account authentication, device selection,
approval, and decline. Approval creates one Grant and binds the Host subject to the selected
Connector delivery target; decline creates no continuation authority.

The SDK does not treat the popup message as proof of approval. It calls the Host confirmation route
only after an approved message.

The Receiver HTML emits this completion event only after a successful account decision, using the
current consent session identifier and `window.location.origin`. Failed decisions emit no message;
the SDK will not poll, accept an arbitrary message, or fall back to another transport.

### 5. Confirm status on the Host server

The Host server calls:

```http
GET /v0.1/consent-sessions/consent_session_123
Authorization: Bearer <organization-api-key>
```

The approved response must contain the Receiver-owned binding for the authenticated Host server to
store. The Host must associate it with the authenticated Host user and workflow, then return only an
opaque Host-side `continuation_id` to browser code. The binding must never be returned to the browser,
placed in a cookie or URL, sent to a WebMCP tool, or exposed to the Connector.

The durable decision status is `pending`, `approved`, or `declined`. A later v2 status surface may
add derived `effective_status` such as `active`, `expired`, `exhausted`, or `revoked`; it must not
change the meaning of the decision status.

### 6. Send the later Host business Event

The later Event is sent only when the Host business rule becomes true. A consent request or WebMCP
tool invocation must not itself send this Event.

`sendEvent()` sends this outer JSON envelope:

```http
POST /v0.1/events
Content-Type: application/json

{
  "body": "<canonical JSON Event body>",
  "headers": {
    "WebMCP-Reentry-Key-Id": "host_key_example",
    "WebMCP-Reentry-Timestamp": "1788340800",
    "WebMCP-Reentry-Signature": "<base64url-ed25519-signature>"
  }
}
```

The signature is Ed25519 over the exact bytes:

```text
<timestamp>.<body>
```

The canonical body contains the Event ID, correlation ID, binding ID, issuer origin, workflow,
event type, sequence, state version, timestamp, and canonical URL. The Receiver must:

1. validate the outer request, body size, and canonical JSON;
2. resolve the Host public key by issuer origin and key ID;
3. validate timestamp freshness and the exact signature bytes;
4. resolve the binding and effective Grant;
5. validate origin, expiry, revocation, exhaustion, sequence, and state version;
6. deduplicate by `event_id`; and
7. atomically record the accepted Event and exactly one pending delivery.

For a first accepted Event, return `202`:

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

An identical Event ID returns the same acceptance shape with `duplicate: true` and must not create a
second delivery or consume another run. A valid Event must not depend on the Connector being online.

### 7. Complete delivery downstream

The SDK does not call these routes, but they are required for the full product path:

```text
POST /v0.1/delivery-claims
  Connector sends connector_token and claim_token in JSON
  -> 200 leased work, or exact empty 204 when no work exists

POST /v0.1/delivery-acknowledgements
  Connector sends connector_token, delivery_id, lease_token, and effect_token
  -> 200 only after an independent Host-effect authority verifies the exact context
```

The Connector token, claim token, lease token, effect token, and private binding are never part of
the browser consent result or Agent activation context. Delivery and acknowledgement must use
durable transactions, lease expiry, replay protection, and target scoping. See the v2
[`04-delivery-claim-and-lease.md`](04-delivery-claim-and-lease.md) and
[`05-delivery-acknowledgement.md`](05-delivery-acknowledgement.md) gates.

## Data and security requirements

The v2 service eventually needs durable records for:

- User accounts and Connector pairing sessions;
- Connectors and immutable delivery targets;
- Host public keys;
- Host-subject bindings and consent sessions;
- Grants and effective status facts;
- Events and deduplication records;
- Deliveries, leases, and acknowledgement/effect attestations.

The current v2 increment authorizes pairing plus consent/targeting/internal revocation. Event and
delivery tables remain deferred to their own feature gates. In every stage:

- store digests for pairing, Connector, claim, lease, and other bearer tokens; never raw secrets;
- use unique constraints and transactions/compare-and-set for one-time consumption and replay;
- keep Host authentication and organization API keys on server-to-server calls;
- resolve Host public keys using issuer origin and key ID;
- keep the Host private binding server-side and opaque;
- derive effective Grant state at read/claim/ingress time rather than relying on expiry jobs; and
- preserve audit history when a Grant, delivery, or Connector is revoked.

The v2 service must not add delegated Organization-key Grant inspection or revocation merely because
the SDK has an organization-authenticated control channel. ADR-0013 requires the Grant control
attestation subject to match the private Grant subject; delegated administration needs a separate
accepted decision.

## SDK compatibility test gate

The opt-in suite at
[`runtime/host-sdk/test/cloud-receiver-v2.contract.mjs`](../../../runtime/host-sdk/test/cloud-receiver-v2.contract.mjs)
uses the actual `saas-boilerplate/backend` app and disposable PostgreSQL. It asserts the SDK request
headers/bodies and the v2 response envelopes:

- `SDK-V2-001`: Host-key registration and idempotent replay;
- `SDK-V2-002`: signed Manifest consent-session creation and opaque URL/token handling;
- `SDK-V2-003`: pending and approved consent status, including a public binding without Connector
  or delivery-target identifiers; and
- `SDK-V2-004`: Receiver HTML completion handoff to the browser SDK, green against the local
  Receiver.

Run it only with an explicit disposable-database environment:

```sh
cd runtime/host-sdk
CLOUD_RECEIVER_V2_CONTRACT=1 \
  DATABASE_URL="<fresh disposable PostgreSQL URL>" \
  CLOUD_RECEIVER_RUNTIME_DATABASE_URL="" \
  DIRECT_URL="" \
  node --test test/cloud-receiver-v2.contract.mjs
```

All four cases are the local compatibility gate. A passing run is local process evidence only; it is
not deployed or externally verified integration evidence.

## Transport and error compatibility

The Cloud Receiver and SDK must agree on these operational rules:

| Rule | Requirement |
|---|---|
| Production origin | HTTPS only |
| Local origin | HTTP only on literal loopback (`127.0.0.1` or `::1`) |
| Content type | JSON; reject unsupported encodings |
| Redirects | Never redirect API requests; SDK rejects `3xx` |
| Request size | Receiver v2 limit is at most 16 KiB; Manifest and Event limits remain Core-controlled |
| Response size | Keep JSON responses within the SDK's 32 KiB limit |
| Cache | `Cache-Control: no-store` |
| Errors | Small `{ "error": { "code": "..." } }` response with stable code |
| Logs | No tokens, cookies, private keys, private bindings, SQL, or stack traces |
| Retry | SDK does not retry; Host must reconcile an unknown Event outcome by Event ID |

The SDK maps network failure, timeout, redirect, invalid response, oversized response, and Receiver
rejection to bounded errors. A timeout is not proof that the Event was rejected; the Host must not
blindly create a new Event without an idempotent reconciliation decision.

## Red-green-refactor development contract

Use this loop for every v2 feature, including the future SDK integration gates.

### Red

- Write black-box tests before the feature implementation.
- Run them through the real Express handler and disposable PostgreSQL database.
- Make failure attributable to the missing behavior, not an undefined harness, missing database, or
  v1 `410 receiver_deprecated` response.
- Inspect durable state after invalid, duplicate, concurrent, and failure cases.

The current SDK contract increment `SDK-V2-001` through `SDK-V2-004` is green locally. The v2
Receiver's Pairing and Consent/Targeting/Internal Revocation matrices are also green locally; Event,
delivery, and production route work remain later gates.

### Green

- Implement the smallest schema, transaction, route, and authority checks that make the feature
  tests pass.
- Preserve exact path, field names, status meanings, token placement, and protocol version `0.1`.
- Run the feature matrix plus all earlier green matrices before advancing.

### Refactor

- Change internal modules, indexes, schema layout, or deployment wiring only while the contract tests
  remain green.
- Re-run restart, concurrent replay, expiry, wrong-target, and secret-redaction cases after the
  change.
- Record the runner, commit, runtime, database mode, authority fixtures, durable assertions, and
  result. Never record raw credentials.

The v2 order is:

```text
PAIR -> CONSENT/TARGET/REVOKE -> EVENT -> CLAIM -> ACK -> HTTP/operations
```

Do not begin a later green implementation while the previous feature's complete matrix is red or
while its public API decision remains open.

## Acceptance matrix for SDK compatibility

| Gate | Cloud proof required | SDK-visible proof |
|---|---|---|
| Pairing | One account-owned Connector and immutable target; safe duplicate replay | Later consent can select a real target; no SDK call yet |
| Host key | Public key registration and lookup by origin/key ID | `registerHostKey()` receives bounded `200`/`201` JSON |
| Consent create | Signed Manifest validated; opaque session and exact URL returned | `createConsentSession()` returns URL/session data |
| Browser decision | Exact-origin consent page and minimal completion message; Grant bound to target | `createReentryConsentPrompt()` accepts only the exact popup result |
| Consent status | Authenticated status read returns approved binding only to Host server | `getConsentSession()` enables Host storage of binding and safe continuation ID |
| Event ingress | Signature, key, binding, Grant, freshness, dedupe, and atomic enqueue | `sendEvent()` receives `202` acceptance or stable rejection |
| Delivery | Connector-scoped lease and replay/expiry handling | Downstream completion; no direct SDK call |
| Acknowledgement | Independent Host-effect verification and atomic close | Downstream completion; no direct SDK call |
| Operations | HTTPS/loopback, no redirects, bounded bodies/responses, readiness, redacted logs | SDK transport failures remain diagnosable and safe |

## Open gates that must remain visible

These remain separate gates and are not reasons to add SDK fallbacks:

- exact public Grant revocation route;
- Host-subject rebind/decommission semantics;
- production effect-authority adapter and invocation contract;
- Event ingress, delivery claims, and acknowledgement;
- final v2 package path, deployment profile, and external runtime evidence; and
- configured Browser to Receiver to Connector to Codex proof.

Do not hide an open decision behind an alias, fallback route, direct database access, or a copy of
the v1 implementation.

## Implementation checklist for the v2 project manager

1. Keep Pairing and Consent/Targeting/Internal Revocation as separate green feature gates with
   durable PostgreSQL evidence.
2. Run `SDK-V2-001`–`SDK-V2-004` through the actual SDK request builder and v2 handler; do not treat
   those results as deployed integration.
3. Preserve the exact popup completion message accepted by the browser SDK: emit it only after a
   successful decision, from the exact consent origin and popup, with no private values.
4. Preserve the exact SDK routes and JSON envelopes above; do not alias the deferred
   `/v0.1/consent-decisions` route into the account-first flow.
5. Add the Event, Connector claim, and acknowledgement matrices before claiming end-to-end
   completion.
6. Record local, committed, deployed, and externally verified states separately.

## Source map

- [`runtime/host-sdk/README.md`](../../../runtime/host-sdk/README.md) — SDK integration guide and
  browser/server boundary.
- [`runtime/host-sdk/src/server.mjs`](../../../runtime/host-sdk/src/server.mjs) — server methods,
  routes, transport, and bounded errors.
- [`runtime/host-sdk/src/client.mjs`](../../../runtime/host-sdk/src/client.mjs) — consent popup,
  shared UI/WebMCP action, and top-level tool registration.
- [`runtime/host-sdk/src/next.mjs`](../../../runtime/host-sdk/src/next.mjs) — thin Host route
  adapters; callbacks remain responsible for Host auth and state.
- [`reentry-core/src/host-sdk.mjs`](../../../reentry-core/src/host-sdk.mjs) and
  [`reentry-core/src/protocol.mjs`](../../../reentry-core/src/protocol.mjs) — signing and protocol
  authority.
- [`ADR-0007`](../../Decisions/ADR-0007-freeze-reentry-core-v0.1-contract-kernel.md) and
  [`ADR-0010`](../../Decisions/ADR-0010-freeze-receiver-http-and-connector-transport.md) — stable
  Core and HTTP contracts.
- [`ADR-0033`](../../Decisions/ADR-0033-adopt-cloud-receiver-v2-pairing-increment.md),
  [`TASK-014`](../../Tasks/TASK-014-build-cloud-receiver-v2-pairing.md),
  [`ADR-0035`](../../Decisions/ADR-0035-adopt-cloud-receiver-v2-consent-targeting.md),
  [`TASK-015`](../../Tasks/TASK-015-build-cloud-receiver-v2-consent-targeting.md),
  [`TASK-016`](../../Tasks/TASK-016-prepare-sdk-v2-contract-tests.md), and
  [`00-v2-build-plan.md`](00-v2-build-plan.md) — current v2 scope and red-green-refactor gates.
