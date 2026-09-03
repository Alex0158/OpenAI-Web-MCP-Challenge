# Cloud Receiver v2 — Project Manager Answers for the Build Questions

**Status:** PM answer for team acceptance; non-authoritative until recorded in the replacement ADR and Task

**Prepared:** 2026-09-02

**Answers:** [`08-v2-build-questions-for-project-manager.md`](08-v2-build-questions-for-project-manager.md)

**Audience:** Cloud Receiver v2 development team and Local Connector maintainers

## 1. Decision in one paragraph

Build the complete Cloud Receiver v2 in `saas-boilerplate/`, using its existing Prisma/PostgreSQL
database and separate email/password User and Developer sessions. Add the Receiver control plane and
the `/v0.1` protocol flow in the documented feature order. Keep `reentry-core/` and the accepted ADRs
as the protocol authority, use a real Express HTTP handler with durable PostgreSQL state, and start
local-first with a generic Host and test authorities. Do not use the retired v1 runtime, the old
Receiver database, a selected application, or a production effect service in the first increment.

This file makes the implementation defaults concrete. It does not itself accept a durable protocol,
security, or data decision. Before green implementation, the project must record these answers in a
replacement Task, ADR, and implementation/evidence record.

## 2. Decisions that affect compatibility

| Question | PM answer |
|---|---|
| Q1 | `saas-boilerplate/` is the replacement base. Build the full service in feature order; the first code increment is pairing. |
| Q2 | Users own Connectors and consent decisions. Developers administer Organizations and Host credentials. |
| Q3 | Return the raw Connector token once only. A replay returns metadata without the token; response loss requires a new pairing. |
| Q4 | One immutable server-owned delivery target per Connector. A device replacement never silently reuses a target. |
| Q5 | Use the concrete control routes in this document. Rebind is not supported in v0.1; decommission is explicit. |
| Q6 | Use the narrow synchronous Core verifier ports. A configured fake effect authority is sufficient locally; no production adapter yet. |
| Q7 | ADR-0007, ADR-0010, and the current Core modules win exactly, with no aliases. |
| Q8 | Use the bounded local profile in this document and preserve Core's existing status/code values. |
| Q9 | Use one fresh Prisma/PostgreSQL database, with `cr2_` tables and no blind old-database migration. |
| Q10 | Cloud Receiver v2 owns the replacement implementation Task; local generic end-to-end evidence is the first release gate. |

## 3. Q1 — First v2 increment and source of truth

1. **Scope:** The request authorizes the planned complete v2 service, not only the existing auth
   slice. Implementation is sequential: pairing, consent/targeting, event ingress, delivery claim,
   acknowledgement, and transport/operations.
2. **Base:** The exact implementation path is
   [`saas-boilerplate/`](../../saas-boilerplate/). Its `backend/` owns the Express API and Prisma
   persistence; its `frontend/` owns the User and Developer pages. Do not revive
   `runtime/cloud-receiver/`.
3. **Authentication:** Keep the two existing email/password flows unchanged:
   `UserAccount` uses `/login`, `/v1/auth/users`, `user_session`, and
   `cr2_user_accounts`; `DeveloperAccount` uses `/developer-login`, `/v1/auth/developers`,
   `developer_session`, and `cr2_developer_accounts`. No Google OAuth, refresh tokens, or shared
   account table is needed.
4. **Authority:** When handoff prose and code differ, use the current `reentry-core/` contract and
   accepted ADRs. Handoff documents may be corrected as editorial documentation, but the v0.1 wire
   contract is not renamed by the application layer.
5. **Ready meaning:** Red tests may be written and run once the feature contract, fixture boundary,
   and database setup are accepted. A red test must fail because the requested behavior is absent,
   not because its route, schema, or test harness is undefined. Production readiness is a later gate.

The first falsifiable outcome is `PAIR-001` through `PAIR-005` over the v2 HTTP handler and durable
PostgreSQL state. The first full milestone is the generic local flow:

```text
User pairs Connector
-> Host creates consent
-> User approves one Connector target
-> Host submits one signed Event
-> Connector claims a lease
-> test Host effect is verified
-> Connector acknowledgement succeeds and replays safely
```

## 4. Q2 — Identity, organization, Host, and browser boundaries

### 4.1 Identity mapping

1. `UserAccount` is the human who owns one or more Connectors, selects a Connector, and approves or
   declines consent.
2. `DeveloperAccount` is a product-facing operator. It owns or administers Organizations and their
   Host credentials.
3. An Organization is a separate record with one owning Developer in v2. A Developer may own more
   than one Organization. Multi-Developer membership, teams, roles, and invitations are out of
   scope until a separate decision adds them.
4. Users may create pairing sessions, see their Connectors, rename or decommission their own
   Connectors, and make account consent decisions. Host backends using an Organization API key may
   register Host keys, create/read consent sessions, submit Events, inspect Grants, and revoke
   Grants. A browser session is never accepted as proof of a Host API call.
