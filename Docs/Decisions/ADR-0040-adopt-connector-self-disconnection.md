# ADR-0040 — Adopt Connector Self-Disconnection

**Status:** Accepted for the active Cloud Receiver v2 and Local Connector
**Date:** 2026-09-03
**Owners:** Project team
**Related:** ADR-0010, ADR-0033, ADR-0039, TASK-023
**Source contract:** [Feature 01 — Pairing and Connector Credentials](../Cloud-Receiver-Handoff/v2-build/01-pairing-and-credentials.md)

## Context

`re-entry disconnect` currently removes only the macOS service and local credential. The Receiver
therefore continues to treat the Connector as eligible until its credential expires, and the user
dashboard can continue to present the Mac as paired. A local-only sign-out is not a complete
account-device lifecycle.

The existing v2 `Connector.revokedAt` field, delivery authorization fence, account device list, and
consent-device filter already provide the durable state needed. No new table or migration is
required.

## Decision

1. Add one Connector-control route to the active v2 Receiver:

   ```http
   POST /v0.1/connectors/disconnect
   Content-Type: application/json

   { "connector_token": "opaque-secret" }
   ```

2. The body contains exactly one 43-character Connector token. The Receiver hashes it, sets the
   matching Connector's `revoked_at` once, retains the row for audit and replay protection, and
   never returns or logs the token.
3. First success returns `200` with exactly:

   ```json
   {
     "type": "webmcp.connector_disconnection",
     "protocol_version": "0.1",
     "status": "disconnected",
     "duplicate": false
   }
   ```

   Replaying the same known token returns the same shape with `duplicate: true` and preserves the
   original revocation timestamp. An unknown token returns `403 connector_identity_invalid`.
4. A known expired token may disconnect only its own Connector. Expiry blocks delivery, but does
   not prevent the holder from narrowing its own authority by revocation.
5. Revoked Connectors remain visible in the account device list as disconnected, but are excluded
   from future consent choices and from delivery claims.
6. The CLI loads the saved credential, completes Receiver revocation, and only then stops the
   background service and clears local connection data. If the Receiver call fails, the local
   credential remains so the user can safely retry. If no credential exists, local cleanup remains
   idempotent and no remote request is made.
7. The dashboard refreshes the account Connector list on a bounded interval and renders
   `revoked_at` as **Disconnected**. This is lifecycle state, not live presence; no WebSocket,
   heartbeat, or online/offline inference is added.

This route is an additive pairing-lifecycle control route. It does not alter the three Core
Event/Claim/Acknowledgement routes frozen by ADR-0010 and ADR-0039, create a public Grant-control
route, sign out the browser account, or authorize dashboard-initiated revocation.

## Consequences

- One user command now converges local and Receiver state without deleting audit history.
- Remote revocation immediately fences future delivery and device selection.
- A temporarily unavailable Receiver makes disconnect fail visibly and keeps retry authority on
  disk; users who only need to pause delivery can continue to use `re-entry stop`.
- `runtime/cloud-receiver/` remains retired and unchanged.

## Verification gate

`DISCONNECT-001`–`DISCONNECT-004` must prove the exact route, first-use and replay behavior,
database timestamp preservation, account-list projection, consent and delivery exclusion, strict
Local Connector response validation, remote-before-local ordering, and local credential
preservation on a Receiver failure. Existing Receiver and Local Connector suites must remain green.

## Reopen triggers

Reopen if a supported client cannot retain the credential through remote failure, if account-owned
dashboard revocation is required, if product semantics require deleting Connector history, or if
presence/heartbeat behavior is proposed.
