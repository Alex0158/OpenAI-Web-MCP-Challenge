# 02 — Consent, Grant, and Delivery Target

> **Cloud Receiver v2 handoff:** This document defines the proposed v2 replacement service. Cloud
> Receiver v1 is retired and retained only as historical evidence; this is not a v1 implementation
> guide. See [ADR-0032](../Decisions/ADR-0032-retire-current-cloud-receiver-runtime.md) for the v1
> runtime disposition.

## Responsibility

Turn one Host request and one explicit user decision into a Grant tied to the selected Connector.
Without this block, the event queue has no authorized delivery target.

## Host control API

Host control requests use:

```http
Authorization: Bearer <organization-api-key>
Content-Type: application/json
```

The Host first registers its public signing key:

```http
POST /v0.1/host-keys

{
  "host_id": "host_123",
  "issuer_origin": "https://host.example",
  "key_id": "host-key-1",
  "public_key_pem": "-----BEGIN PUBLIC KEY-----..."
}
```

It then creates a consent session:

```http
POST /v0.1/consent-sessions

{
  "host_subject_ref": "user_123",
  "expected_origin": "https://host.example",
  "manifest": { "...": "signed Manifest" }
}
```

Return a short-lived `consent_url` and `consent_session_id`. The Host receives only opaque status
and binding values.

## User decision

The consent page requires a Re-entry account session. Approval selects one connected Mac:

```http
POST /v0.1/account-consent-decisions
Content-Type: application/json

{
  "consent_token": "short-lived-consent-token",
  "action": "approve",
  "connector_id": "connector_123"
}
```

On approval, create one private Grant and bind it to the Connector's
`delivery_target_id`. On decline, create no delivery authority.

## Required rules

- The user, not the Host, chooses the Connector.
- Never return account IDs, Connector tokens, or private bindings to Host browser code.
- Grant expiry and one-run limits must be enforced before event delivery.
- Grant revocation must prevent new claims.
- Persist the consent decision in `status` as `pending`, `approved`, or `declined`.
- Return a derived `effective_status` that can be `active`, `expired`, `exhausted`, or `revoked`.
- Bind one Host subject permanently to one Connector target in v0.1; changing the target requires
  an explicit rebind operation, not an approval replay.

## Acceptance test

An approved consent session produces a Grant whose target is exactly the selected Connector. A
signed Event referencing the resulting opaque binding creates work only for that Connector.

## Required contract tests

| ID | Scenario | Required result |
|---|---|---|
| `CONSENT-001` | A Host with a valid organization API key registers a signing key and creates a consent session. | Return a short-lived `consent_url` and opaque session identifier; keep account identity, Connector token, and private binding data out of the Host response. |
| `CONSENT-002` | The account user approves, declines, or leaves the session pending. | Persist the decision fact in `status`; approval creates one Grant for the selected Connector, decline creates no delivery authority, and the Host can read only opaque status/binding values. |
| `CONSENT-003` | Read a Grant after approval, expiry, exhaustion, and revocation. | Preserve the decision-oriented `status` and return the correctly derived `effective_status`; expiry/revocation must block new event delivery or claims. |
| `TARGET-001` | Approve the same Host subject for the same Connector target again. | Converge idempotently to the existing binding; do not create a second active target. |
| `TARGET-002` | Approve the same Host subject for a different Connector. | Return `409` with `host_subject_binding_conflict`; do not replace the original target or leak Connector credentials. |
| `REVOKE-001` | Revoke an approved Grant through the authenticated grant-control authority, then submit a new matching Event. | The Event or subsequent claim is rejected with `grant_revoked`; the binding, event, delivery, and audit history remain queryable. An effect confirmed before revocation may converge; an effect confirmed after revocation must not. |

`REVOKE-001` deliberately does not prescribe a public route: that route is a separate versioned API
decision. The cloud test harness must call the Receiver's configured grant-control authority or the
approved versioned route and still prove the observable behavior above.
