# Cloud Receiver v2 Feature 2 — Implementation Summary

Feature 2 is complete and locally verified in `saas-boilerplate`; the consent-popup handoff is
included, and no retired v1 implementation, compatibility routes, public Grant routes, or Event
work were added.

## Implemented routes

| Route | Success |
|---|---|
| `POST /v0.1/host-keys` | `201` new, `200` duplicate |
| `POST /v0.1/consent-sessions` | `201` new, `200` idempotent duplicate |
| `GET /v0.1/consent-sessions/:consentSessionId` | `200` |
| `POST /v0.1/account-consent-decisions` | `200` |
| `GET /consent?token=...` | `302` unauthenticated, `200` authenticated HTML |

Public Grant routes and Event ingress are intentionally absent. Unknown `/v0.1` routes return
`404 http_route_not_found`.

## Request and response schemas

`POST /v0.1/host-keys` requires an organization API-key bearer token.

```json
{
  "host_id": "string",
  "issuer_origin": "https://host.example",
  "key_id": "string",
  "public_key_pem": "Ed25519 PEM string"
}
```

Response:

```json
{
  "type": "webmcp.reentry_host_key",
  "protocol_version": "0.1",
  "host_id": "string",
  "issuer_origin": "https://host.example",
  "key_id": "string",
  "status": "active",
  "duplicate": false
}
```

`POST /v0.1/consent-sessions` requires the same organization API key.

```json
{
  "host_subject_ref": "opaque host subject reference",
  "expected_origin": "https://host.example",
  "manifest": {
    "type": "webmcp.reentry_manifest",
    "protocol_version": "0.1",
    "manifest_id": "string",
    "correlation_id": "string",
    "issuer_origin": "https://host.example",
    "issued_at": "ISO timestamp",
    "offer_expires_at": "ISO timestamp",
    "workflow": {
      "id": "string",
      "type": "string",
      "state_version": 1,
      "canonical_url": "https://host.example/path"
    },
    "display": {
      "title": "string",
      "reason": "string"
    },
    "grant_request": {
      "event_type": "string",
      "grant_expires_at": "ISO timestamp",
      "max_runs": 1,
      "human_boundary": "string"
    },
    "signature": {
      "algorithm": "Ed25519",
      "key_id": "string",
      "value": "base64url Ed25519 signature"
    }
  }
}
```

Response:

```json
{
  "type": "webmcp.reentry_consent_session",
  "protocol_version": "0.1",
  "consent_session_id": "string",
  "challenge": {
    "challenge_id": "string",
    "manifest_id": "string",
    "correlation_id": "string",
    "status": "pending",
    "issuer_origin": "https://host.example",
    "offer_expires_at": "ISO timestamp",
    "workflow": {
      "id": "string",
      "type": "string",
      "canonical_url": "https://host.example/path"
    },
    "display": {
      "title": "string",
      "reason": "string"
    },
    "grant_scope": {
      "event_type": "string",
      "expires_at": "ISO timestamp",
      "max_runs": 1,
      "human_boundary": "string"
    }
  },
  "consent_url": "http://localhost:4000/consent?token=<opaque-token>",
  "expires_at": "ISO timestamp",
  "duplicate": false
}
```

`POST /v0.1/account-consent-decisions` requires the existing email/password user session,
same-origin JSON, and either:

```json
{
  "consent_token": "43-character base64url token",
  "action": "approve",
  "connector_id": "connector identifier"
}
```

or:

```json
{
  "consent_token": "43-character base64url token",
  "action": "decline"
}
```

Response:

```json
{
  "type": "webmcp.reentry_account_consent_decision",
  "protocol_version": "0.1",
  "consent_session_id": "string",
  "challenge_id": "string",
  "status": "approved",
  "duplicate": false
}
```

`GET /v0.1/consent-sessions/:consentSessionId` response:

```json
{
  "type": "webmcp.reentry_consent_status",
  "protocol_version": "0.1",
  "consent_session_id": "string",
  "challenge_id": "string",
  "status": "pending",
  "effective_status": null,
  "expires_at": "ISO timestamp",
  "binding": null
}
```

Approved sessions return a public binding containing:

```json
{
  "type": "webmcp.reentry_binding",
  "protocol_version": "0.1",
  "binding_id": "string",
  "correlation_id": "string",
  "workflow_id": "string",
  "event_type": "string",
  "expires_at": "ISO timestamp",
  "runs_remaining": 1,
  "status": "active"
}
```

Targeting is implicit in approval: a Host subject receives one durable target binding. A later
approval with another Connector returns a conflict and creates no Grant.