5. Organization API keys are required for all server-to-server Host control routes. Host event
   ingress additionally requires the signed Event headers and body. Connector delivery routes use
   only the Connector credential and the exact Core claim/ack body.
6. Developers create, rotate, and revoke Organization API keys. The raw key is returned once and
   only its digest and display prefix are persisted. There is no automatic key-expiry policy in this
   first build; rotation is explicit and old keys are revoked explicitly.
7. Developers or an authenticated Host setup call register Host public signing keys. A key is
   identified by Organization, Host ID, normalized issuer origin, and `key_id`. Repeating the same
   public key is idempotent. Reusing a `key_id` with different public bytes or origin returns
   `409 host_key_conflict`; rotation registers a new `key_id` before revoking the old key. A revoked
   key is never accepted for new signatures.
8. Browser session rules remain:
   - `user_session` and `developer_session` are separate httpOnly JWT cookies;
   - default lifetime is 7 days, bounded to 1–30 days by `SESSION_DAYS`;
   - cookies are `Secure` in production, `SameSite=Lax`, and cleared on logout;
   - state-changing browser requests require the matching same-origin `Origin` and JSON content type;
   - missing, absent, or cross-origin CSRF origin checks return `403 csrf_origin_invalid`;
   - CORS allows only the configured `FRONTEND_URL` and credentials, never `*` with credentials;
   - the consent page may be opened by a top-level navigation, but its decision POST is same-origin.
9. Developer accounts are product-facing in v2, but they are not a general role system. Do not add
   role inheritance or cross-Organization permissions.

### 4.2 Existing environment names

Use the existing clone configuration and keep values out of tracked documentation:

- `CLOUD_RECEIVER_RUNTIME_DATABASE_URL` is preferred at runtime; for Supabase use its session-mode
  pooler URL.
- `DIRECT_URL` is preferred for Prisma migrations when supplied.
- `DATABASE_URL` is the local/generic fallback.
- `JWT_SECRET`, `SESSION_DAYS`, `FRONTEND_URL`, and `COOKIE_DOMAIN` keep their current meaning.
- `CLOUD_RECEIVER_CONNECTOR_TOKEN_SECRET` and `CLOUD_RECEIVER_VERIFICATION_ORIGIN` may be wired for
  the later Connector composition, but their names do not authorize a different protocol.

## 5. Q3 — Pairing replay and Connector-token custody

### 5.1 Selected rule

The first successful claim returns the raw Connector token once. The Receiver stores only its SHA-256
digest. A replay of the consumed code returns the same pairing and Connector metadata with
`duplicate: true`, but no raw token. If the first response is lost, the user creates a new pairing.
Do not add encrypted bearer-token storage in v2; it introduces key ownership, rotation, backup, and
recovery work that is not required for the first reliable flow.

The exact response shapes are:

```json
// First successful claim: 200
{
  "type": "webmcp.connector_credentials",
  "protocol_version": "0.1",
  "pairing_id": "pairing_123",
  "connector_id": "connector_123",
  "connector_token": "opaque-secret",
  "connector_expires_at": "2026-10-02T12:00:00.000Z",
  "duplicate": false
}
```

```json
// Replay after the token was already delivered: 200
{
  "type": "webmcp.connector_credentials",
  "protocol_version": "0.1",
  "pairing_id": "pairing_123",
  "connector_id": "connector_123",
  "connector_expires_at": "2026-10-02T12:00:00.000Z",
  "duplicate": true
}
```

The replay response is an intentional narrow change from the earlier sentence that said a replay
returns the same credentials including the raw token. The Local Connector account-pairing client now
accepts the two exact response shapes. A tokenless duplicate is surfaced as
`connector_credentials_already_exists`; it never fabricates, stores, or returns a fake, empty, or
digest value in `connector_token`. The CLI tells the user to use the existing credential or create a
new pairing.

### 5.2 Pairing identity and limits

1. The pairing code is the enrollment/idempotency identity. `device_name` is display metadata only;
   it never proves account or Connector identity.
2. `PAIR-004` is a persistence/fixture invariant, not an extra public identity field. Because the
   v0.1 claim body contains only `pairing_code` and `device_name`, tests must arrange a conflicting
   stored account/Connector context or attempt to bind the consumed code through a second account.
   The service must return `409 account_pairing_identity_conflict` and create no second Connector.
3. Format is exactly eight uppercase hexadecimal characters (`^[A-F0-9]{8}$`), generated with a
   cryptographically secure random source. Lifetime is 10 minutes. There are at most five failed
   claim attempts; the sixth failure returns `410 pairing_expired` and the code cannot be claimed.
   A valid duplicate replay does not consume another attempt.
4. Pairing creation returns `201`; an idempotent replay of the same not-yet-consumed session may
   return `200` with `duplicate: true`. Claim success and code consumption are one database
   transaction. No code or raw Connector token is written to logs or evidence.

## 6. Q4 — Connector and delivery-target lifecycle

