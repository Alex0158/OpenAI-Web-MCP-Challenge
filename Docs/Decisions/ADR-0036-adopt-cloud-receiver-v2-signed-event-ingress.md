# ADR-0036 — Adopt Cloud Receiver v2 Signed Event Ingress

**Status:** Accepted for Feature 3 only
**Date:** 2026-09-02
**Owners:** Cloud Receiver v2 implementation
**Supersedes:** None
**Related:** ADR-0007, ADR-0008, ADR-0013, ADR-0035, TASK-017

## Decision

Feature 3 in `saas-boilerplate/` implements the signed Host Event ingress contract already frozen
by ADR-0007 and the Receiver authority rules in ADR-0008:

1. `POST /v0.1/events` accepts only JSON with the exact outer fields `body` and `headers`. The
   header names are `WebMCP-Reentry-Key-Id`, `WebMCP-Reentry-Timestamp`, and
   `WebMCP-Reentry-Signature`.
2. The canonical Event body has exactly `type`, `protocol_version`, `event_id`, `correlation_id`,
   `binding_id`, `issuer_origin`, `workflow_id`, `event_type`, `event_sequence`, `state_version`,
   `occurred_at`, and `canonical_url`. Version `0.1` requires type
   `webmcp.continuation_event`, `event_sequence = 1`, and a non-negative integer `state_version`.
   State version is preserved for later Host/page revalidation, not treated as independent current
   state proof by the Receiver.
3. The signature is Ed25519 over the exact UTF-8 bytes of
   `<WebMCP-Reentry-Timestamp>.<body>`, where `body` is canonical JSON. The Receiver resolves the
   opaque `binding_id` to the private Grant first; the Grant's stored organization and issuer
   origin constrain Host-key lookup and expected origin. The Event cannot select its own authority.
4. Before mutation, the Receiver validates content type and bounded body shape, timestamp
   freshness, signature, binding, correlation, issuer origin, workflow, event type, canonical URL,
   Grant expiry/revocation/run budget, Event occurrence time, sequence, and state-version shape.
   Stable failures leave Event, delivery, and Grant state unchanged.
5. A first valid Event returns exactly the `202` `webmcp.continuation_acceptance` envelope with
   `accepted: true`, `duplicate: false`, and `status: "accepted"`. In one PostgreSQL transaction,
   it consumes the Grant's one remaining run and creates one durable Event plus one private pending
   delivery for the Grant's fixed delivery target. No Connector or external service is called.
6. An exact authenticated replay of an existing Event ID and identical canonical body returns the
   prior acceptance with `duplicate: true` and creates no new state. Reuse of the Event ID with
   different canonical bytes is `event_identity_conflict` and creates no state.
7. The Prisma schema adds only the Event and pending-delivery records and the indexes/uniqueness
   required for durable one-event/one-delivery replay. Raw signatures, Connector credentials,
   organization API keys, and private control values are not persisted or returned.

## Explicit exclusions

- Delivery Claim, Connector leasing, acknowledgement, Agent activation, effect handling, and
  deployment are later gates and are not implemented by Feature 3.
- Public Grant inspection/revocation routes remain outside this increment and remain blocked by the
  existing ADR-0013 decision boundary.
- The retired `runtime/cloud-receiver/` v1 implementation, compatibility routes, Event broker,
  and Local Connector source are not used or modified.

## Context and authority

The Feature 2 consent and target boundary is accepted under ADR-0035. The exact event field names,
canonical JSON rules, detached signature bytes, origin/key authority, one-run semantics, and
pending-delivery boundary are already defined by ADR-0007, ADR-0008, and the current
`reentry-core/` protocol implementation. This ADR authorizes their smallest Prisma/Express
replacement implementation in `saas-boilerplate/`; it does not alter the Core contract.

## Consequences

### Positive

- A valid Host Event becomes durable private work without requiring a live Connector.
- Exact replay and one-run consumption are protected by database uniqueness and one transaction.
- Host responses remain opaque and contain no Grant, target, Connector, or credential identifiers.

### Costs and risks

- PostgreSQL transaction evidence is local and does not prove multi-replica deployment or arbitrary
  power-loss behavior.
- Delivery remains pending until a separately authorized Claim and Connector lease increment.
- `state_version` is syntactically validated but current Host state remains the canonical page's
  responsibility.

## Verification gates

Implementation must prove `EVENT-001`–`EVENT-004` over real Express and disposable PostgreSQL,
including stopped-Connector independence, exact replay, conflicting Event-ID reuse, invalid
signature/origin/key/body/time/sequence/state cases, expired/revoked/exhausted Grant rejection,
atomic Event-plus-delivery creation, Grant run consumption, and durable database inspection. The
Pairing and Consent/Targeting matrices must remain green. No later delivery or public-control claim
may be inferred.

## Reopen triggers

Reopen if a real consumer requires multiple Event sequences, Event payload extensions, a different
authority lookup, more than one run, asynchronous commit semantics, a new delivery state, or a
supported deployment guarantee.