After a successful popup decision, the page emits only this public completion message:

```js
window.opener.postMessage(
  {
    type: "reentry.consent.complete",
    consent_session_id: consentSessionId,
    status: action === "approve" ? "approved" : "declined"
  },
  window.location.origin
);
```

The handoff is inside the successful decision branch, so failed decisions emit no message. It
contains no consent token, Connector id, binding, API key, or other private value.

## Stable error codes

- `organization_auth_invalid` — `403`
- `http_body_invalid` — `400`
- `host_key_invalid` — `400`
- `host_key_conflict` — `409`
- `host_key_not_registered` — `401`
- `manifest_invalid` — `422`
- `manifest_signature_invalid` — `400` or `401`
- `manifest_origin_mismatch` — `422`
- `manifest_issued_in_future` — `422`
- `manifest_expired` / `consent_expired` — `410`
- `manifest_identity_conflict` — `409`
- `consent_token_invalid` — `403` for decisions, `404` for the consent page
- `consent_session_expired` — `410`
- `consent_account_mismatch` — `403`
- `consent_already_decided` — `409`
- `connector_not_available` — `409`
- `host_subject_binding_conflict` — `409`
- `csrf_origin_invalid` — `403`
- `http_content_type_invalid` — `415`
- unauthenticated user session — `401`, standard `UNAUTHORIZED` envelope
- `consent_session_not_found` — `404`
- `receiver_busy` — `503`
- unknown `/v0.1` route — `404`, `http_route_not_found`

Internal-only revocation uses the configured authority and is not an HTTP route. Its stable errors
are `grant_control_unauthorized` (`403`), `grant_not_found` (`404`), `grant_revoked` (`422`),
`grant_expired` (`410`), and `grant_exhausted` (`409`).

## Verification

- Feature 2 suite: `1` suite, `7/7` tests passed, including focused `CONSENT-004`.
- Aggregate backend suite: `5` suites, `17/17` tests passed.
- Tested with real HTTP, Prisma, and PostgreSQL.
- Runtime: Node `v26.8.1`.
- Database: PostgreSQL `14.18`, fresh `cloud_receiver_2_popup_handoff` on `127.0.0.1:55435`.
- Commits: `d77c34a356e0380b687b7aefbd2ccb3ed8aa946f` and
  `f67e741dd0392dd04f14d7d02764b7c0a7179dc5`.
- Branch: `main` matches `origin/main` at
  `f67e741dd0392dd04f14d7d02764b7c0a7179dc5`; the tested commit is pushed and not deployed.

## SDK browser integration verification

- `SDK-V2-001`–`SDK-V2-004`: `4/4` passed against the real Receiver app and disposable PostgreSQL.
- Normal SDK syntax and unit/adapter suite: `18/18` passed.
- Real Chrome headless/Playwright approve and decline flows both opened the actual consent popup,
  received HTTP `200`, delivered the exact completion message from the matching popup source and
  origin, and completed through the unchanged SDK. Approve produced `approved`/`active`; decline
  produced `declined` with no binding.
- SDK verification runtime/database: Node `v26.8.1`; PostgreSQL `14.18` on `127.0.0.1:55436`,
  database `sdk_v2_contract_final`; the same-origin local browser configuration used
  `http://127.0.0.1:4010`.
- Direct remote readback with `git ls-remote origin refs/heads/main` matched
  `f67e741dd0392dd04f14d7d02764b7c0a7179dc5`.

## Remaining blockers

ADR-0013 approval is required before any public Grant inspection/revocation route. Event work
remains paused. Node 24 was unavailable, and the default Turbopack frontend build hit a local
permission failure, although the webpack build passed.

## Source files

- [routes](https://github.com/4xeoz/saas-boilerplate/blob/498bd18a92b488b440ccd2e3b00f55362cb4d443/backend/src/modules/consent/consent.routes.ts)
- [schemas](https://github.com/4xeoz/saas-boilerplate/blob/498bd18a92b488b440ccd2e3b00f55362cb4d443/backend/src/modules/consent/consent.schemas.ts)
- [service](https://github.com/4xeoz/saas-boilerplate/blob/498bd18a92b488b440ccd2e3b00f55362cb4d443/backend/src/modules/consent/consent.service.ts)
- [tests](https://github.com/4xeoz/saas-boilerplate/blob/498bd18a92b488b440ccd2e3b00f55362cb4d443/backend/src/modules/consent/test/consent.test.ts)
- [CLOUD-015 evidence](CLOUD-015-cloud-receiver-v2-consent-targeting.md)