1. One Connector maps to exactly one immutable `delivery_target_id`. One User may have multiple
   Connectors/devices.
2. The Receiver generates the target during the first successful claim, in the same transaction that
   creates the Connector. The pairing request does not supply a target.
3. Connector state is represented by `created_at`, `expires_at`, and nullable `revoked_at`.
   Effective Connector eligibility is `revoked_at IS NULL` and `expires_at > now`.
4. Credential rotation replaces the stored token digest in place and keeps the same Connector and
   target. It invalidates the old token immediately. Re-pairing a replacement device creates a new
   Connector and new target.
5. Account operations are explicit. The v2 account surface may use:
   - `POST /v0.1/account/connectors/{connector_id}/rename` with `{ "device_name": "New name" }`;
   - `POST /v0.1/account/connectors/{connector_id}/revoke` with `{}`.

   Both require the User session and same-origin CSRF checks. Rename changes display metadata only.
   Revoke/decommission invalidates the Connector credential and makes its target permanently
   ineligible. It does not set Grant `revoked_at`: only the authenticated Host Grant-control route
   owns Grant revocation. The Host must revoke any Grants it no longer wants to authorize. The exact
   raw token is never returned by either route.
6. When a Connector expires or is revoked, pending deliveries for its target are marked `cancelled`
   with a bounded terminal reason on the next claim/acknowledgement transaction. They are not
   deleted. Leased deliveries cannot be claimed again and cannot be acknowledged with the revoked
   Connector credential. Acknowledged history remains unchanged.
7. A decommissioned target is never reused. A new device always gets a new target.
8. There is no heartbeat or inbound device connection. A successful outbound claim proves only that a
   currently eligible Connector reached the Receiver. No claim means “not currently observed,” not a
   durable offline status.

## 7. Q5 — Consent, Grant status, revocation, and rebind API

The following are the v2 control-plane routes. They are separate from the frozen Core delivery routes
in [`ADR-0010`](../Decisions/ADR-0010-freeze-receiver-http-and-connector-transport.md).

### 7.1 Host-key registration and revocation

`POST /v0.1/host-keys` requires `Authorization: Bearer <organization-api-key>` and JSON:

```json
{
  "host_id": "host_123",
  "issuer_origin": "https://host.example",
  "key_id": "host-key-1",
  "public_key_pem": "-----BEGIN PUBLIC KEY-----..."
}
```

The origin is normalized using the Core origin rules. A new key returns `201`; an identical replay
returns `200` with `duplicate: true`. The response fields are exactly:

```json
{
  "type": "webmcp.reentry_host_key",
  "protocol_version": "0.1",
  "host_id": "host_123",
  "issuer_origin": "https://host.example",
  "key_id": "host-key-1",
  "status": "active",
  "duplicate": false
}
```

`POST /v0.1/host-keys/{host_id}/{key_id}/revoke` requires the same Organization API key and body
`{}`. It returns `200` with the same shape and `status: "revoked"`. Repeating revocation returns
`duplicate: true` and the original `revoked_at` is retained. A different public key under an existing
identity is `409 host_key_conflict`; it is never overwritten.

### 7.2 Create and retrieve consent

`POST /v0.1/consent-sessions` requires the Organization API key and the exact body:

```json
{
  "host_subject_ref": "user_123",
  "expected_origin": "https://host.example",
  "manifest": { "...": "signed Manifest" }
}
```

The Receiver validates the signed Manifest through Core, requires its issuer origin to match
`expected_origin`, and stores only a digest of `host_subject_ref`. The first request returns `201`;
an identical request for the same Manifest/session returns `200` with `duplicate: true`. The response
fields are:

```json
{
  "type": "webmcp.reentry_consent_session",
  "protocol_version": "0.1",
  "consent_session_id": "consent_session_123",
  "challenge": { "...": "Core public challenge" },
  "consent_url": "https://receiver.example/consent?token=opaque",
  "expires_at": "2026-09-02T12:10:00.000Z",
  "duplicate": false
}
```

The Host may see the URL and public challenge, but never account identity, Connector token, target,
subject ID, or private Grant fields. Consent lifetime is the minimum of 10 minutes, Manifest offer
expiry, and the effective Grant expiry.

`GET /consent?token=<token>` is the account consent page. It requires a User session; an unauthenticated
visitor is redirected to `/login` with a safe encoded return path. An unknown token returns `404
consent_token_invalid`; an expired known session returns `410 consent_session_expired`. The token is
accepted only in this page URL and is never logged or placed in a response other than the page URL.

### 7.3 Account decision

`POST /v0.1/account-consent-decisions` requires the User session, same-origin CSRF checks, and JSON.
Approve has exactly:

```json
{
  "consent_token": "opaque",
  "action": "approve",
  "connector_id": "connector_123"
}
```

Decline has exactly:

```json
{
  "consent_token": "opaque",
  "action": "decline"
}
```

The response is `200`:

