# TASK-019: Build Cloud Receiver v2 Delivery Claim and Lease

**Status:** `closed` — Feature 4 locally verified and committed at `d840439efe628a24c89fec6b74f37f04a701cb58`
**Owner:** Cloud Receiver v2 delivery-claim implementation team
**Profile:** Assured
**Scope:** `saas-boilerplate/` only, plus this Task and its owning ADR/evidence records
**Authority:** [ADR-0037](../Decisions/ADR-0037-adopt-cloud-receiver-v2-delivery-claim.md)
**Source contract:** [Feature 04 — Delivery Claim and Lease](../Cloud-Receiver-Handoff/v2-build/04-delivery-claim-and-lease.md)

## Task Control

- Type: `implementation`
- Lifecycle: `closed`
- Priority: `P0`
- Owner: Cloud Receiver v2 implementation team.
- Current increment: The complete CLAIM-001 through CLAIM-005 red matrix and the smallest green Prisma/Express
  claim and lease boundary are complete.
- Next gate: Delivery Acknowledgement is a separate future Task/ADR. It has not started here.
- Dependencies: [ADR-0037](../Decisions/ADR-0037-adopt-cloud-receiver-v2-delivery-claim.md),
  [ADR-0007](../Decisions/ADR-0007-freeze-reentry-core-v0.1-contract-kernel.md),
  [ADR-0008](../Decisions/ADR-0008-freeze-receiver-authority-and-durable-reservation.md),
  [ADR-0009](../Decisions/ADR-0009-freeze-connector-lease-and-effect-acknowledgement.md),
  [ADR-0010](../Decisions/ADR-0010-freeze-receiver-http-and-connector-transport.md), and
  [TASK-017](TASK-017-build-cloud-receiver-v2-signed-event-ingress.md).

## Objective

Implement the smallest Cloud Receiver v2 Delivery Claim boundary after the red gate: authenticate
one Connector, select one eligible target-scoped pending delivery, and create or replay one durable
short lease without changing the Local Connector or v0.1 protocol.

## Accepted contract

- Route: `POST /v0.1/delivery-claims`.
- Request fields: exactly `connector_token` and `claim_token` in JSON; no browser cookie or
  organization bearer.
- Defaults: maximum `3` delivery attempts, `60-second` lease, `5-second` Connector polling, and
  `5-second` delivery request timeout. Pairing's existing timeout and tokenless replay behavior are
  outside this task and must remain unchanged.
- No work and exhausted delivery both return an empty `204` with no `Content-Type`.
- An exhausted delivery is durably stored as `retry_exhausted` with `current_attempt = 3`; the wire
  response does not distinguish it from no work.
- A live replay with the same claim token and owning Connector returns the same lease with
  `duplicate: true`. A genuine wrong-target test uses a fresh claim token. Reusing the same claim
  token from another Connector remains a scope error.
- Lease expiry is bounded by the lease, Grant, and Connector expiry; raw claim tokens and private
  bindings never enter responses or logs.

## Acceptance gates

- `CLAIM-001`–`CLAIM-005` pass through the real v2 HTTP handler and durable PostgreSQL (`5/5`).
- Two concurrent claims cannot create two live leases or increment the attempt count twice.
- Same-token replay is exact and durable across process restart; expired leases reclaim only within
  the three-attempt bound.
- Wrong-target, same-token cross-Connector, invalid-identity, no-work, and exhausted cases preserve
  their distinct state/scope semantics while keeping no-work/exhaustion wire responses identical.
- Durable inspection proves `retry_exhausted`, `current_attempt = 3`, digest-only token storage, and
  preserved receipt/continuation context.
- Pairing/tokenless-replay regressions remain green; no Local Connector production file changes.

## 4. Non-goals

- Do not implement Delivery Acknowledgement, Host-effect verification, Agent activation, or any
  acknowledgement route.
- Do not change Connector route names, request/response fields, token placement, status meanings, or
  protocol `0.1`.
- Do not alter pairing, tokenless duplicate replay, `reentry-core/`, the retired v1 Receiver, frozen
  `mvp/`, or immutable reference snapshots.
- Do not expose a new exhaustion status or production durable-state inspection endpoint.

## 5. Verification and closure

The red phase failed at the absent v2 lease behavior against the disposable PostgreSQL database:
all five cases received the existing placeholder `204` instead of the required work `200`. Green
closure passed the five claim cases through the real Express handler and durable PostgreSQL,
including concurrent claims, same-token replay after app restart, fresh-token wrong-target isolation,
cross-Connector scope rejection, three-attempt expiry/exhaustion, canonical receipt projection, and
secret redaction. The complete backend aggregate passed `8` suites and `31/31` tests; unchanged
Re-entry Core verification also passed.
Exact runtime, database, commands, durable assertions, and claim limits are recorded in
[CLOUD-017](../Development/CLOUD-017-cloud-receiver-v2-delivery-claim.md). No Acknowledgement, public
Grant, or deployment claim is made by this Task.

## 6. Reopen condition

Reopen this Task if the implementation requires a new HTTP status for exhaustion, a different retry
bound or lease duration, a different claim-token replay rule, a Connector protocol change, or any
acknowledgement behavior.
