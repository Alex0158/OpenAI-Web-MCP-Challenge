# Feature 02 — Consent, Targeting, Effective Status, and Revocation

**Build gate:** `CONSENT-001`–`CONSENT-005`, `TARGET-001`–`TARGET-002`, `REVOKE-001`

**Owner:** Cloud Receiver v2 Grant and target authority

**Compatibility source:** [Local Connector handoff 02](../02-consent-and-targeting.md) and [answers](../07-open-questions-for-cloud-receiver-team.md)

## Goal

Turn an authenticated Host request and an explicit Re-entry user decision into one Grant tied to
the correct Connector delivery target. Keep the Host view opaque, preserve decision facts, derive
effective Grant state at read/claim time, and make revocation irreversible.

## Host control flow

The Host backend authenticates with an organization API key:

```http
Authorization: Bearer <organization-api-key>
Content-Type: application/json
```

1. Register or update the Host public signing key through `POST /v0.1/host-keys`.
2. Create a consent session through `POST /v0.1/consent-sessions` with `host_subject_ref`,
   `expected_origin`, and the signed Manifest.
3. Return only a short-lived consent URL and opaque consent session identifier to the Host.
4. Require the Re-entry account session on the consent page and let the user select one connected
   Connector.
5. Submit the cookie-authenticated JSON decision from the configured Receiver origin; reject the
   separate frontend origin.
6. On approval, create one Grant bound to that Connector's `delivery_target_id`.
7. On decline, create no delivery authority.

## Target rule for protocol 0.1

The first approved consent for `(organization_id, host_subject_ref)` creates a durable binding to
one `connector_id` and `delivery_target_id`. Later approvals for the same Host subject must use the
same target. A different selection returns `409` with `host_subject_binding_conflict`; it never
silently reroutes existing or future work.

Moving a Host subject requires a separate explicit rebind/decommission operation. That operation's
public route is a decision gate in [07-decision-gates-and-evidence.md](07-decision-gates-and-evidence.md)
and must not be invented in this feature.

## Status model

Persist only durable decision facts:

- `status`: `pending`, `approved`, or `declined`;
- Grant `revoked_at` when an explicit revocation occurs;
- expiry, exhaustion, and revocation facts needed to derive effective state.

Derive `effective_status` at read and claim time:

```text
active | expired | exhausted | revoked
```

A pending consent past its expiry is effectively `expired`. Do not run an expiry job merely to
rewrite status. Preserve the meaning of any existing v0.1 `status` field; expose
`effective_status` on the v2 status surface without replacing the decision fact.

## Minimal data design

- `host_keys`: organization, Host id, issuer origin, key id, public key, active/revoked state;
- `consent_sessions`: session id, token digest, organization, Host subject reference/digest,
  expected origin, Manifest reference, expiry, decision status, Grant id;
- `host_subject_bindings`: organization, Host subject reference/digest, Connector id, target id,
  created/rebound/decommissioned facts;
- `grants`: Grant id, binding, target, scope, expiry, one-run/exhaustion facts, `revoked_at`;
- uniqueness on `(organization_id, host_subject_ref_digest)` for the v0.1 binding.

Approval, binding creation, and Grant creation must be one durable transaction or an equivalent
recoverable idempotent operation. Decline must not create a Grant or delivery target authority.

## Red tests

| ID | Arrange and act | Required assertion |
|---|---|---|
| `CONSENT-001` | Valid Host key/API key registers a key and creates a consent session. | Short-lived URL and opaque session id; no account id, Connector token, or private binding in Host output. |
| `CONSENT-002` | Account user approves, declines, or leaves a session pending. | Decision fact persists; approval creates one Grant for the selected target; decline creates none; Host sees only opaque values. |
| `CONSENT-003` | Read the Grant after approval, expiry, exhaustion, and revocation. | `status` remains decision-oriented; `effective_status` derives correctly; expired/revoked/exhausted Grants cannot create new work. |
| `CONSENT-004` | Run the rendered popup decision script for success and failure. | Only a successful decision emits the public completion shape; no token or Connector id is emitted. |
| `CONSENT-005` | Submit a decision from the separate frontend origin. | `403 csrf_origin_invalid`; the consent session remains pending. Receiver-origin decisions remain accepted. |
| `TARGET-001` | Approve the same Host subject for the same target again. | Idempotent convergence; one active binding; no second target. |
| `TARGET-002` | Approve the same Host subject for a different Connector. | `409 host_subject_binding_conflict`; original target remains unchanged; no credential leak. |
| `REVOKE-001` | Revoke an approved Grant through the configured Grant-control authority, then submit a matching Event. | New Event/claim is blocked with `grant_revoked`; all history remains queryable; only pre-revocation effect confirmation may converge. |

`REVOKE-001` must exercise the configured Grant-control authority or the later accepted public
route. The route is intentionally not prescribed by the Local Connector contract.

## Green implementation order

1. Persist Host keys and resolve them by organization, issuer origin, and key id.
2. Add organization-authenticated consent-session creation and opaque Host responses.
3. Add account-authenticated decision handling with exact request fields and Connector ownership
   checks.
4. Add the one-subject/one-target binding transaction and idempotent same-target approval.
5. Add Grant creation and the decision/effective status projection.
6. Add a separate internal Grant-control authority that can set `revoked_at` for one exact Grant.
7. Fence Event acceptance, claims, and effect acknowledgement against effective Grant state.
8. Add the public revocation route only after its versioned API decision is recorded.

## Refactor checklist

- Never send account identity, Connector token, Host signing key, or private binding data to Host
  browser code or the Connector.
- Keep target selection user-owned and organization/Host authentication backend-only.
- Verify status derivation from a controlled clock after restart; do not depend on a cleanup job.
- Verify revocation does not delete Event, delivery, effect, or audit history.
- Keep old decision status meanings stable while adding effective Grant state.
- Re-run all Pairing tests before and after the binding/Grant schema changes.

## Exit condition

Do not start Signed Event ingress until every Consent, Target, and Revocation test passes against
durable state and the configured authority. If the public revocation or rebind route is still open,
the internal authority tests may pass, but the public route remains a release blocker for this
feature.