```json
{
  "type": "webmcp.reentry_account_consent_decision",
  "protocol_version": "0.1",
  "consent_session_id": "consent_session_123",
  "challenge_id": "challenge_123",
  "status": "approved",
  "duplicate": false
}
```

Approval, one-subject/one-target binding, and Grant creation are one database transaction. A replay
of the same decision returns the same terminal result with `duplicate: true`; an opposite action is
`409 consent_already_decided`. A User may select only an eligible Connector they own. The Host never
receives the account session or Connector credential.

### 7.4 Status read and Grant inspection

`GET /v0.1/consent-sessions/{consent_session_id}` requires the Organization API key and has no body.
It returns `200`:

```json
{
  "type": "webmcp.reentry_consent_status",
  "protocol_version": "0.1",
  "consent_session_id": "consent_session_123",
  "challenge_id": "challenge_123",
  "status": "approved",
  "effective_status": "active",
  "expires_at": "2026-09-02T12:10:00.000Z",
  "binding": { "...": "Core public binding" }
}
```

`status` is the persisted decision fact: `pending`, `approved`, or `declined`. For a pending session,
`effective_status` is `null` before expiry and `expired` after expiry. For an approved session it is
the Core-derived Grant state: `active`, `expired`, `exhausted`, or `revoked`. A declined session has
`effective_status: null` and no binding. The binding is included only for approval and uses the exact
Core public binding fields; it does not expose account, Connector, target, or Grant ID.

`GET /v0.1/grants/{binding_id}` requires the Organization API key and directly maps the Core
`inspectGrant` summary. Its `status` is already the effective Grant status, so do not rename it or
add a second status field to the Core response. Control authorization is checked before Grant lookup.

### 7.5 Grant revocation

`POST /v0.1/grants/{binding_id}/revoke` requires the Organization API key and exact body `{}`. The
HTTP adapter resolves the Organization API key to the internal `grantControlAuthority`; callers never
provide a Core `controlToken`.

The first and replay response is the exact Core revocation shape:

```json
{
  "type": "webmcp.receiver_grant_revocation",
  "protocol_version": "0.1",
  "binding_id": "binding_123",
  "status": "revoked",
  "revoked_at": "2026-09-02T12:05:00.000Z",
  "duplicate": false
}
```

The first authorized call returns `duplicate: false`; a replay returns `duplicate: true` with the
stored `revoked_at`. An unknown binding is `404 grant_not_found` after Organization authentication.
Revocation is an irreversible compare-and-set on `revoked_at`. It prevents new Event acceptance and
new/replayed claims, preserves all Event/delivery/effect history, and allows only a pre-revocation
effect confirmation to converge when all other Core lease checks pass.

### 7.6 Rebind and decommission

There is **no same-subject rebind route in protocol v0.1**. This is the selected simple behavior:

- decommission the old Connector through the explicit account revoke route in §6;
- revoke the old Grant through the Host Grant route when the Host no longer authorizes it;
- pair the replacement device, which creates a new target;
- use a new Host subject reference for a new consent flow.

Existing Grants for a decommissioned Connector are not valid for new work; acknowledged records remain
history. Approval replay never moves a Host subject. If the product requires moving the same Host
subject to a new target while preserving that subject reference, stop at a new decision gate and add
a versioned rebind contract before implementation. Do not infer one from this document.

### 7.7 Approval replay and retention

- Replaying the same consent session/Manifest returns the existing decision and existing Grant with
  `duplicate: true`; it creates no second Grant.
- A new consent session with a new Manifest for the same subject and same eligible target creates a
  new one-run Grant. It does not reuse an expired, exhausted, or revoked Grant.
- A different target for an existing v0.1 Host subject returns `409 host_subject_binding_conflict`.
- Declined and expired consent records remain queryable to the owning Organization indefinitely in v2;
  no automatic deletion job is part of the first build. A future retention policy requires its own
  data-lifecycle decision.

## 8. Q6 — Host-effect authority

1. The Host backend or a separate trusted Host-effect service owns effect issuance. The Receiver owns
   verification and acknowledgement state; the Local Connector does not mint or infer effect tokens.
2. The issuer returns an opaque `effect_token` only after the exact Host effect is committed. A
   trusted Host/local integration supplies that token to the acknowledgement caller separately from
   the Connector's normal activation context.
3. The Connector may submit the token in the exact acknowledgement body, but it must not create the
   token. In a later integration, a trusted Host/local component may submit the acknowledgement on
   behalf of the Connector if that preserves the same Core body and lease identity.
4. The Receiver uses the existing narrow synchronous port:

   ```text
   effectAuthority.verifyEffect({ effectToken, expected })
   -> { type, protocol_version, effect_id, delivery_id, event_id,
        correlation_id, workflow_id, outcome, confirmed_at }
   ```

   `expected` contains the exact delivery, Event, correlation, workflow, canonical URL,
   `human_boundary`, and outcome. Core owns the time-window checks. There is no network call or
   asynchronous verifier in the first v2 composition; therefore the v2 port has no remote timeout.
   A future remote adapter must be separately accepted and must enforce a 5-second timeout outside
   Core.
