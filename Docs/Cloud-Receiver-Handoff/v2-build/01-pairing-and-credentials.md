# Feature 01 — Pairing and Connector Credentials

**Build gate:** `PAIR-001`–`PAIR-005`

**Owner:** Cloud Receiver v2 account and Connector identity boundary

**Compatibility source:** [Local Connector handoff 01](../01-pairing-and-credentials.md)

## Goal

Let an authenticated Re-entry user create a short-lived pairing code and let a fresh CLI redeem it
once to create one account-linked Connector. The Connector receives one delivery-only credential;
the Host and browser never receive it.

## Inputs and outputs

### Create pairing session

```http
POST /v0.1/account/pairing-sessions
Cookie: authenticated Re-entry account session
Content-Type: application/json

{}
```

Return `201` JSON with:

```json
{
  "type": "webmcp.connector_account_pairing",
  "protocol_version": "0.1",
  "pairing_id": "pairing_123",
  "pairing_code": "A1B2C3D4",
  "expires_at": "2026-09-02T12:00:00.000Z"
}
```

The raw code is returned only to the authenticated dashboard response. Persist only its SHA-256
digest.

### Claim pairing session

```http
POST /v0.1/account/pairing-sessions/claim
Content-Type: application/json

{
  "pairing_code": "A1B2C3D4",
  "device_name": "Mac One"
}
```

The CLI request has no browser cookie and no organization API key. Return `200` JSON:

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

The raw Connector token is returned only to this claim response and is stored locally by the CLI.
The Receiver persists only its digest.

### Disconnect Connector

```http
POST /v0.1/connectors/disconnect
Content-Type: application/json

{
  "connector_token": "opaque-secret"
}
```

The request has no browser cookie or Organization credential. The Receiver hashes the token and
sets the matching Connector's `revoked_at` once. First use returns `200` with:

```json
{
  "type": "webmcp.connector_disconnection",
  "protocol_version": "0.1",
  "status": "disconnected",
  "duplicate": false
}
```

Exact replay returns `duplicate: true` without changing the first revocation timestamp. An unknown
token returns `403 connector_identity_invalid`. A known expired token may still revoke only itself.
The row remains available to the account device list for audit, but is excluded from consent choices
and future delivery claims. The CLI clears its saved credential only after a successful or duplicate
response.

## Minimal data design

Use the smallest schema that can enforce these facts:

- `pairing_sessions`: pairing id, account id, code digest, created/expiry/consumed timestamps,
  Connector id, and initial device name;
- `connectors`: Connector id, account id, delivery target id, token digest, created/expiry/revoked
  timestamps, and display device name;
- a unique constraint on the pairing code digest;
- a unique constraint on the Connector token digest;
- a transaction or compare-and-set update for code consumption.

`device_name` is display metadata, not identity. A changed name on replay is ignored. Renaming is a
separate authenticated account operation and is outside this feature gate.

## Required behavior

1. Require an authenticated account session to create a pairing session.
2. Require the create body to be exactly `{}`.
3. Generate a short-lived code with enough entropy for the preview and hash it before persistence.
4. On the first valid claim, atomically create the Connector and consume the pairing session.
5. Scope the generated token to one Connector, one account subject, and one delivery target.
6. On the same consumed code and same stored Connector identity, return the same credentials with
   `duplicate: true`; do not issue a new token.
7. Ignore a replayed `device_name`; never rename or create a second Connector from the replay.
8. If the code resolves to an inconsistent Connector identity, return
   `account_pairing_identity_conflict` and do not mutate state.
9. Invalid, expired, revoked, or wrong-scope Connector tokens fail delivery authentication with
   `connector_identity_invalid`.

## Red tests

Write these as black-box tests against the v2 HTTP handler and durable database before implementing
the feature:

| ID | Arrange and act | Required assertion |
|---|---|---|
| `PAIR-001` | Authenticated account posts exactly `{}` to the create route. | `201`; short-lived pairing response; no Connector token; code digest is persisted. |
| `PAIR-002` | Fresh CLI posts the code and `device_name: "Mac One"`. | `200`; exact credential type/version; one Connector; opaque token; `duplicate: false`; consumed code is durable. |
| `PAIR-003` | Replay the consumed code with `device_name: "Renamed Mac"`. | Same pairing/Connector credentials; `duplicate: true`; one Connector and one target; stored name remains unchanged. |
| `PAIR-004` | Force or submit a consumed code with a different Connector/account identity. | Stable `account_pairing_identity_conflict`; no second Connector; no reassignment. |
| `PAIR-005` | Use invalid, expired, revoked, or wrong-scope Connector tokens on a delivery route. | `401`/`403` with `connector_identity_invalid`; no delivery mutation; no secret in response/log evidence. |

Connector lifecycle extension:

| ID | Arrange and act | Required assertion |
|---|---|---|
| `DISCONNECT-001` | A paired CLI posts its exact Connector token. | `200`; exact token-free response; one durable `revoked_at`; account list shows the lifecycle change; later claim is rejected. |
| `DISCONNECT-002` | Replay the same token, then submit an unknown valid-format token. | Replay is `duplicate: true` with the original timestamp; unknown token is `403 connector_identity_invalid`. |
| `DISCONNECT-003` | Load consent before and after disconnecting one of two eligible Macs. | The disconnected Mac disappears; the other eligible Mac remains. |
| `DISCONNECT-004` | Exercise the Local Connector response parser and remote/local ordering. | Exact response accepted; malformed response rejected; remote failure preserves the local credential. |

The test fixture must prove the CLI request succeeds without browser cookies or organization
credentials. Inspect durable rows after the race/replay cases.

## Green implementation order

1. Add the isolated persistence tables, digests, indexes, and transaction helper.
2. Add the authenticated account route and exact-body validation.
3. Add code generation, expiry, one-time response, and no-token-before-claim behavior.
4. Add the unauthenticated-by-cookie claim route with atomic create-and-consume logic.
5. Add idempotent replay lookup returning the original credential record without minting again.
6. Add Connector token verification and target scope for later delivery routes.
7. Map all failures to stable public codes without exposing database or token details.

## Refactor checklist

- Keep the pairing and Connector identity transaction separate from Host organization credentials.
- Keep raw code/token values out of logs, traces, database rows, browser JavaScript, and test reports.
- Verify replay behavior after process restart, not only in one process.
- Keep the route names, JSON names, protocol version, and token placement unchanged.
- Re-run `PAIR-001`–`PAIR-005` plus the prior shared harness checks after every schema or module move.

## Exit condition

Do not start Consent/Targeting until all five Pairing cases pass against the real v2 HTTP handler,
durable database, and restart boundary, with no dependency on `runtime/cloud-receiver/`.
