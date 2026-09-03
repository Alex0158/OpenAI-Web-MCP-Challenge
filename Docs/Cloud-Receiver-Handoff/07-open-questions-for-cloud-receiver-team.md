# 07 — Answers and Agreements for the Cloud Receiver Team

**Status:** ANSWERED FOR CLOUD RECEIVER V2
**Decision owner:** Local Receiver/Connector maintainer
**Scope:** Future Cloud Receiver implementation

This document applies to the Cloud Receiver v2 replacement service. Cloud Receiver v1 is retired;
the v1 runtime is cited only as historical evidence for compatibility decisions.

ADR-0032 retires the current `runtime/cloud-receiver/` package. The answers below use its behavior
and the reusable `reentry-core/` contracts as evidence, but do not revive that runtime. The Cloud
Receiver team may replace the implementation and storage model; it must preserve the agreed wire
behavior unless a new protocol decision is accepted.

## Decision summary

| Question | Agreement |
|---|---|
| Pairing replay | Pairing code identifies the enrollment. Device name is display metadata, not identity. |
| Consent status | Persist decision facts; derive expiry, revocation, and exhaustion at read/claim time. |
| Connector targeting | For v0.1, one Host subject remains bound to one Connector target. |
| Effect acknowledgement | Host issues the effect token; Receiver verifies it through a trusted effect authority. |
| Grant revocation | Yes. Receiver owns revocation; Host backend authenticates the control request. |
| Hosted errors | Use `{ "error": { "code": "..." } }`; `receiver_busy` is 503 and `receiver_internal_error` is 500. |

## 1. Pairing replay

### Agreement

The pairing code is the enrollment and idempotency identity. `device_name` is display metadata only.

- The first valid claim consumes the code and creates one Connector.
- A replay of the same code for the same pairing/Connector returns the same credentials with
  `duplicate: true`.
- A changed `device_name` on replay is ignored; it must not rename the stored Connector or create a
  second one.
- A code that resolves to a different Connector identity fails with
  `account_pairing_identity_conflict`.
- Renaming a device, if needed, is a separate authenticated account operation.

This matches the current `ProductFlowStore.claimAccountPairing` behavior: it compares the stored
Connector identity and does not use the replayed device name as identity.

## 2. Consent status

### Agreement

Persist only durable facts. Do not run an expiry job just to rewrite status.

- Persist consent decision state: `pending`, `approved`, or `declined`.
- Persist `grant.revoked_at` when an explicit revocation occurs.
- Derive effective Grant state from the clock and stored Grant at read and claim time:
  `active`, `expired`, `exhausted`, or `revoked`.
- A pending consent whose expiry has passed is effectively `expired`.

For compatibility, keep the existing `status` field as the consent decision state and add an
`effective_status` field for derived Grant state. Do not silently change the meaning of `status` in
the existing v0.1 Host response.

This matches the Core: `buildPublicChallenge` derives expired challenges, while `grantStatus`
derives `active`, `expired`, `exhausted`, and `revoked` without requiring a background mutation.

## 3. Connector targeting

### Agreement for v0.1

One Host subject is permanently bound to one Connector delivery target.

- The first approved consent for `(organization_id, host_subject_ref)` records the selected
  `connector_id` and `delivery_target_id`.
- Later consent for the same Host subject must use that same Connector.
- Selecting a different Connector fails with `host_subject_binding_conflict`; it must not silently
  reroute existing or future work.
- Moving a Host subject to another Mac requires an explicit rebind/decommission operation. It is
  not an accidental side effect of approving a new consent session.
- Each Grant still stores its own target, so old deliveries remain auditable and target-scoped.

This is the behavior enforced by the current `product_account_host_subject_links` primary key and
`bindHostSubject` conflict check. Per-consent device selection would be a new authority decision,
not an implementation detail of this rebuild.

## 4. Host-effect acknowledgement

### Agreement

The Host backend or a trusted Host-effect service issues `effect_token` only after the exact Host
effect is committed. The Cloud Receiver verifies it through its configured effect-authority port;
the Receiver does not mint it and the Connector does not invent it.