5. Verification is read-only and idempotent. If it succeeds but the database commit fails, retry the
   same acknowledgement with the same Connector, lease, and effect token. The transaction rechecks
   the current lease and effect identity. A unique `effect_id` prevents a second effect from being
   attached to another delivery.
6. Missing authority is a startup/readiness configuration failure, not permission to acknowledge
   from process success. A mismatched, expired, future, post-revocation, or wrong-context attestation
   returns `403 host_effect_invalid` (or the exact narrower Core code such as
   `host_effect_time_invalid`) and does not mutate delivery state. A bounded persistence failure is
   `503 receiver_busy`; an unexpected failure is `500 receiver_internal_error`.
7. A fake authority is sufficient for the first local build only. It must be injected through the
   same port and appear in evidence as a test fixture. Production effect ownership, credentials, and
   the selected Host application remain deferred.

## 9. Q7 — Exact protocol contract

1. Yes. ADR-0007, ADR-0010, `reentry-core/src/protocol.mjs`, `receiver-core.mjs`,
   `receiver-delivery.mjs`, and `cloud-receiver-http.mjs` are authoritative for the protocol. No
   aliases or shorthand field names are accepted.
2. Correct the handoff prose before writing red tests. Tests must use the exact names and response
   fields below.
3. Canonical JSON sorts object keys lexicographically and encodes UTF-8. Event signatures are Ed25519
   over the UTF-8 bytes of `<epoch-seconds>.<canonical-event-body>` and use unpadded base64url.
4. Signed event delivery timestamps allow ±5 minutes from the Receiver clock. Event `occurred_at`
   and effect `confirmed_at` may be at most 60 seconds in the future. Manifest future skew is also
   60 seconds. Effect confirmation must be after lease issue, strictly before lease and Grant expiry,
   and strictly before revocation.
5. Issuer origins are canonical HTTP(S) origins; HTTP is permitted only for literal loopback in the
   local profile. Canonical URLs have no credentials or fragment and remain on the declared origin.
   Key IDs resolve by issuer origin and key ID. The exact signature headers are:
   `WebMCP-Reentry-Key-Id`, `WebMCP-Reentry-Timestamp`, and `WebMCP-Reentry-Signature`.
6. `event_sequence == 1` is mandatory for protocol `0.1`.
7. `state_version` is carried for page/state revalidation. It is not independent proof of Host truth;
   the Host remains responsible for loading current business state before signing an Event.
8. Reusing an `event_id` with different canonical bytes returns `409 event_identity_conflict` and
   does not mutate the existing Event, Grant, delivery, or run budget.
9. `human_boundary` and the continuation mode originate from the signed Manifest's Grant request.
   The Receiver copies the approved boundary into the private Grant and Receiver-created receipt.
   The Event carries its exact Core fields; the acknowledgement effect attestation carries its exact
   delivery context and fixed outcome. No browser or Connector field can replace those facts.
10. `workflow_id` is used consistently across Manifest workflow, Event, receipt, public binding,
    delivery lease continuation, and Host-effect attestation. The Manifest object may contain a
    nested `workflow`; that is not an alias for the Event field.

## 10. Q8 — Time, retry, state, and error profile

### 10.1 Selected local deployment values

| Value | v2 setting | Rule |
|---|---:|---|
| Pairing code | 10 minutes; 5 failed attempts | Eight uppercase hex characters; successful duplicate replay does not count. |
| Consent session | 10 minutes | Decision window is also bounded by Manifest offer and effective Grant expiry. |
| Maximum Grant lifetime | 1 hour | Core uses the lower of this value and the signed Manifest request. |
| Grant runs | Exactly 1 | Approval starts at `runs_remaining = 1`; accepted Event atomically consumes it to `0`. |
| Connector credential | 30 days | Explicit revoke or in-place rotation invalidates it immediately. |
| Event delivery timestamp | ±5 minutes | Uses Core delivery clock skew. |
| Event/effect future skew | 60 seconds | Future values beyond this are rejected. |
| Lease duration | 60 seconds | Actual lease is capped by Grant and Connector authority expiry. |
| Maximum delivery attempts | 3 | Snapshotted on delivery creation; exhausted delivery is terminal. |
| Connector poll interval | 5 seconds | Outbound polling only; no push or heartbeat. |
| Delivery HTTP request timeout | 5 seconds | Claim/ack callers must not retry the same request automatically; later polling is a new request. |
| Pairing HTTP request timeout | 20 seconds | Applies only to the account pairing claim flow. |

### 10.2 State and revocation behavior

- Pending deliveries are cancelled on the next claim/acknowledgement transaction after their Grant or
  Connector authority is expired/revoked. No sweeper is required for correctness.
