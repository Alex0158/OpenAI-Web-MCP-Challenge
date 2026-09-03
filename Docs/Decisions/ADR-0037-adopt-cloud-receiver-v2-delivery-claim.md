# ADR-0037 — Adopt Cloud Receiver v2 Delivery Claim and Lease

**Status:** Accepted for Feature 4 only
**Date:** 2026-09-02
**Owners:** Cloud Receiver v2 implementation team
**Related:** ADR-0007, ADR-0008, ADR-0009, ADR-0010, ADR-0036, TASK-019
**Source contract:** [Feature 04 — Delivery Claim and Lease](../Cloud-Receiver-Handoff/v2-build/04-delivery-claim-and-lease.md)

## Context

Feature 3 creates one durable pending delivery for an active Grant. Feature 4 is the next
outbound boundary: a Local Connector must claim at most one eligible delivery with a short durable
lease. The existing Core and Local Connector already define the v0.1 route, request fields, lease
projection, replay behavior, and empty `204` response. This ADR records the corrected v2 defaults
and exhaustion semantics without changing that protocol.

Cloud Receiver v1 remains retired historical evidence. The replacement is built in
`saas-boilerplate/`; no v1 runtime, database, pairing implementation, or Local Connector production
change is authorized by this ADR.

## Decision

### 1. Preserve the existing v0.1 claim boundary

1. The only Feature 4 route is `POST /v0.1/delivery-claims`.
2. The JSON request contains exactly `connector_token` and `claim_token`.
3. The Connector token remains in the JSON body, not an `Authorization` header. The request carries
   no browser cookie or organization API key.
4. Work returns the existing canonical `200` lease/receipt envelope. No work returns an empty
   `204 No Content` with no `Content-Type`.
5. The `lease_token` equals the submitted claim token. The lease and receipt expose only the
   existing safe continuation context and no Connector token or private binding value.

### 2. Adopt the bounded v2 defaults

- Maximum delivery attempts: `3`.
- Lease duration: `60 seconds`.
- Local Connector polling interval: `5 seconds`.
- Local Connector delivery request timeout: `5 seconds`.

The request timeout is the delivery transport timeout. It does not alter the existing pairing
timeout or tokenless pairing replay behavior.

### 3. Adopt the corrected exhaustion and replay semantics

1. Claim verifies the Connector token and fixed target, hashes the claim token, selects one eligible
   pending delivery, and atomically creates or reclaims one lease.
2. Replaying the same claim token from its owning Connector while the lease is live returns the same
   lease with `duplicate: true` and does not increment the attempt.
3. A genuine wrong-target test uses a fresh claim token and returns `204` without exposing the
   delivery. Reusing the same claim token from another Connector remains a scope error.
4. After the third lease expires, the Receiver atomically stores `retry_exhausted` with
   `current_attempt = 3`. A later claim returns the same empty `204` as no work. Exhaustion is
   intentionally not exposed as a new v0.1 HTTP status or error code.
5. Invalid Connector identity remains a `401`/`403` `connector_identity_invalid` failure. It must
   not be confused with valid no-work/exhaustion behavior.

### 4. Require durable atomicity and evidence

The v2 implementation must use PostgreSQL transaction/locking or compare-and-set semantics for
same-target races, same-token replay, expired-lease reclaim, and attempt exhaustion. The test
harness must inspect durable state directly without adding a production state-inspection route. It
must prove digest-only token storage, process-restart behavior, receipt/continuation consistency,
and no secret leakage.

## Explicit exclusions

- Delivery Acknowledgement, Host-effect authority, Agent activation, and acknowledgement routes;
- any change to Core source, Local Connector source, pairing/tokenless replay, or protocol `0.1`;
- a new HTTP status or error code distinguishing exhausted delivery from no work;
- a production durable-state inspection endpoint, broker, push channel, inbound Mac connection,
  deployment guarantee, or multi-region claim guarantee.

## Consequences

### Positive

- The Cloud Receiver v2 remains compatible with the existing Local Connector.
- Retry exhaustion is durable and observable to operators/tests without expanding the public wire
  contract.
- Same-token replay, fresh-token wrong-target isolation, and cross-Connector scope errors remain
  unambiguous at their respective authority boundaries.

### Costs and risks

- The wire response cannot distinguish no work from an exhausted delivery; operational evidence must
  inspect durable state.
- The three-attempt and sixty-second defaults are intentionally bounded Feature 4 profile values;
  changing them requires a new decision or explicit amendment.
- Acknowledgement remains a later gate and cannot be inferred from a successful lease or local
  process execution.

## Verification gate

Before Feature 4 closure, `CLAIM-001`–`CLAIM-005` must pass through the real v2 HTTP handler and
disposable PostgreSQL, including concurrent claims, same-token replay, process restart, fresh-token
wrong-target isolation, same-token cross-Connector scope rejection, expired-lease reclaim, and
durable `retry_exhausted` state. Pairing/tokenless-replay and earlier Feature 1–3 regressions must
remain green. No acknowledgement or protocol-change claim may be made from this ADR.

## Reopen triggers

Reopen if the v2 team needs to expose exhaustion over HTTP, change the retry/lease/poll/timeout
defaults, permit a different token replay rule, move token placement, add an acknowledgement route,
or modify Core/Local Connector behavior.
