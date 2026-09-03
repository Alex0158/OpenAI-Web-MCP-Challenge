# 01 — Pairing and Connector Credentials

> **Cloud Receiver v2 handoff:** This document defines the proposed v2 replacement service. Cloud
> Receiver v1 is retired and retained only as historical evidence; this is not a v1 implementation
> guide. See [ADR-0032](../Decisions/ADR-0032-retire-current-cloud-receiver-runtime.md) for the v1
> runtime disposition.

## Responsibility

Create an account-linked Connector and return one delivery-only credential to the CLI.

## API

### Create pairing code

```http
POST /v0.1/account/pairing-sessions
Cookie: authenticated Re-entry account session
Content-Type: application/json

{}
```

Return `201 application/json`:

```json
{
  "type": "webmcp.connector_account_pairing",
  "protocol_version": "0.1",
  "pairing_id": "pairing_123",
  "pairing_code": "A1B2C3D4",
  "expires_at": "2026-09-02T12:00:00.000Z"
}
```

The code is short-lived and may be displayed once. Store only its digest.

### Redeem pairing code

```http
POST /v0.1/account/pairing-sessions/claim
Content-Type: application/json

{
  "pairing_code": "A1B2C3D4",
  "device_name": "My Mac"
}
```

Return `200 application/json`:

```json
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

The code must be consumed atomically. A repeated request may return `duplicate: true` only when it
refers to the same already-completed claim; never issue a second unrelated Connector silently.

## Required security behavior

- Store only SHA-256 digests of pairing codes and Connector tokens.
- Scope the token to `connector_id`, one account subject, and one `delivery_target_id`.
- Keep the raw Connector token out of logs, browser JavaScript, Host responses, and Codex prompts.
- The CLI claim request has no browser cookie and no organization API key.
- Support expiry and revocation; invalid credentials must return the stable code
  `connector_identity_invalid` from delivery routes.

## Acceptance test

1. A signed-in user creates a code.
2. A fresh CLI redeems it once.
3. The Connector appears in the user account.
4. The returned token can authenticate delivery claims.
5. The code cannot be redeemed for a different Connector.

## Required contract tests

The Cloud Receiver team must implement these cases in its own test runner. Use a fresh account and
fresh Connector records for each independent test.

| ID | Scenario | Required result |
|---|---|---|
| `PAIR-001` | An authenticated account creates a pairing session. | Return `201` with a short-lived pairing code/session; do not return a Connector token before redemption. |
| `PAIR-002` | A fresh CLI redeems the code with `device_name: "Mac One"`. | Return `200` `webmcp.connector_credentials` with protocol `0.1`, one `connector_id`, one opaque token, and `duplicate: false`; persist the code consumption atomically. |
| `PAIR-003` | Redeem the same consumed code again with `device_name: "Renamed Mac"`. | Return the same pairing/Connector credentials with `duplicate: true`; do not issue a second token and do not mutate the original device metadata from the replay. |
| `PAIR-004` | Try to redeem that consumed code for a different Connector/account context. | Return a stable identity/conflict error; never silently attach the code to the second Connector. |
| `PAIR-005` | Use an invalid, expired, or revoked Connector token on a delivery route. | Return `401` or `403` with `connector_identity_invalid`, no delivery state change, and no secret in the response or logs. |

The test record must confirm that only token digests are persisted and that browser cookies and
organization credentials are not required on the CLI delivery request.