- A leased delivery receives no new or replayed lease after Grant revocation. A pre-revocation effect
  may converge only when its `confirmed_at` is before `revoked_at`, before lease/Grant expiry, and all
  Connector/lease checks still pass.
- Connector credential revocation is a hard identity cutoff: the revoked credential cannot claim or
  acknowledge, even if a prior effect was confirmed.
- Delivery states remain exactly `pending`, `leased`, `retry_exhausted`, `acknowledged`, or
  `cancelled`. No hidden retry queue or fallback transport is added.

### 10.3 Exact status and error matrix

The HTTP adapter preserves typed Core statuses. Do not normalize every failure into one generic 4xx.

| Situation | Status | Code |
|---|---:|---|
| Unknown route | `404` | `http_route_not_found` |
| Wrong method | `405` with `Allow: POST` where applicable | `http_method_not_allowed` |
| Malformed JSON, empty body, wrong top-level shape, or unknown fields | `400` | `http_body_invalid` |
| Non-JSON content type | `415` | `http_content_type_invalid` |
| Request or protocol payload exceeds its limit | `413` | `http_body_too_large` or the exact Core size code |
| Event signature/timestamp authentication failure | `401` | `event_signature_invalid` or `event_delivery_timestamp_outside_window` |
| Missing/invalid User session | `401` | `session_required` |
| Invalid Organization API key, Connector identity, control authority, or effect authority | `403` | `organization_auth_invalid`, `connector_identity_invalid`, `grant_control_invalid`, or `host_effect_invalid` |
| Invalid but well-formed protocol value, origin, scope, or sequence | `422` | The exact Core code, such as `event_scope_invalid` or `event_sequence_invalid` |
| Unknown Grant in the Grant-control surface | `404` | `grant_not_found` |
| Expired Grant or consent window | `410` | `grant_expired`, `grant_window_expired`, or `consent_session_expired` |
| Revoked Grant | `422` | `grant_revoked` |
| Exhausted Grant or identity/state conflict | `409` | `grant_exhausted`, `event_identity_conflict`, `consent_already_decided`, or the specific conflict code |
| Stale/invalid delivery lease | Preserve the Core code/status | Usually `403 delivery_lease_invalid`; `409` for `claim_token_retired` or a race |
| Bounded database contention or temporary persistence failure | `503` with `Retry-After: 1` | `receiver_busy` |
| Unexpected exception | `500` | `receiver_internal_error` |

The `422 grant_revoked` choice follows the current Core `ReceiverScopeError` contract and
`ADR-0010`'s rule to preserve typed Core status. A future decision may remap it, but that would need
an ADR and corresponding Connector/Host test changes.

### 10.4 Health and no-work responses

Add these v2 operational routes while retaining the clone's existing `/health` and `/health/live`
only as SaaS-shell routes:

- `GET /healthz` is process liveness. Healthy response: `200` and exactly
  `{ "status": "ok" }`. It does not query the database.
- `GET /readyz` is dependency readiness. When Prisma/PostgreSQL is reachable, response is `200` and
  exactly `{ "status": "ready" }`. When it is unavailable or migrations are not applied, response
  is `503` and exactly `{ "status": "not_ready" }`. It exposes no SQL or exception text.
- Both use JSON, `Cache-Control: no-store`, and safe headers. Neither claims delivery or Host-effect
  success.

For `POST /v0.1/delivery-claims` with no eligible work, return `204` with an empty body and exactly
these headers: `Cache-Control: no-store`, `Content-Length: 0`, `Pragma: no-cache`, and
`X-Content-Type-Options: nosniff`. Do not send `Content-Type`. The Connector must not parse a body
or retry automatically because of the 204.

## 11. Q9 — Persistence, Prisma, and Supabase boundary

1. Console identity and Receiver authority share one PostgreSQL database. This keeps the first
   service small and lets consent/Connector ownership use the same User identity transactionally.
2. Use a fresh Supabase project/database for the hosted profile. Do not point Prisma migrations at
   the retired Receiver database.
3. There is no old-database migration in the first build. If reuse becomes necessary, stop and obtain
   an approved Prisma baseline, pre-migration backup, restore test, and recovery owner before changing
   `DIRECT_URL` or running `prisma migrate deploy`.
4. Keep the public schema and prefix every v2 table with `cr2_`. Prisma's
   [`backend/prisma/schema.prisma`](../../saas-boilerplate/backend/prisma/schema.prisma) remains the
   schema source of truth. Existing auth tables stay `cr2_user_accounts` and
   `cr2_developer_accounts`.
5. Storage policy:
   - passwords: bcrypt hashes only;
   - Organization API keys, pairing codes, Connector tokens, consent tokens, claim/lease tokens, and
     any internal control bearer: SHA-256 digest only;
   - Host subject references: digest only;
   - Host public keys: stored public bytes; Host private keys never enter the Receiver database;
   - Manifest, Event, receipt, and successful effect attestation: bounded canonical JSON/private
     server records; no raw bearer token is included;
   - application-level encryption is not added in v2; hosted production relies on the selected
     managed database's encryption-at-rest controls, which must be verified before deployment;
   - public responses contain only the exact fields defined by the relevant route.
