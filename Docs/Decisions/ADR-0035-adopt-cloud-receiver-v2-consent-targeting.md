# ADR-0035 — Adopt Cloud Receiver v2 Consent, Targeting, and Internal Revocation Increment

**Status:** Accepted for Feature 2 only
**Date:** 2026-09-02
**Amended:** 2026-09-03
**Owners:** Cloud Receiver v2 implementation
**Supersedes:** None
**Related:** ADR-0007, ADR-0008, ADR-0013, ADR-0033, ADR-0034, TASK-015

## Decision

The Cloud Receiver v2 implementation in `saas-boilerplate/` will add Feature 2 using Prisma over
PostgreSQL with these bounded behaviors:

1. An organization-authenticated Host registers a public signing key and creates a consent
   session from a valid signed Manifest.
2. A signed-in Re-entry user explicitly approves or declines the consent session. Approval creates
   one private Grant for the selected owned Connector's delivery target; decline creates no Grant.
   The Receiver-hosted consent page submits that cookie-authenticated JSON decision from the
   configured Receiver origin. The account decision route rejects the separate frontend origin so
   its CSRF boundary matches the page that owns the decision.
3. The first approved consent for an organization and Host subject creates one durable target
   binding. Later approvals for that subject must use the same target; a different Connector is a
   `409 host_subject_binding_conflict` and cannot reroute the subject.
4. Consent status is persisted as `pending`, `approved`, or `declined`. Approved Grant
   `effective_status` is derived as `active`, `expired`, `exhausted`, or `revoked` from durable
   fields; no cleanup job is required.
5. A private, configured Grant-control authority may set `revoked_at` once. The Grant remains
   queryable in the database, and the private admission fence rejects new work after revocation.
   This is an internal Feature 2 test/authority seam, not a public route or Event implementation.
6. After a successful account approve or decline response, the consent popup posts the public
   completion message `{ type: "reentry.consent.complete", consent_session_id, status }` to the
   exact Host origin persisted from the Receiver-validated signed Manifest
   (`prompt.session.issuer_origin`). The message sender remains the Receiver consent origin, and
   the Host SDK must accept it only from that exact Receiver origin and the exact popup window.
   Failed decisions emit no message; wildcard targeting is forbidden; and the message contains no
   consent token, Connector id, binding, API key, or other private value.
7. The Receiver's `/consent` document alone returns
   `Cross-Origin-Opener-Policy: unsafe-none` so the cross-origin Host opener remains available for
   that bounded completion message. Other Receiver routes keep the stronger global Helmet policy.
   This route-scoped browser-channel exception does not relax the SDK's exact Receiver-origin,
   exact popup-source, or Host-server confirmation checks.

Host-facing responses remain opaque: they do not expose account ids, Connector ids, Connector
tokens, delivery target ids, or private Grant/binding fields. Raw consent tokens are used only as
the consent URL credential and are stored as digests.

## Explicit exclusions

- Public Grant inspection and revocation routes are not implemented or implied. ADR-0013 remains
  the separate decision gate; ADR-0034 remains the proposal surface.
- Event ingress, signed Event validation, delivery claims, effect acknowledgment, and Event
  history are not implemented. They may begin only after Feature 2 is fully green and approved.
- Rebinding an existing Host subject to a different target is not part of this increment.
- Organization API-key provisioning is a test/configuration fixture in this increment, not a new
  public provisioning product surface.

## Context

The Pairing increment is closed under ADR-0033. Feature 2 needs to turn a validated Host request
and explicit account decision into a stable target-bound Grant while preserving the authority and
privacy boundaries established by ADR-0007 and ADR-0008. ADR-0013 has not been accepted, so a
public Grant-control API would be premature and would create a separate authority contract.

## Consequences

### Positive

- Consent and target selection become durable, testable server behavior in the Prisma clone.
- Target stickiness is enforced transactionally rather than inferred from the latest approval.
- Revocation is durable and can fence later work without exposing private Grant controls publicly.
- Cross-origin popup completion can reach the signed Host without widening the SDK's Receiver-origin
  and popup-source checks or treating the browser message as approval authority.
- The opener-compatible policy is limited to the human consent document instead of weakening the
  Receiver globally.

### Costs and risks

- The clone temporarily contains an internal Grant-control seam that must not be mistaken for a
  public authorization model.
- Host-key, Manifest-signature, and organization-key fixtures must be supplied by the configured
  test authority until a broader provisioning decision exists.
- The consent document deliberately preserves a cross-origin opener; its minimal completion payload
  and the Host SDK's exact origin/source checks are therefore mandatory security boundaries.
- Event work remains intentionally deferred and cannot be inferred from the revocation fence.

## Reversal

Before Feature 2 closure, remove the implementation through a reviewed change that updates this
ADR and TASK-015. After closure, any public Grant-control or Event behavior requires a new accepted
decision and reconciliation with ADR-0013.

## Evidence

Implementation and runtime evidence are maintained in
[`CLOUD-015`](../Development/CLOUD-015-cloud-receiver-v2-consent-targeting.md) and
[`CLOUD-022`](../Development/CLOUD-022-v2-consent-and-developer-experience.md).