The verifier must bind the token to:

- `delivery_id`;
- `event_id`;
- `correlation_id`;
- `workflow_id`;
- the delivery's `canonical_url` and `human_boundary`; and
- outcome `effect_applied_awaiting_human`.

The returned attestation contains:

```text
type, protocol_version, effect_id, delivery_id, event_id,
correlation_id, workflow_id, outcome, confirmed_at
```

`effect_id` must be unique. `confirmed_at` must be after lease acquisition, before lease and Grant
expiry, before revocation, and not materially in the future.

The effect token is not part of the claim response or Agent activation context. A trusted Host/local
integration must deliver it separately to the acknowledgement caller. The current reference Host
implements this with an in-memory test authority; the current product preview intentionally has no
effect verifier, so its claim-to-acknowledgement path is not production-ready.

## 5. Grant revocation

### Agreement

Yes. Revocation is part of the replacement Receiver's minimum safety boundary.

- The Receiver owns the Grant's irreversible `revoked_at` state.
- The Host backend authenticates the control request with its organization API key.
- The Receiver resolves that organization and Host subject to a scoped
  `grantControlAuthority` decision for the exact binding and action.
- Connector credentials, browser consent tokens, and user-facing delivery routes cannot revoke a
  Grant.
- Revocation blocks new events and new/replayed claims for that Grant.
- A pre-revocation Host effect may converge only when its `confirmed_at` is before revocation.
- Revocation deletes no event, delivery, or audit history.

The Core already implements `revokeGrant` and requires a separate `grantControlAuthority`. The old
product and standalone previews leave that authority unsupported and expose no public route. The
replacement team should wire it behind an authenticated Host control API; the exact public route is
a new API decision and must not be invented silently.

## 6. Hosted errors

### Agreement

All protocol and control API failures use this shape:

```json
{ "error": { "code": "stable_machine_readable_code" } }
```

Required hosted behavior:

- `503 {"error":{"code":"receiver_busy"}}` for bounded persistence contention, with
  `Retry-After: 1` where applicable;
- `500 {"error":{"code":"receiver_internal_error"}}` for an unexpected failure;
- no stack traces, SQL, connection strings, secrets, or tokens in the response;
- `401` or `403` for invalid Connector or organization authentication;
- `409` for stale leases, races, and identity conflicts; and
- `410` for expired consent, Grant, or continuation authority.

`/healthz` and `/readyz` are operational endpoints and may use their own small status responses;
they do not prove that delivery or acknowledgement succeeded.

The Cloud Receiver v1 Vercel entry point's `receiver_deprecated` response is a retirement signal,
not part of the Cloud Receiver v2 contract.

## Final acceptance gate

The Cloud Receiver rebuild is compatible when one test proves:

```text
pair -> replay safely -> approve one target -> sign Event -> claim lease
-> reject stale/wrong claims -> verify Host effect -> acknowledge -> replay acknowledgement
```

Any change to route names, request fields, response fields, status meanings, or token placement
requires a versioned protocol decision and corresponding Local Connector changes.

## Test obligations for the agreements

The following cases are mandatory in the replacement team's test suite; they are the executable
interpretation of the agreements above:

- `PAIR-003` proves same-code replay is idempotent and ignores a changed device name.
- `CONSENT-003` proves persisted decision facts are separate from derived `effective_status`.
- `TARGET-002` proves one Host subject cannot silently move to another Connector target.
- `REVOKE-001` proves revocation blocks new authority while retaining history and respecting the
  effect-confirmation cutoff.
- `ACK-002` and `ACK-003` prove the separate Host effect authority is required and the effect token
  is matched to the exact delivery context.
- `HTTP-002` proves the agreed hosted error envelope and status categories.

The Local Connector maintainers accept the replacement only when the final acceptance gate and all
feature-file test IDs pass against the Cloud Receiver v2 service, with no dependency on the v1
runtime.