6. Required transaction boundaries:
   - pairing claim: validate digest, consume code, create Connector, and create target atomically;
   - consent approval: decision, one-subject/one-target binding, and Grant creation atomically;
   - Event acceptance: run consumption, Event insert, and first Delivery insert atomically;
   - claim: token replay lookup, pending selection, cancellation/exhaustion, and lease creation
     atomically;
   - Grant revoke: compare-and-set `revoked_at` atomically;
   - acknowledgement: verify effect outside the transaction, then re-read lease, effect identity,
     and state and commit acknowledgement atomically;
   - Connector decommission: revoke the credential, mark the target ineligible, and cancel pending
     work atomically; Grant `revoked_at` remains Host-controlled.

   Use database uniqueness, conditional updates, and bounded transaction handling for races. A
   contention/serialization failure returns `503 receiver_busy` with no blind automatic retry.
7. Persistence behavior:
   - readiness is `503 not_ready` when the database is unavailable or migrations are incomplete;
   - request-time bounded contention/unavailability is `503 receiver_busy` with `Retry-After: 1`;
   - migration failure stops startup; no in-memory fallback is allowed;
   - local tests use a disposable PostgreSQL database and isolated data per suite/case;
   - hosted backups/restores use the Supabase operational boundary and must be tested before hosted
     claims are made;
   - v2 retains decision, Event, Delivery, acknowledgement, and revocation history indefinitely;
     no cleanup worker is needed for correctness.
8. Yes. Local PostgreSQL is first. Supabase is a later deployment profile after the local protocol
   matrix is green, migrations are reviewed, and readiness/backup evidence exists.

### 11.1 Minimal Prisma record set

Do not create a general event bus, workflow engine, queue service, Redis layer, or separate effect-token
vault. The minimum relational records are:

| Table | Important fields and constraints |
|---|---|
| `cr2_user_accounts` | Existing User auth table. |
| `cr2_developer_accounts` | Existing Developer auth table. |
| `cr2_organizations` | `id`, owning `developer_id`, name, timestamps. One owner in v2. |
| `cr2_organization_api_keys` | Organization, digest, display prefix, timestamps, `revoked_at`; digest unique. |
| `cr2_host_keys` | Organization, Host ID, issuer origin, key ID, public key, state, timestamps; identity unique. |
| `cr2_pairing_sessions` | User, code digest, expiry, failed attempts, consumed time, Connector ID, device name. |
| `cr2_connectors` | User, Connector ID, target ID, token digest, expiry, `revoked_at`, device name; target unique. |
| `cr2_host_subject_bindings` | Organization, subject-ref digest, Connector/target, created/decommissioned facts; organization + subject digest unique for v0.1. |
| `cr2_consent_sessions` | Session/challenge IDs, token digest, Organization, subject digest, Manifest JSON, expiry, decision status, decision time, Grant ID. |
| `cr2_grants` | Grant/binding IDs, binding target, scope fields, receipt JSON, expiry, `runs_remaining`, `revoked_at`, timestamps. |
| `cr2_events` | Unique Event ID, Grant, canonical Event body, acceptance JSON, received time. |
| `cr2_deliveries` | Unique Delivery/Event relation, Grant/target, exact state, max attempts, current lease digests/times, effect ID/attestation, acknowledgement and terminal facts. |

Persist the successful effect attestation on the Delivery row in the first schema; do not add a
separate effect table unless a later audit requirement proves it necessary. Add indexes for the
unique identifiers, target plus eligible delivery state, current lease digest, and effect ID.

## 12. Q10 — Ownership, test runner, rollout, and evidence

1. The **Cloud Receiver v2 development team** owns the replacement implementation Task. The
   **project manager** owns this decision answer and coordinates the replacement ADR. The **Local
   Connector maintainers** own compatibility review and the required tokenless-replay client change.
   Assign named people in the Task before the first green run.
2. The implementation path is exactly `saas-boilerplate/`. Core remains a dependency/reference
   boundary; v1 remains retired.
3. First falsifiable outcome: `PAIR-001`–`PAIR-005` pass over the v2 HTTP handler with durable
   PostgreSQL. First complete outcome is the generic local flow in §3. Non-goals are selected-app
   integration, Vercel deployment, production Supabase claims, remote effect authority, WebSockets,
   push delivery, inbound Mac connections, multi-region coordination, billing, refresh tokens,
   multi-Developer roles, and a general job/queue system.
