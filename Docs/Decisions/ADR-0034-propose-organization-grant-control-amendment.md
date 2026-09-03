# ADR-0034: Proposed Amendment to ADR-0013 for Organization Grant Control

**Status:** Proposed — approval required  
**Decision date:** Not approved  
**Decision owners:** Project manager and project team  
**Amends:** [ADR-0013](ADR-0013-freeze-receiver-grant-control-and-revocation.md) if Option B is approved  
**Related:** [TASK-014](../Tasks/TASK-014-build-cloud-receiver-v2-pairing.md), [CLOUD-014](../Development/CLOUD-014-cloud-receiver-v2-pairing.md), [PM answers §4 and §7](../Cloud-Receiver-Handoff/09-project-manager-answers-for-v2-build.md)

## Decision request

The project manager answers propose public routes for a Developer-owned Organization API key to
inspect and revoke Grants that are associated with a User-owned flow. ADR-0013 currently requires
the Grant-control authority to authenticate as the same Grant subject and explicitly leaves
delegated administration outside v0.1. This is therefore an authority change, not a route-only
implementation detail.

Approve exactly one option before any public Grant inspection or revocation route is implemented or
given a final deferred status:

### Option A — retain ADR-0013 unchanged (recommended)

Keep same-subject Grant inspection and revocation as the only accepted Core authority. Do not add
public Organization API-key Grant routes in v2. Leave that surface outside the accepted
implementation boundary until a future decision defines delegated control. This preserves the
current subject, token, audit, and race semantics and requires no schema or route work now.

### Option B — authorize delegated Organization control

Amend ADR-0013 so a separately authenticated, Receiver-owned Organization authority may inspect or
revoke only Grants explicitly bound to that Organization. The existing same-subject authority
remains valid. Approval of this option would authorize a later implementation increment, not the
routes themselves.

The amendment would need to add all of the following to the accepted contract before route work:

1. An explicit durable Organization-to-Grant ownership or delegation relation; a Developer API key
   must not control a User Grant merely because the caller knows a binding ID.
2. A delegated authority attestation bound to the exact `binding_id` and action, with the
   Organization identity, authentication time, expiry, and no caller-supplied User subject or
   revocation timestamp.
3. Authentication-before-lookup behavior, bounded `inspectGrant` and `revokeGrant` summaries,
   compare-and-set revocation, idempotent replay, and the existing event/delivery race rules.
4. An explicit audit model for delegated control, retention and revocation visibility, and tests
   for wrong Organization, revoked API key, unknown binding, concurrent revoke, and replay.
5. A route scope limited to the two proposed operations:
   `GET /v0.1/grants/{binding_id}` and
   `POST /v0.1/grants/{binding_id}/revoke` with `{}`. No Grant listing, batch revoke, or
   caller-selected subject is authorized by this proposal.

## Approval questions

The project manager should record:

1. **Option A or Option B?**
2. If Option B, what authoritative relation makes a Grant Organization-controlled: the Host
   Organization that issued the Manifest, an explicit User-to-Organization consent binding, or
   another named relation?
3. If Option B, are inspection and single-binding revocation the complete scope, with no listing or
   batch operation in v2?
4. If Option B, what audit record and operator visibility are required for delegated revocation?

Until these answers are accepted, this document is a proposal only. No Grant route, Organization
key schema, delegated authority port, or Consent implementation is authorized by ADR-0034.

## Consequences of the pending choice

- Option A minimizes authority expansion and keeps ADR-0013 internally consistent, but leaves
  organization-level administration unavailable.
- Option B enables the PM-requested administration surface, but expands the trust boundary across
  Developer, Organization, and User identities and requires additional durable state, audit, and
  race evidence.
- Neither option changes the completed TASK-014 pairing gate. Consent remains paused until a
  separate accepted task and decision authorize it.