4. Authoritative commands:
   - Cloud Receiver v2 feature and end-to-end cases: from `saas-boilerplate/`,
     `npm test -w backend -- --runInBand`; the exit-gate tests must use a running Express handler and
     durable PostgreSQL, not only service mocks.
   - Cloud Receiver type/build check: from `saas-boilerplate/`,
     `npm run type-check` and `npm run build`.
   - Core contract/conformance: from `reentry-core/`, `npm run verify`.
   - Local Connector compatibility: from `runtime/local-connector/`, `npm run verify`.
   - Host SDK compatibility where the control routes are exercised: from `runtime/host-sdk/`,
     `npm run verify`.

   Each feature file remains the test-ID authority: `PAIR`, `CONSENT`, `TARGET`, `REVOKE`, `EVENT`,
   `CLAIM`, `ACK`, and `HTTP`. A feature is not green until its full matrix and all earlier matrices
   pass. Refactoring is allowed only while that combined matrix stays green.
5. Yes. Red/green tests may use fake Host signing, Connector authority, consent authority, effect
   authority, account fixtures, and a generic Host. Fakes must cross the same injected ports as the
   production composition. They must not be presented as production evidence.
6. The first rollout is local-only against disposable PostgreSQL. Do not target Vercel or Supabase
   first. Hosted deployment follows local green results, migration review, readiness evidence, and
   an accepted production effect-authority owner.
7. Compatibility tests use the Local Connector and Core from a clean, recorded repository commit.
   The current checkout baseline is `f71c78d17725cc19c921bf9f945caebda53ae6db`, but that checkout
   is dirty and is not a release baseline. Before `PAIR-002`, record a clean commit containing the
   accepted tokenless-replay client/test change and use that exact SHA in the evidence record. Keep
   the existing Core HTTP policy: JSON, no cache, no credentials, no redirect following, no automatic
   retry, exact snake_case claim/ack fields, 5-second delivery timeout, and 20-second pairing
   timeout.
8. Evidence levels:
   - **Locally verified:** all required tests pass on Node 24 with the stated disposable PostgreSQL
     profile, real HTTP handler, and named fake authorities; durable-state assertions are recorded.
   - **Committed:** the verified changes exist in a named commit and exact task-owned paths are
     recorded.
   - **Deployed:** a known environment runs that commit, `/healthz` and `/readyz` were read back, and
     its database/effect configuration is identified without exposing secrets.
   - **Externally verified:** an independent Host/Connector client performs the complete flow against
     the deployed endpoint and records sanitized request/response evidence.

   Never use a local test, a commit, or a plan as proof of deployment or external verification.
9. The selected application is not required before generic Receiver implementation. The generic Host
   fixture must prove the protocol and authority boundaries first. A selected application is a later
   integration task with its own Host-effect owner and business-effect evidence.

## 13. Actions before the first green implementation

1. Accept or amend this document and record the result in a replacement Task and ADR.
2. Register the v2 implementation/evidence record with the exact owner, path, Node 24 runtime, local
   PostgreSQL setup, and commands above.
3. Record the Q3 compatibility exception as a companion Local Connector change. Update `PAIR-003`
   in the executable Connector contract before calling pairing complete.
4. Add the v2 Prisma models/migration only in `saas-boilerplate/`; use a fresh local database and do
   not point at the retired Receiver database.
5. Write the first red pairing tests so they fail for absent behavior, then implement only the
   smallest green behavior. Do not begin Consent green work until every Pairing test is green.
6. Keep production effect integration, same-subject rebind, hosted deployment, and selected-app
   claims visibly blocked as deferred decisions rather than silently approximating them.

## 14. Source documents

- [`08-v2-build-questions-for-project-manager.md`](08-v2-build-questions-for-project-manager.md)
- [`v2-build/00-v2-build-plan.md`](v2-build/00-v2-build-plan.md)
- [`v2-build/01-pairing-and-credentials.md`](v2-build/01-pairing-and-credentials.md)
- [`v2-build/02-consent-targeting-and-revocation.md`](v2-build/02-consent-targeting-and-revocation.md)
- [`v2-build/03-signed-event-ingress.md`](v2-build/03-signed-event-ingress.md)
- [`v2-build/04-delivery-claim-and-lease.md`](v2-build/04-delivery-claim-and-lease.md)
- [`v2-build/05-delivery-acknowledgement.md`](v2-build/05-delivery-acknowledgement.md)
- [`v2-build/06-transport-and-operations.md`](v2-build/06-transport-and-operations.md)
- [`v2-build/07-decision-gates-and-evidence.md`](v2-build/07-decision-gates-and-evidence.md)
- [`../../saas-boilerplate/README.md`](../../saas-boilerplate/README.md)
- [`../../reentry-core/src/protocol.mjs`](../../reentry-core/src/protocol.mjs)
- [`../../reentry-core/src/receiver-core.mjs`](../../reentry-core/src/receiver-core.mjs)
- [`../../reentry-core/src/receiver-delivery.mjs`](../../reentry-core/src/receiver-delivery.mjs)
- [`../../reentry-core/src/cloud-receiver-http.mjs`](../../reentry-core/src/cloud-receiver-http.mjs)
- [`../../runtime/local-connector/src/pairing-client.mjs`](../../runtime/local-connector/src/pairing-client.mjs)
